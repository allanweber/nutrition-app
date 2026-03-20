import Image from 'next/image';
import Link from 'next/link';
import { and, eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import db from '@/server/db';
import { foodAltMeasures, foodPhotos, foods } from '@/server/db/schema';
import * as fatSecretClient from '@/lib/fatsecret';
import { normalizeImages, normalizeServings } from '@/types/fatsecret';

interface PageProps {
  params: Promise<{ fatSecretId: string }>;
}

interface FoodData {
  id: number | null;
  name: string;
  brandName: string | null;
  foodType: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  potassium: number | null;
  saturatedFat: number | null;
  vitaminA: number | null;
  vitaminC: number | null;
  calcium: number | null;
  iron: number | null;
  images: { thumb: string | null; medium: string | null; highres: string | null } | null;
  servings: Array<{
    id: number;
    description: string;
    weightGrams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
}

async function getFoodFromDB(fatSecretId: string): Promise<FoodData | null> {
  const rows = await db
    .select({ food: foods, photo: foodPhotos, altMeasure: foodAltMeasures })
    .from(foods)
    .leftJoin(foodPhotos, eq(foodPhotos.foodId, foods.id))
    .leftJoin(foodAltMeasures, eq(foodAltMeasures.foodId, foods.id))
    .where(and(eq(foods.source, 'fatsecret'), eq(foods.sourceId, fatSecretId)));

  if (rows.length === 0) return null;

  const food = rows[0].food;
  const photo = rows[0].photo ?? null;
  const fullNutrients = (food.fullNutrients as Record<string, unknown>) ?? {};
  const getNum = (key: string): number | null => {
    const v = fullNutrients[key];
    return typeof v === 'number' ? v : null;
  };

  const altMeasures = rows
    .map((r) => r.altMeasure)
    .filter((m): m is NonNullable<typeof m> => m !== null);

  const baseCalories = food.calories ? parseFloat(food.calories) : null;
  const baseProtein = food.protein ? parseFloat(food.protein) : null;
  const baseCarbs = food.carbs ? parseFloat(food.carbs) : null;
  const baseFat = food.fat ? parseFloat(food.fat) : null;

  return {
    id: food.id,
    name: food.name,
    brandName: food.brandName ?? null,
    foodType: food.foodType ?? null,
    calories: baseCalories,
    protein: baseProtein,
    carbs: baseCarbs,
    fat: baseFat,
    fiber: food.fiber ? parseFloat(food.fiber) : null,
    sugar: food.sugar ? parseFloat(food.sugar) : null,
    sodium: food.sodium ? parseFloat(food.sodium) : null,
    potassium: getNum('potassium'),
    saturatedFat: getNum('saturatedFat'),
    vitaminA: getNum('vitaminA'),
    vitaminC: getNum('vitaminC'),
    calcium: getNum('calcium'),
    iron: getNum('iron'),
    images:
      photo && (photo.thumb || photo.medium || photo.highres)
        ? { thumb: photo.thumb ?? null, medium: photo.medium ?? null, highres: photo.highres ?? null }
        : null,
    servings: altMeasures.map((m) => {
      const w = parseFloat(m.servingWeight);
      return {
        id: m.id,
        description: m.measure,
        weightGrams: w,
        calories: parseFloat(((baseCalories ?? 0) * w / 100).toFixed(0)),
        protein: parseFloat(((baseProtein ?? 0) * w / 100).toFixed(1)),
        carbs: parseFloat(((baseCarbs ?? 0) * w / 100).toFixed(1)),
        fat: parseFloat(((baseFat ?? 0) * w / 100).toFixed(1)),
      };
    }),
  };
}

async function getFoodFromFatSecret(fatSecretId: string): Promise<FoodData | null> {
  const fsFood = await fatSecretClient.getFoodById(fatSecretId);

  const servings = normalizeServings(fsFood.servings.serving);
  const baseServing =
    servings.find(
      (s) => s.metric_serving_amount === '100.000' && s.metric_serving_unit === 'g',
    ) ||
    servings.find((s) => s.serving_description.toLowerCase() === '100 g') ||
    servings[0];

  if (!baseServing) return null;

  const images = fsFood.food_images ? normalizeImages(fsFood.food_images.food_image) : [];
  let thumb: string | null = null;
  let medium: string | null = null;
  let highres: string | null = null;
  for (const img of images) {
    if (img.image_url.includes('_72x72')) thumb = img.image_url;
    else if (img.image_url.includes('_400x400')) medium = img.image_url;
    else if (img.image_url.includes('_1024x1024')) highres = img.image_url;
  }

  return {
    id: null,
    name: fsFood.food_name,
    brandName: fsFood.brand_name ?? null,
    foodType: fsFood.food_type,
    calories: parseFloat(baseServing.calories),
    protein: parseFloat(baseServing.protein),
    carbs: parseFloat(baseServing.carbohydrate),
    fat: parseFloat(baseServing.fat),
    fiber: baseServing.fiber ? parseFloat(baseServing.fiber) : null,
    sugar: baseServing.sugar ? parseFloat(baseServing.sugar) : null,
    sodium: baseServing.sodium ? parseFloat(baseServing.sodium) : null,
    potassium: baseServing.potassium ? parseFloat(baseServing.potassium) : null,
    saturatedFat: baseServing.saturated_fat ? parseFloat(baseServing.saturated_fat) : null,
    vitaminA: baseServing.vitamin_a ? parseFloat(baseServing.vitamin_a) : null,
    vitaminC: baseServing.vitamin_c ? parseFloat(baseServing.vitamin_c) : null,
    calcium: baseServing.calcium ? parseFloat(baseServing.calcium) : null,
    iron: baseServing.iron ? parseFloat(baseServing.iron) : null,
    images: thumb || medium || highres ? { thumb, medium, highres } : null,
    servings: servings
      .filter((s) => s !== baseServing)
      .map((s, i) => {
        const w = parseFloat(s.metric_serving_amount ?? '0') || 0;
        const baseCalories = parseFloat(baseServing.calories);
        const baseProtein = parseFloat(baseServing.protein);
        const baseCarbs = parseFloat(baseServing.carbohydrate);
        const baseFat = parseFloat(baseServing.fat);
        return {
          id: i + 1,
          description: s.serving_description,
          weightGrams: w,
          calories: parseFloat((baseCalories * w / 100).toFixed(0)),
          protein: parseFloat((baseProtein * w / 100).toFixed(1)),
          carbs: parseFloat((baseCarbs * w / 100).toFixed(1)),
          fat: parseFloat((baseFat * w / 100).toFixed(1)),
        };
      }),
  };
}

async function cacheFoodToDB(fatSecretId: string, food: FoodData): Promise<void> {
  try {
    const fsFood = await fatSecretClient.getFoodById(fatSecretId);
    const servings = normalizeServings(fsFood.servings.serving);
    const baseServing =
      servings.find(
        (s) => s.metric_serving_amount === '100.000' && s.metric_serving_unit === 'g',
      ) ||
      servings.find((s) => s.serving_description.toLowerCase() === '100 g') ||
      servings[0];
    if (!baseServing) return;

    const inserted = await db
      .insert(foods)
      .values({
        source: 'fatsecret',
        sourceId: fatSecretId,
        name: food.name,
        brandName: food.brandName ?? null,
        foodType: food.foodType ?? null,
        servingQty: '100',
        servingUnit: 'g',
        servingWeightGrams: '100',
        calories: String(food.calories),
        protein: String(food.protein),
        carbs: String(food.carbs),
        fat: String(food.fat),
        fiber: food.fiber !== null ? String(food.fiber) : null,
        sugar: food.sugar !== null ? String(food.sugar) : null,
        sodium: food.sodium !== null ? String(food.sodium) : null,
        fullNutrients: {
          saturatedFat: food.saturatedFat,
          potassium: food.potassium,
          vitaminA: food.vitaminA,
          vitaminC: food.vitaminC,
          calcium: food.calcium,
          iron: food.iron,
          foodType: food.foodType,
        },
        isRaw: false,
        isCustom: false,
        userId: null,
      })
      .onConflictDoNothing()
      .returning({ id: foods.id });

    const foodId = inserted[0]?.id;
    if (!foodId) return;

    if (food.images?.thumb || food.images?.medium || food.images?.highres) {
      await db
        .insert(foodPhotos)
        .values({
          foodId,
          thumb: food.images.thumb ?? null,
          medium: food.images.medium ?? null,
          highres: food.images.highres ?? null,
        })
        .onConflictDoNothing();
    }
  } catch (err) {
    console.error('[fatsecret:detail] cache error:', err);
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { fatSecretId } = await params;
  try {
    const food = await getFoodFromDB(fatSecretId);
    if (food) {
      return {
        title: `${food.name} — Nutrition Facts`,
        description: `Nutritional information for ${food.name}: calories, protein, carbs, fat, and more.`,
        openGraph: {
          title: food.name,
          images: food.images?.medium ? [food.images.medium] : [],
        },
      };
    }
  } catch {
    // fallback
  }
  return {
    title: 'Food Nutrition Facts',
    description: 'View detailed nutritional information for this food.',
  };
}

export default async function FoodDetailPage({ params }: PageProps) {
  const { fatSecretId } = await params;

  let food: FoodData | null = null;
  let source: 'db' | 'fatsecret' | 'error' = 'db';

  // 1. Try local DB first
  try {
    food = await getFoodFromDB(fatSecretId);
  } catch (err) {
    console.error('[fatsecret:detail] DB query error:', err);
  }

  // 2. FatSecret API fallback on DB miss
  if (!food) {
    try {
      console.log('[fatsecret:detail] DB miss, fetching from FatSecret:', fatSecretId);
      food = await getFoodFromFatSecret(fatSecretId);
      source = 'fatsecret';
      console.log('[fatsecret:detail] Fetched from FatSecret:', fatSecretId, food?.name);

      // T036: Fire-and-forget cache to DB
      if (food) {
        cacheFoodToDB(fatSecretId, food).catch((err) =>
          console.error('[fatsecret:detail] background cache error:', err),
        );
      }
    } catch (err) {
      source = 'error';
      if (err instanceof Error && err.message.includes('429')) {
        console.error('[fatsecret:detail] rate-limit event:', fatSecretId);
      } else if (err instanceof Error && err.message.includes('404')) {
        console.error('[fatsecret:detail] not-found:', fatSecretId);
      } else {
        console.error('[fatsecret:detail] fetch error:', fatSecretId, err);
      }
    }
  }

  // Error page
  if (!food || source === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            We couldn&rsquo;t load this food
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            This food may be temporarily unavailable. Try searching again.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4"
          >
            Search for a food →
          </Link>
        </div>
      </main>
    );
  }

  const nutrients = [
    { label: 'Calories', value: food.calories !== null ? `${food.calories.toFixed(0)} kcal` : null },
    { label: 'Protein', value: food.protein !== null ? `${food.protein.toFixed(1)}g` : null },
    { label: 'Carbohydrates', value: food.carbs !== null ? `${food.carbs.toFixed(1)}g` : null },
    { label: 'Fat', value: food.fat !== null ? `${food.fat.toFixed(1)}g` : null },
    { label: 'Saturated Fat', value: food.saturatedFat !== null ? `${food.saturatedFat.toFixed(1)}g` : null },
    { label: 'Fiber', value: food.fiber !== null ? `${food.fiber.toFixed(1)}g` : null },
    { label: 'Sugar', value: food.sugar !== null ? `${food.sugar.toFixed(1)}g` : null },
    { label: 'Sodium', value: food.sodium !== null ? `${food.sodium.toFixed(0)}mg` : null },
    { label: 'Potassium', value: food.potassium !== null ? `${food.potassium.toFixed(0)}mg` : null },
    { label: 'Vitamin A', value: food.vitaminA !== null ? `${food.vitaminA.toFixed(0)}%` : null },
    { label: 'Vitamin C', value: food.vitaminC !== null ? `${food.vitaminC.toFixed(0)}%` : null },
    { label: 'Calcium', value: food.calcium !== null ? `${food.calcium.toFixed(0)}%` : null },
    { label: 'Iron', value: food.iron !== null ? `${food.iron.toFixed(0)}%` : null },
  ].filter((n) => n.value !== null);

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Back link */}
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Search for a food
        </Link>

        {/* Header */}
        <div className="flex items-start gap-6">
          {food.images?.medium && (
            <Image
              src={food.images.medium}
              alt={food.name}
              width={120}
              height={120}
              className="rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-foreground">{food.name}</h1>
            {food.brandName && (
              <p className="text-muted-foreground mt-1">{food.brandName}</p>
            )}
            {food.foodType && (
              <span className="inline-block mt-2 text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded">
                {food.foodType === 'Brand' ? 'Branded' : 'Generic'}
              </span>
            )}
          </div>
        </div>

        {/* Nutrition Facts */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Nutrition per 100g
          </h2>
          <dl className="divide-y divide-border border-t border-b border-border">
            {nutrients.map(({ label, value }) => (
              <div key={label} className="flex justify-between items-baseline py-2.5">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-sm font-semibold text-foreground tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Serving sizes */}
        {food.servings.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Serving Sizes
            </h2>
            <div className="divide-y divide-border border-t border-b border-border">
              {food.servings.map((serving) => (
                <div key={serving.id} className="flex justify-between items-baseline py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{serving.description}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{serving.weightGrams}g</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {serving.calories} kcal
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      P: {serving.protein}g · C: {serving.carbs}g · F: {serving.fat}g
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Images */}
        {food.images?.highres && (
          <Image
            src={food.images.highres}
            alt={food.name}
            width={600}
            height={600}
            className="rounded-xl w-full max-w-lg h-auto mx-auto"
          />
        )}
      </div>
    </main>
  );
}
