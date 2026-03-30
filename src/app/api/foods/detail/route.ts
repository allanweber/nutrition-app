import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNotNull } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import db from '@/server/db';
import { foodAltMeasures, foodPhotos, foods } from '@/server/db/schema';
import type { FoodDetailResponse } from '@/queries/food-detail';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.', field: null },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get('id');
  const fatSecretId = searchParams.get('fatSecretId');

  if ((!rawId || rawId.trim() === '') && (!fatSecretId || fatSecretId.trim() === '')) {
    return NextResponse.json(
      { success: false, error: 'id or fatSecretId is required.', field: 'id' },
      { status: 400 },
    );
  }

  // Build the where condition: prefer local DB id, fall back to source_id lookup
  let whereCondition;
  if (rawId && rawId.trim() !== '') {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(rawId.trim())) {
      return NextResponse.json(
        { success: false, error: 'id must be a valid UUID.', field: 'id' },
        { status: 400 },
      );
    }
    whereCondition = and(eq(foods.id, rawId.trim()), isNotNull(foods.calories));
  } else {
    whereCondition = and(
      eq(foods.source, 'fatsecret'),
      eq(foods.sourceId, fatSecretId!),
      isNotNull(foods.calories),
    );
  }

  try {
    const rows = await db
      .select({ food: foods, photo: foodPhotos, altMeasure: foodAltMeasures })
      .from(foods)
      .leftJoin(foodPhotos, eq(foodPhotos.foodId, foods.id))
      .leftJoin(foodAltMeasures, eq(foodAltMeasures.foodId, foods.id))
      .where(whereCondition);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Food not found.',
          field: null,
        },
        { status: 404 },
      );
    }

    const food = rows[0].food;

    if (food.userId !== null && food.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const photo = rows[0].photo ?? null;
    const altMeasures = rows
      .map((r) => r.altMeasure)
      .filter((m): m is NonNullable<typeof m> => m !== null);

    // Custom foods store nutrition per-serving; normalize to per-100g so all
    // downstream calculations (baseServing display, serving synthesis) are consistent.
    const normFactor =
      food.source === 'user_custom' && food.servingWeightGrams
        ? 100 / parseFloat(food.servingWeightGrams)
        : 1;

    const baseCalories = parseFloat(food.calories!) * normFactor;
    const baseProtein = parseFloat(food.protein ?? '0') * normFactor;
    const baseCarbs = parseFloat(food.carbs ?? '0') * normFactor;
    const baseFat = parseFloat(food.fat ?? '0') * normFactor;
    const baseFiber = food.fiber ? parseFloat(food.fiber) * normFactor : null;
    const baseSugar = food.sugar ? parseFloat(food.sugar) * normFactor : null;
    const baseSodium = food.sodium ? parseFloat(food.sodium) * normFactor : null;

    function round(value: number, decimals = 2): number {
      return parseFloat(value.toFixed(decimals));
    }

    function calcPer(baseValue: number | null, weightGrams: number): number | null {
      if (baseValue === null) return null;
      return round(baseValue * (weightGrams / 100));
    }

    const fullNutrients = (food.fullNutrients as Record<string, unknown>) ?? {};

    const getNum = (key: string): number | null => {
      const v = fullNutrients[key];
      return typeof v === 'number' ? v : null;
    };

    const response: FoodDetailResponse = {
      id: food.id,
      name: food.name,
      brandName: food.brandName ?? null,
      foodType: ((fullNutrients['foodType'] as string) === 'Brand'
        ? 'Brand'
        : 'Generic') as 'Generic' | 'Brand',
      foodUrl: (fullNutrients['foodUrl'] as string) ?? null,
      baseServing: {
        calories: baseCalories,
        protein: baseProtein,
        carbs: baseCarbs,
        fat: baseFat,
        saturatedFat: getNum('saturatedFat'),
        fiber: baseFiber,
        sugar: baseSugar,
        sodium: baseSodium,
        potassium: getNum('potassium'),
        vitaminA: getNum('vitaminA'),
        vitaminC: getNum('vitaminC'),
        calcium: getNum('calcium'),
        iron: getNum('iron'),
      },
      servings: altMeasures.map((m) => {
        const w = parseFloat(m.servingWeight);
        return {
          id: m.id,
          description: m.measure,
          weightGrams: w,
          calories: round(baseCalories * (w / 100)),
          protein: round(baseProtein * (w / 100)),
          carbs: round(baseCarbs * (w / 100)),
          fat: round(baseFat * (w / 100)),
          fiber: calcPer(baseFiber, w),
          sugar: calcPer(baseSugar, w),
          sodium: calcPer(baseSodium, w),
        };
      }),
      images:
        photo && (photo.thumb || photo.medium || photo.highres)
          ? {
              thumb: photo.thumb ?? null,
              medium: photo.medium ?? null,
              highres: photo.highres ?? null,
            }
          : null,
    };

    return NextResponse.json({ food: response });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        field: null,
      },
      { status: 500 },
    );
  }
}
