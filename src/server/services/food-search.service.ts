import { and, eq, ilike, isNull } from 'drizzle-orm';
import db from '@/server/db';
import {
  foodAltMeasures,
  foodPhotos,
  foods,
} from '@/server/db/schema';
import * as fatSecretClient from '@/lib/fatsecret';
import {
  normalizeImages,
  normalizeFoods,
  normalizeServings,
  type FatSecretSearchFood,
} from '@/types/fatsecret';

export interface FoodSearchResultItem {
  id: string | null;
  fatSecretId: string;
  name: string;
  brandName: string | null;
  foodType: 'Generic' | 'Brand';
  thumbnail: string | null;
  calories: number | null;
  isLocal: boolean;
}

export interface SearchPagination {
  page: number;
  totalResults: number;
  maxResults: number;
}


function isFatSecretEnabled(): boolean {
  return process.env.FATSECRET_ENABLED !== 'false';
}

async function searchLocalFoods(keyword: string) {
  return db
    .select({
      id: foods.id,
      sourceId: foods.sourceId,
      name: foods.name,
      brandName: foods.brandName,
      foodType: foods.foodType,
      calories: foods.calories,
      thumb: foodPhotos.thumb,
    })
    .from(foods)
    .leftJoin(foodPhotos, eq(foodPhotos.foodId, foods.id))
    .where(
      and(
        isNull(foods.userId),
        ilike(foods.name, `%${keyword}%`),
      ),
    )
    .limit(20);
}


function deduplicateAgainstLocal(
  fatSecretFoods: FatSecretSearchFood[],
  localFoods: Array<{ sourceId: string | null }>,
): FatSecretSearchFood[] {
  const localSourceIds = new Set(
    localFoods.map((f) => f.sourceId).filter(Boolean),
  );
  return fatSecretFoods.filter((f) => !localSourceIds.has(f.food_id));
}

async function saveFatSecretFoodsAsync(
  searchFoods: FatSecretSearchFood[],
): Promise<void> {
  for (const food of searchFoods) {
    try {
      // Skip if already persisted (guards against races and stale deduplication)
      const existing = await db
        .select({ id: foods.id })
        .from(foods)
        .where(and(eq(foods.source, 'fatsecret'), eq(foods.sourceId, food.food_id)))
        .limit(1);
      if (existing.length > 0) continue;

      const servings = normalizeServings(food.servings.serving);

      // Find 100g base serving
      const baseServing =
        servings.find(
          (s) =>
            s.metric_serving_amount === '100.000' &&
            s.metric_serving_unit === 'g',
        ) ||
        servings.find((s) => s.serving_description.toLowerCase() === '100 g') ||
        servings[0];

      if (!baseServing) continue;

      const fullNutrients: Record<string, number | string | null> = {
        saturatedFat: baseServing.saturated_fat ? parseFloat(baseServing.saturated_fat) : null,
        polyunsaturatedFat: baseServing.polyunsaturated_fat ? parseFloat(baseServing.polyunsaturated_fat) : null,
        monounsaturatedFat: baseServing.monounsaturated_fat ? parseFloat(baseServing.monounsaturated_fat) : null,
        cholesterol: baseServing.cholesterol ? parseFloat(baseServing.cholesterol) : null,
        potassium: baseServing.potassium ? parseFloat(baseServing.potassium) : null,
        vitaminA: baseServing.vitamin_a ? parseFloat(baseServing.vitamin_a) : null,
        vitaminC: baseServing.vitamin_c ? parseFloat(baseServing.vitamin_c) : null,
        calcium: baseServing.calcium ? parseFloat(baseServing.calcium) : null,
        iron: baseServing.iron ? parseFloat(baseServing.iron) : null,
        foodType: food.food_type,
        foodUrl: food.food_url,
      };

      const inserted = await db
        .insert(foods)
        .values({
          source: 'fatsecret',
          sourceId: food.food_id,
          name: food.food_name,
          brandName: food.brand_name ?? null,
          foodType: food.food_type,
          servingQty: '100',
          servingUnit: 'g',
          servingWeightGrams: '100',
          calories: baseServing.calories,
          protein: baseServing.protein,
          carbs: baseServing.carbohydrate,
          fat: baseServing.fat,
          fiber: baseServing.fiber ?? null,
          sugar: baseServing.sugar ?? null,
          sodium: baseServing.sodium ?? null,
          fullNutrients,
          isRaw: false,
          userId: null,
        })
        .onConflictDoNothing()
        .returning({ id: foods.id });

      const foodId = inserted[0]?.id;
      if (!foodId) continue; // Already existed (conflict), skip alt measures and photos

      // Insert alt measures (exclude base serving)
      const altServings = servings.filter((s) => s !== baseServing);
      if (altServings.length > 0) {
        await db
          .insert(foodAltMeasures)
          .values(
            altServings.map((s, idx) => ({
              foodId,
              servingWeight: s.metric_serving_amount ?? '0',
              measure: s.serving_description,
              seq: idx + 1,
              qty: '1',
            })),
          )
          .onConflictDoNothing();
      }

      // Insert photos if present
      if (food.food_images) {
        const images = normalizeImages(food.food_images.food_image);
        let thumb: string | null = null;
        let medium: string | null = null;
        let highres: string | null = null;

        for (const img of images) {
          const url = img.image_url;
          if (url.includes('_72x72')) {
            thumb = url;
          } else if (url.includes('_400x400')) {
            medium = url;
          } else if (url.includes('_1024x1024')) {
            highres = url;
          }
        }

        if (thumb || medium || highres) {
          await db
            .insert(foodPhotos)
            .values({ foodId, thumb, medium, highres })
            .onConflictDoNothing();
        }
      }
    } catch (err) {
      console.error('[FatSecret] save error:', err);
    }
  }
}

