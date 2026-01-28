import { db } from '@/server/db';
import { foodAltMeasures, foodPhotos, foods } from '@/server/db/schema';
import { and, eq, or, sql } from 'drizzle-orm';

import { searchCache } from './cache';
import type {
  NutritionSource,
  NutritionSourceFood,
  NutritionSourceSearchOptions,
  SearchAggregatorResult,
  SourceStatus,
} from './types';
import { fetchFatSecretFoodDetails, fatSecretSource } from './fatsecret';
import { getFoodImageUrlForFoodUrl } from './food-image';
import { usdaSource } from './usda';
import { createMockSources } from './mock-sources';

type SearchOptions = NutritionSourceSearchOptions;

function normalizeDbSource(source: string): NutritionSourceFood['source'] {
  if (source === 'usda' || source === 'fatsecret') {
    return source;
  }
  return 'database';
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0;
}

function normalizeForDedup(name: string, brand?: string | null): string {
  return [name, brand]
    .filter(Boolean)
    .join('|')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeNameForSimilarity(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

function tokenJaccard(a: string, b: string): number {
  const aTokens = new Set(a.split(' ').filter(Boolean));
  const bTokens = new Set(b.split(' ').filter(Boolean));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  let intersection = 0;
  for (const t of aTokens) {
    if (bTokens.has(t)) intersection += 1;
  }
  const union = aTokens.size + bTokens.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function per100g(food: NutritionSourceFood): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium?: number;
} | null {
  const grams = food.servingWeightGrams;
  if (!grams || grams <= 0) return null;
  const factor = 100 / grams;
  return {
    calories: food.calories * factor,
    protein: food.protein * factor,
    carbs: food.carbs * factor,
    fat: food.fat * factor,
    sodium: food.sodium !== undefined ? food.sodium * factor : undefined,
  };
}

function isDuplicateFood(a: NutritionSourceFood, b: NutritionSourceFood): boolean {
  const brandA = (a.brandName ?? '').trim();
  const brandB = (b.brandName ?? '').trim();
  if (normalizeForDedup(a.name, brandA) === normalizeForDedup(b.name, brandB)) return true;

  // Fuzzy match only when brands are compatible.
  if (brandA && brandB && normalizeForDedup('', brandA) !== normalizeForDedup('', brandB)) {
    return false;
  }

  const nameA = normalizeNameForSimilarity(a.name);
  const nameB = normalizeNameForSimilarity(b.name);
  const sim = tokenJaccard(nameA, nameB);
  if (sim < 0.9) return false;

  const pA = per100g(a);
  const pB = per100g(b);
  if (!pA || !pB) {
    // Without comparable units, be conservative.
    return sim >= 0.95;
  }

  const close = (x: number, y: number, abs: number, pct: number) => {
    const diff = Math.abs(x - y);
    if (diff <= abs) return true;
    const denom = Math.max(1, (Math.abs(x) + Math.abs(y)) / 2);
    return diff / denom <= pct;
  };

  return (
    close(pA.calories, pB.calories, 20, 0.08) &&
    close(pA.protein, pB.protein, 3, 0.12) &&
    close(pA.carbs, pB.carbs, 3, 0.12) &&
    close(pA.fat, pB.fat, 3, 0.12)
  );
}

function priority(source: NutritionSourceFood['source']): number {
  // Lower = higher priority.
  switch (source) {
    case 'fatsecret':
      return 1;
    case 'usda':
      return 2;
    case 'database':
    default:
      return 3;
  }
}

async function searchDatabase(query: string): Promise<NutritionSourceFood[]> {
  const q = query.toLowerCase();
  const pattern = `%${q}%`;

  const rows = await db.query.foods.findMany({
    where: or(
      sql`lower(${foods.name}) like ${pattern}`,
      sql`lower(coalesce(${foods.brandName}, '')) like ${pattern}`,
    ),
    with: {
      photo: true,
    },
    limit: 25,
  });

  return rows.map((row) => ({
    id: row.id,
    sourceId: row.sourceId ?? String(row.id),
    source: normalizeDbSource(row.source),
    name: row.name,
    brandName: row.brandName ?? null,
    isCustom: row.isCustom ?? false,
    servingQty: asNumber(row.servingQty),
    servingUnit: row.servingUnit ?? 'serving',
    servingWeightGrams: row.servingWeightGrams ? asNumber(row.servingWeightGrams) : undefined,
    calories: asNumber(row.calories),
    protein: asNumber(row.protein),
    carbs: asNumber(row.carbs),
    fat: asNumber(row.fat),
    fiber: row.fiber ? asNumber(row.fiber) : undefined,
    sugar: row.sugar ? asNumber(row.sugar) : undefined,
    sodium: row.sodium ? asNumber(row.sodium) : undefined,
    isRaw: row.isRaw ?? false,
    photo: row.photo
      ? {
          thumb: row.photo.thumb ?? undefined,
          highres: row.photo.highres ?? undefined,
        }
      : null,
  }));
}

export async function persistFood(food: NutritionSourceFood): Promise<NutritionSourceFood> {
  const usingMockSources = process.env.USE_MOCK_NUTRITION_SOURCES === 'true';

  let foodToPersist = food;
  let altMeasuresToInsert: Array<{ servingWeight: number; measure: string; qty: number; seq: number }> = [];
  let imageUrlPromise: Promise<string | null> | null = null;

  if (food.source === 'fatsecret' && !usingMockSources && fatSecretSource.isConfigured()) {
    try {
      const details = await fetchFatSecretFoodDetails(food.sourceId);

      // Always prefer the details endpoint values on selection.
      foodToPersist = {
        ...food,
        ...details.food,
        source: 'fatsecret',
        sourceId: food.sourceId,
      };

      altMeasuresToInsert = details.altMeasures;

      const foodUrl = details.food.foodUrl ?? food.foodUrl;
      if (foodUrl) {
        imageUrlPromise = getFoodImageUrlForFoodUrl(foodUrl).catch(() => null);
      }
    } catch (error) {
      // Graceful degradation: persist what we have.
      console.error('Failed to enrich FatSecret food details:', error);
    }
  }

  const existingBySource = await db.query.foods.findFirst({
    where: and(eq(foods.sourceId, foodToPersist.sourceId), eq(foods.source, foodToPersist.source)),
    with: { photo: true },
  });

  if (existingBySource) {
    return {
      id: existingBySource.id,
      sourceId: existingBySource.sourceId ?? String(existingBySource.id),
      source: normalizeDbSource(existingBySource.source),
      name: existingBySource.name,
      brandName: existingBySource.brandName ?? null,
      servingQty: asNumber(existingBySource.servingQty),
      servingUnit: existingBySource.servingUnit ?? 'serving',
      servingWeightGrams: existingBySource.servingWeightGrams
        ? asNumber(existingBySource.servingWeightGrams)
        : undefined,
      calories: asNumber(existingBySource.calories),
      protein: asNumber(existingBySource.protein),
      carbs: asNumber(existingBySource.carbs),
      fat: asNumber(existingBySource.fat),
      fiber: existingBySource.fiber ? asNumber(existingBySource.fiber) : undefined,
      sugar: existingBySource.sugar ? asNumber(existingBySource.sugar) : undefined,
      sodium: existingBySource.sodium ? asNumber(existingBySource.sodium) : undefined,
      isRaw: existingBySource.isRaw ?? false,
      photo: existingBySource.photo
        ? {
            thumb: existingBySource.photo.thumb ?? undefined,
            highres: existingBySource.photo.highres ?? undefined,
          }
        : null,
    };
  }

  const existingByName = await db.query.foods.findFirst({
    where: and(
      sql`lower(${foods.name}) = ${foodToPersist.name.toLowerCase()}`,
      sql`lower(coalesce(${foods.brandName}, '')) = ${(foodToPersist.brandName ?? '').toLowerCase()}`,
    ),
    with: { photo: true },
  });

  if (existingByName) {
    // Keep the first stored record; avoids DB bloat.
    return {
      id: existingByName.id,
      sourceId: existingByName.sourceId ?? String(existingByName.id),
      source: normalizeDbSource(existingByName.source),
      name: existingByName.name,
      brandName: existingByName.brandName ?? null,
      servingQty: asNumber(existingByName.servingQty),
      servingUnit: existingByName.servingUnit ?? 'serving',
      servingWeightGrams: existingByName.servingWeightGrams
        ? asNumber(existingByName.servingWeightGrams)
        : undefined,
      calories: asNumber(existingByName.calories),
      protein: asNumber(existingByName.protein),
      carbs: asNumber(existingByName.carbs),
      fat: asNumber(existingByName.fat),
      fiber: existingByName.fiber ? asNumber(existingByName.fiber) : undefined,
      sugar: existingByName.sugar ? asNumber(existingByName.sugar) : undefined,
      sodium: existingByName.sodium ? asNumber(existingByName.sodium) : undefined,
      isRaw: existingByName.isRaw ?? false,
      photo: existingByName.photo
        ? {
            thumb: existingByName.photo.thumb ?? undefined,
            highres: existingByName.photo.highres ?? undefined,
          }
        : null,
    };
  }

  const [inserted] = await db
    .insert(foods)
    .values({
      sourceId: foodToPersist.sourceId,
      source: foodToPersist.source,
      name: foodToPersist.name,
      brandName: foodToPersist.brandName ?? null,
      servingQty: String(foodToPersist.servingQty),
      servingUnit: foodToPersist.servingUnit,
      servingWeightGrams: foodToPersist.servingWeightGrams ? String(foodToPersist.servingWeightGrams) : null,
      calories: String(foodToPersist.calories),
      protein: String(foodToPersist.protein),
      carbs: String(foodToPersist.carbs),
      fat: String(foodToPersist.fat),
      fiber: foodToPersist.fiber !== undefined ? String(foodToPersist.fiber) : null,
      sugar: foodToPersist.sugar !== undefined ? String(foodToPersist.sugar) : null,
      sodium: foodToPersist.sodium !== undefined ? String(foodToPersist.sodium) : null,
      fullNutrients: foodToPersist.fullNutrients ?? null,
      isRaw: foodToPersist.isRaw ?? false,
      isCustom: false,
    })
    .returning();

  if (altMeasuresToInsert.length > 0) {
    await db.insert(foodAltMeasures).values(
      altMeasuresToInsert.map((m) => ({
        foodId: inserted.id,
        servingWeight: String(m.servingWeight),
        measure: m.measure,
        seq: m.seq,
        qty: String(m.qty),
      })),
    );
  }

  let scrapedImageUrl: string | null = null;
  if (imageUrlPromise) {
    try {
      scrapedImageUrl = await withTimeout(imageUrlPromise, 1500);
    } catch {
      scrapedImageUrl = null;
    }
  }

  const desiredThumb = foodToPersist.photo?.thumb ?? scrapedImageUrl ?? null;
  const desiredHighres = foodToPersist.photo?.highres ?? scrapedImageUrl ?? null;

  if (desiredThumb || desiredHighres) {
    const existingPhoto = await db.query.foodPhotos.findFirst({
      where: eq(foodPhotos.foodId, inserted.id),
    });

    if (!existingPhoto) {
      await db.insert(foodPhotos).values({
        foodId: inserted.id,
        thumb: desiredThumb,
        highres: desiredHighres,
      });
    } else {
      await db
        .update(foodPhotos)
        .set({
          thumb: existingPhoto.thumb ?? desiredThumb,
          highres: existingPhoto.highres ?? desiredHighres,
        })
        .where(eq(foodPhotos.foodId, inserted.id));
    }
  }

  return {
    id: inserted.id,
    ...foodToPersist,
    sourceId: inserted.sourceId ?? foodToPersist.sourceId,
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  let attempt = 0;
  let delayMs = 100;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
      delayMs *= 3;
    }
  }
}

function getSources(): NutritionSource[] {
  if (process.env.USE_MOCK_NUTRITION_SOURCES === 'true') {
    return createMockSources();
  }

  return [fatSecretSource, usdaSource];
}

export async function searchAllSources(query: string, options?: SearchOptions): Promise<SearchAggregatorResult> {
  const page = options?.page ?? 0;
  const pageSize = options?.pageSize ?? 25;

  const safePage = Number.isFinite(page) && page >= 0 ? page : 0;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(pageSize, 50) : 25;

  const requiredLimit = Math.min((safePage + 1) * safePageSize, 100);

  const cacheKey = `search:${query.toLowerCase().trim()}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.fetchedLimit >= requiredLimit) {
    const sliceStart = safePage * safePageSize;
    const slice = cached.foods.slice(sliceStart, sliceStart + safePageSize);
    const sliceEnd = sliceStart + slice.length;
    const moreCached = cached.foods.length > sliceEnd;
    const maybeMoreRemote = cached.foods.length === cached.fetchedLimit && cached.fetchedLimit < 100;
    return {
      foods: slice,
      sources: [{ name: 'cache', status: 'success', count: slice.length }],
      fromCache: true,
      page: safePage,
      pageSize: safePageSize,
      hasMore: moreCached || maybeMoreRemote,
    };
  }

  const sources: SourceStatus[] = [];
  const dbStart = Date.now();
  const dbFoods = await searchDatabase(query);
  sources.push({ name: 'database', status: 'success', count: dbFoods.length, durationMs: Date.now() - dbStart });

  const adapters = getSources();

  const fatSecretAdapter = adapters.find((a) => a.name === 'fatsecret');
  const usdaAdapter = adapters.find((a) => a.name === 'usda');

  const runAdapter = async (
    adapter: NutritionSource | undefined,
  ): Promise<{ foods: NutritionSourceFood[]; status: SourceStatus }> => {
    if (!adapter) {
      return {
        foods: [],
        status: { name: 'cache', status: 'skipped', count: 0, error: 'adapter missing' },
      };
    }

    if (!adapter.isConfigured()) {
      return {
        foods: [],
        status: { name: adapter.name, status: 'skipped', count: 0, error: 'not configured' },
      };
    }

    const start = Date.now();
    try {
      const result = await withTimeout(
        withRetry(() => adapter.search(query, { page: 0, pageSize: requiredLimit }), 1),
        3000,
      );
      return {
        foods: result.foods,
        status: {
          name: adapter.name,
          status: 'success',
          count: result.foods.length,
          durationMs: Date.now() - start,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      return {
        foods: [],
        status: {
          name: adapter.name,
          status: message === 'timeout' ? 'timeout' : 'error',
          count: 0,
          error: message,
          durationMs: Date.now() - start,
        },
      };
    }
  };

  const fatSecretResult = await runAdapter(fatSecretAdapter);
  sources.push(fatSecretResult.status);

  let externalFoods = fatSecretResult.foods;

  if (fatSecretResult.status.status !== 'success' || fatSecretResult.foods.length === 0) {
    const usdaResult = await runAdapter(usdaAdapter);
    sources.push(usdaResult.status);
    externalFoods = [...externalFoods, ...usdaResult.foods];
  } else if (usdaAdapter) {
    sources.push({ name: 'usda', status: 'skipped', count: 0, error: 'fatsecret had results' });
  }

  const combined = [...dbFoods, ...externalFoods];

  // Prefer higher-quality sources first.
  combined.sort((a, b) => priority(a.source) - priority(b.source));

  const deduped: NutritionSourceFood[] = [];
  for (const food of combined) {
    if (deduped.some((existing) => isDuplicateFood(existing, food))) continue;
    deduped.push(food);
    if (deduped.length >= requiredLimit) break;
  }

  // Cache in-memory for subsequent pages.
  searchCache.set(cacheKey, { foods: deduped, fetchedLimit: requiredLimit });

  const sliceStart = safePage * safePageSize;
  const slice = deduped.slice(sliceStart, sliceStart + safePageSize);
  const sliceEnd = sliceStart + slice.length;
  const moreInMemory = deduped.length > sliceEnd;
  const maybeMoreRemote = deduped.length === requiredLimit && requiredLimit < 100;
  return {
    foods: slice,
    sources,
    fromCache: false,
    page: safePage,
    pageSize: safePageSize,
    hasMore: moreInMemory || maybeMoreRemote,
  };
}

