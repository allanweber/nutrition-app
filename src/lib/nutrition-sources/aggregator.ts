import { db } from '@/server/db';
import { foodPhotos, foods } from '@/server/db/schema';
import { and, eq, or, sql } from 'drizzle-orm';

import { barcodeCache, searchCache } from './cache';
import type {
  NutritionSource,
  NutritionSourceFood,
  NutritionSourceSearchOptions,
  SearchAggregatorResult,
  SourceStatus,
} from './types';
import { fatSecretSource } from './fatsecret';
import { openFoodFactsSource } from './openfoodfacts';
import { usdaSource } from './usda';
import { createMockSources } from './mock-sources';

type SearchOptions = NutritionSourceSearchOptions;

function normalizeDbSource(source: string): NutritionSourceFood['source'] {
  if (source === 'usda' || source === 'openfoodfacts' || source === 'fatsecret') {
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
    case 'usda':
      return 1;
    case 'openfoodfacts':
      return 2;
    case 'fatsecret':
      return 3;
    case 'database':
    default:
      return 4;
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
  const existingBySource = await db.query.foods.findFirst({
    where: and(eq(foods.sourceId, food.sourceId), eq(foods.source, food.source)),
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
      sql`lower(${foods.name}) = ${food.name.toLowerCase()}`,
      sql`lower(coalesce(${foods.brandName}, '')) = ${(food.brandName ?? '').toLowerCase()}`,
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
      sourceId: food.sourceId,
      source: food.source,
      name: food.name,
      brandName: food.brandName ?? null,
      servingQty: String(food.servingQty),
      servingUnit: food.servingUnit,
      servingWeightGrams: food.servingWeightGrams ? String(food.servingWeightGrams) : null,
      calories: String(food.calories),
      protein: String(food.protein),
      carbs: String(food.carbs),
      fat: String(food.fat),
      fiber: food.fiber !== undefined ? String(food.fiber) : null,
      sugar: food.sugar !== undefined ? String(food.sugar) : null,
      sodium: food.sodium !== undefined ? String(food.sodium) : null,
      fullNutrients: food.fullNutrients ?? null,
      isRaw: food.isRaw ?? false,
      isCustom: false,
    })
    .returning();

  if (food.photo && (food.photo.thumb || food.photo.highres)) {
    const existingPhoto = await db.query.foodPhotos.findFirst({
      where: eq(foodPhotos.foodId, inserted.id),
    });

    if (!existingPhoto) {
      await db.insert(foodPhotos).values({
        foodId: inserted.id,
        thumb: food.photo.thumb ?? null,
        highres: food.photo.highres ?? null,
      });
    } else {
      await db
        .update(foodPhotos)
        .set({
          thumb: existingPhoto.thumb ?? food.photo.thumb ?? null,
          highres: existingPhoto.highres ?? food.photo.highres ?? null,
        })
        .where(eq(foodPhotos.foodId, inserted.id));
    }
  }

  return {
    id: inserted.id,
    ...food,
    sourceId: inserted.sourceId ?? food.sourceId,
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

  return [usdaSource, openFoodFactsSource, fatSecretSource];
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

  const tasks = adapters.map(async (adapter) => {
    if (!adapter.isConfigured()) {
      return {
        adapter,
        status: { name: adapter.name, status: 'skipped', count: 0, error: 'not configured' } as SourceStatus,
        foods: [] as NutritionSourceFood[],
      };
    }

    const start = Date.now();
    try {
      const result = await withTimeout(
        withRetry(() => adapter.search(query, { page: 0, pageSize: requiredLimit }), 1),
        3000,
      );
      return {
        adapter,
        status: {
          name: adapter.name,
          status: 'success',
          count: result.foods.length,
          durationMs: Date.now() - start,
        } as SourceStatus,
        foods: result.foods,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      return {
        adapter,
        status: {
          name: adapter.name,
          status: message === 'timeout' ? 'timeout' : 'error',
          count: 0,
          error: message,
          durationMs: Date.now() - start,
        } as SourceStatus,
        foods: [] as NutritionSourceFood[],
      };
    }
  });

  const settled = await Promise.all(tasks);

  for (const item of settled) {
    sources.push(item.status);
  }

  const externalFoods = settled.flatMap((item) => item.foods);
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

export async function searchByBarcode(barcode: string): Promise<SearchAggregatorResult> {
  const cacheKey = `barcode:${barcode}`;
  const cached = barcodeCache.get(cacheKey);
  if (cached && cached.length > 0) {
    return {
      foods: cached,
      sources: [{ name: 'cache', status: 'success', count: cached.length }],
      fromCache: true,
    };
  }

  const sources: SourceStatus[] = [];

  // DB first (best-effort: only works when sourceId is UPC)
  const dbStart = Date.now();
  const dbMatch = await db.query.foods.findFirst({
    where: eq(foods.sourceId, barcode),
    with: { photo: true },
  });

  if (dbMatch) {
    const food: NutritionSourceFood = {
      id: dbMatch.id,
      sourceId: dbMatch.sourceId ?? String(dbMatch.id),
      source: normalizeDbSource(dbMatch.source),
      name: dbMatch.name,
      brandName: dbMatch.brandName ?? null,
      servingQty: asNumber(dbMatch.servingQty),
      servingUnit: dbMatch.servingUnit ?? 'serving',
      servingWeightGrams: dbMatch.servingWeightGrams ? asNumber(dbMatch.servingWeightGrams) : undefined,
      calories: asNumber(dbMatch.calories),
      protein: asNumber(dbMatch.protein),
      carbs: asNumber(dbMatch.carbs),
      fat: asNumber(dbMatch.fat),
      fiber: dbMatch.fiber ? asNumber(dbMatch.fiber) : undefined,
      sugar: dbMatch.sugar ? asNumber(dbMatch.sugar) : undefined,
      sodium: dbMatch.sodium ? asNumber(dbMatch.sodium) : undefined,
      photo: dbMatch.photo
        ? { thumb: dbMatch.photo.thumb ?? undefined, highres: dbMatch.photo.highres ?? undefined }
        : null,
    };

    sources.push({ name: 'database', status: 'success', count: 1, durationMs: Date.now() - dbStart });
    barcodeCache.set(cacheKey, [food]);
    return { foods: [food], sources, fromCache: false };
  }

  sources.push({ name: 'database', status: 'success', count: 0, durationMs: Date.now() - dbStart });

  const adapters = getSources();

  // Barcode priority: OpenFoodFacts first, then FatSecret.
  const ordered = adapters.sort((a, b) => {
    const p = (s: NutritionSource['name']) => (s === 'openfoodfacts' ? 1 : s === 'fatsecret' ? 2 : 3);
    return p(a.name) - p(b.name);
  });

  for (const adapter of ordered) {
    if (!adapter.getByBarcode) continue;
    if (!adapter.isConfigured()) {
      sources.push({ name: adapter.name, status: 'skipped', count: 0, error: 'not configured' });
      continue;
    }

    const start = Date.now();
    try {
      const result = await withTimeout(withRetry(() => adapter.getByBarcode!(barcode), 1), 3000);
      if (!result) {
        sources.push({ name: adapter.name, status: 'success', count: 0, durationMs: Date.now() - start });
        continue;
      }

      sources.push({ name: adapter.name, status: 'success', count: 1, durationMs: Date.now() - start });
      barcodeCache.set(cacheKey, [result]);
      return { foods: [result], sources, fromCache: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      sources.push({ name: adapter.name, status: message === 'timeout' ? 'timeout' : 'error', count: 0, error: message, durationMs: Date.now() - start });
    }
  }

  return { foods: [], sources, fromCache: false };
}