function extractThumbnail(food: FatSecretSearchFood): string | null {
  if (!food.food_images) return null;
  const images = normalizeImages(food.food_images.food_image);
  return images.find((img) => img.image_url.includes('_72x72'))?.image_url ?? null;
}

function extractBaseCalories(food: FatSecretSearchFood): number | null {
  const servings = normalizeServings(food.servings.serving);
  const base =
    servings.find(
      (s) => s.metric_serving_amount === '100.000' && s.metric_serving_unit === 'g',
    ) ||
    servings.find((s) => s.serving_description.toLowerCase() === '100 g') ||
    servings[0];
  return base ? parseFloat(base.calories) : null;
}

function mergeResults(
  localFoods: Awaited<ReturnType<typeof searchLocalFoods>>,
  fatSecretFoods: FatSecretSearchFood[],
  page: number,
  totalResults: number,
): { results: FoodSearchResultItem[]; pagination: SearchPagination } {
  const localItems: FoodSearchResultItem[] = localFoods.map((f) => ({
    id: f.id,
    fatSecretId: f.sourceId!,
    name: f.name,
    brandName: f.brandName ?? null,
    foodType: (f.foodType === 'Brand' ? 'Brand' : 'Generic') as 'Generic' | 'Brand',
    thumbnail: f.thumb ?? null,
    calories: f.calories ? parseFloat(f.calories) : null,
    isLocal: true,
  }));

  const fatSecretItems: FoodSearchResultItem[] = fatSecretFoods.map((f) => ({
    id: null,
    fatSecretId: f.food_id,
    name: f.food_name,
    brandName: f.brand_name ?? null,
    foodType: f.food_type,
    thumbnail: extractThumbnail(f),
    calories: extractBaseCalories(f),
    isLocal: false,
  }));

  const results = page === 1
    ? [...localItems, ...fatSecretItems]
    : fatSecretItems;

  return {
    results,
    pagination: {
      page,
      totalResults,
      maxResults: 10,
    },
  };
}

export const foodSearchService = {
  async search(
    keyword: string,
    page: number,
  ): Promise<{ results: FoodSearchResultItem[]; pagination: SearchPagination }> {
    const normalizedKeyword = keyword.toLowerCase().trim();

    const localFoods = await searchLocalFoods(normalizedKeyword);

    if (!isFatSecretEnabled()) {
      return {
        results: localFoods.map((f) => ({
          id: f.id,
          fatSecretId: f.sourceId!,
          name: f.name,
          brandName: f.brandName ?? null,
          foodType: (f.foodType === 'Brand' ? 'Brand' : 'Generic') as 'Generic' | 'Brand',
          thumbnail: f.thumb ?? null,
          calories: f.calories ? parseFloat(f.calories) : null,
          isLocal: true,
        })),
        pagination: {
          page: 1,
          totalResults: localFoods.length,
          maxResults: 10,
        },
      };
    }

    let fatSecretFoods: FatSecretSearchFood[] = [];
    let totalResults = localFoods.length;

    try {
      const searchResponse = await fatSecretClient.searchFoods(normalizedKeyword, page);
      const rawFoods = normalizeFoods(searchResponse.foods_search.results.food);
      totalResults = parseInt(searchResponse.foods_search.total_results, 10) || 0;
      fatSecretFoods = deduplicateAgainstLocal(rawFoods, localFoods);

      // Fire-and-forget save
      saveFatSecretFoodsAsync(fatSecretFoods).catch((err) =>
        console.error('[FatSecret] save error:', err),
      );
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes('429')
      ) {
        console.warn('[FatSecret] rate limit event');
      } else {
        console.error('[FatSecret] search error:', err);
      }
      // Return local results only on error
      fatSecretFoods = [];
      totalResults = localFoods.length;
    }

    return mergeResults(localFoods, fatSecretFoods, page, totalResults);
  },

};
