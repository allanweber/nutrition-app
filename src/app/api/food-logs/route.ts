import { nutritionixAPI } from '@/lib/nutritionix';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import {
  foodAltMeasures,
  foodLogItems,
  foodLogMeals,
  foodPhotos,
  foods,
} from '@/server/db/schema';
import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import {
  createFoodLogSchema,
  dateSchema,
  validateApiInput,
  validateRequestBody,
} from '@/lib/api-validation';
import { NutritionixFood, nutritionixToBaseFood } from '@/types/food';

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function roundToMealMinute(date: Date) {
  const value = new Date(date);
  value.setSeconds(0, 0);
  return value;
}

// Helper to get or create food in cache
async function getOrCreateFood(nutritionixData: NutritionixFood) {
  const sourceId =
    nutritionixData.nix_item_id ||
    `common_${nutritionixData.tags?.tag_id || nutritionixData.food_name}`;

  // Check if food exists in cache
  const existingFood = await db.query.foods.findFirst({
    where: eq(foods.sourceId, sourceId),
    with: {
      photo: true,
    },
  });

  if (existingFood) {
    return existingFood;
  }

  // Convert nutritionix food to base food format
  const baseFoodData = nutritionixToBaseFood(nutritionixData);

  // Create new food entry
  const [newFood] = await db
    .insert(foods)
    .values({
      sourceId: baseFoodData.sourceId,
      source: baseFoodData.source,
      name: baseFoodData.name,
      brandName: baseFoodData.brandName || null,
      servingQty: baseFoodData.servingQty
        ? String(baseFoodData.servingQty)
        : null,
      servingUnit: baseFoodData.servingUnit || null,
      servingWeightGrams: baseFoodData.servingWeightGrams
        ? String(baseFoodData.servingWeightGrams)
        : null,
      calories: baseFoodData.calories ? String(baseFoodData.calories) : null,
      protein: baseFoodData.protein ? String(baseFoodData.protein) : null,
      carbs: baseFoodData.carbs ? String(baseFoodData.carbs) : null,
      fat: baseFoodData.fat ? String(baseFoodData.fat) : null,
      fiber: baseFoodData.fiber ? String(baseFoodData.fiber) : null,
      sugar: baseFoodData.sugar ? String(baseFoodData.sugar) : null,
      sodium: baseFoodData.sodium ? String(baseFoodData.sodium) : null,
      fullNutrients: baseFoodData.fullNutrients || null,
      isRaw: baseFoodData.isRaw || false,
      isCustom: false,
    })
    .returning();

  // Insert photo if available
  if (
    baseFoodData.photo &&
    (baseFoodData.photo.thumb || baseFoodData.photo.highres)
  ) {
    await db.insert(foodPhotos).values({
      foodId: newFood.id,
      thumb: baseFoodData.photo.thumb || null,
      highres: baseFoodData.photo.highres || null,
    });
  }

  // Insert alternative measures if available
  if (baseFoodData.altMeasures && baseFoodData.altMeasures.length > 0) {
    await db.insert(foodAltMeasures).values(
      baseFoodData.altMeasures.map((m, index) => ({
        foodId: newFood.id,
        servingWeight: String(m.serving_weight),
        measure: m.measure,
        seq: m.seq || index + 1,
        qty: String(m.qty),
      })),
    );
  }

  // Fetch and return food with photo
  const foodWithPhoto = await db.query.foods.findFirst({
    where: eq(foods.id, newFood.id),
    with: {
      photo: true,
    },
  });

  return foodWithPhoto || newFood;
}

// POST - Create a new food log entry
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    // Validate request body
    const validation = await validateRequestBody(request, createFoodLogSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { foodName, quantity, servingUnit, mealType, consumedAt } =
      validation.data;

    // Get nutrition data from Nutritionix
    const nutritionData = await nutritionixAPI.getNaturalNutrients(
      `${quantity} ${servingUnit || ''} ${foodName}`.trim(),
    );

    if (!nutritionData.foods || nutritionData.foods.length === 0) {
      return NextResponse.json(
        { error: 'Food not found in database' },
        { status: 404 },
      );
    }

    const nutritionInfo = nutritionData.foods[0];

    // Get or create food in our cache
    const cachedFood = await getOrCreateFood(nutritionInfo);

    // Create food log entry in grouped meal model
    const logDate = consumedAt ? new Date(consumedAt) : new Date();
    const normalizedConsumedAt = roundToMealMinute(logDate);

    const existingMeal = await db.query.foodLogMeals.findFirst({
      where: and(
        eq(foodLogMeals.userId, user.id),
        eq(foodLogMeals.mealType, mealType),
        eq(foodLogMeals.consumedAt, normalizedConsumedAt),
      ),
    });

    let mealId = existingMeal?.id;

    if (!mealId) {
      const [newMeal] = await db
        .insert(foodLogMeals)
        .values({
          userId: user.id,
          mealType,
          consumedAt: normalizedConsumedAt,
        })
        .returning();

      mealId = newMeal.id;
    }

    const [newLogItem] = await db
      .insert(foodLogItems)
      .values({
        mealId,
        foodId: cachedFood.id,
        quantity: quantity.toString(),
        servingUnit: nutritionInfo.serving_unit,
        foodName: cachedFood.name,
        brandName: cachedFood.brandName || null,
        calories: cachedFood.calories,
        protein: cachedFood.protein,
        carbs: cachedFood.carbs,
        fat: cachedFood.fat,
        fiber: cachedFood.fiber,
        sugar: cachedFood.sugar,
        sodium: cachedFood.sodium,
        servingQty: cachedFood.servingQty,
        servingUnitSnapshot: cachedFood.servingUnit,
        servingWeightGrams: cachedFood.servingWeightGrams,
      })
      .returning();

    // Get photo URL from relation or null
    const photoThumb =
      cachedFood && 'photo' in cachedFood && cachedFood.photo
        ? (cachedFood.photo as { thumb?: string | null })?.thumb || null
        : null;

    return NextResponse.json({
      success: true,
      log: {
        id: newLogItem.id,
        quantity: newLogItem.quantity,
        servingUnit: newLogItem.servingUnit,
        mealType,
        consumedAt: normalizedConsumedAt,
        food: {
          id: cachedFood.id,
          name: cachedFood.name,
          brandName: cachedFood.brandName,
          calories: cachedFood.calories,
          protein: cachedFood.protein,
          carbs: cachedFood.carbs,
          fat: cachedFood.fat,
          fiber: cachedFood.fiber,
          sugar: cachedFood.sugar,
          sodium: cachedFood.sodium,
          servingQty: cachedFood.servingQty,
          servingWeightGrams: cachedFood.servingWeightGrams,
          servingUnit: cachedFood.servingUnit,
          photoUrl: photoThumb,
        },
      },
    });
  } catch (error) {
    console.error('Error creating food log:', error);
    return NextResponse.json(
      { error: 'Failed to create food log' },
      { status: 500 },
    );
  }
}

// GET - Retrieve food logs for a user with optional date filtering
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam =
      searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Validate date parameter
    const dateValidation = validateApiInput(dateSchema, dateParam, 'date');
    if (!dateValidation.success) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 },
      );
    }

    const date = dateValidation.data;

    const mealItemLogs = await db
      .select({
        id: foodLogItems.id,
        quantity: foodLogItems.quantity,
        servingUnit: foodLogItems.servingUnit,
        mealType: foodLogMeals.mealType,
        consumedAt: foodLogMeals.consumedAt,
        food: {
          id: foodLogItems.foodId,
          name: foodLogItems.foodName,
          brandName: foodLogItems.brandName,
          calories: foodLogItems.calories,
          protein: foodLogItems.protein,
          carbs: foodLogItems.carbs,
          fat: foodLogItems.fat,
          fiber: foodLogItems.fiber,
          sugar: foodLogItems.sugar,
          sodium: foodLogItems.sodium,
          servingQty: foodLogItems.servingQty,
          servingUnit: foodLogItems.servingUnitSnapshot,
        },
        photoThumb: foodPhotos.thumb,
      })
      .from(foodLogItems)
      .innerJoin(foodLogMeals, eq(foodLogItems.mealId, foodLogMeals.id))
      .leftJoin(foodPhotos, eq(foodLogItems.foodId, foodPhotos.foodId))
      .where(
        and(
          eq(foodLogMeals.userId, user.id),
          gte(foodLogMeals.consumedAt, new Date(date)),
          lt(foodLogMeals.consumedAt, new Date(date + 'T23:59:59.999Z')),
        ),
      )
      .orderBy(desc(foodLogMeals.consumedAt), desc(foodLogItems.createdAt))
      .limit(200);
    const transformedLogs = mealItemLogs.map((log) => ({
      id: log.id,
      quantity: toNumber(log.quantity),
      servingUnit: log.servingUnit,
      mealType: log.mealType,
      consumedAt: log.consumedAt,
      food: {
        ...log.food,
        id: log.food.id || 0,
        calories: toNumber(log.food.calories),
        protein: toNumber(log.food.protein),
        carbs: toNumber(log.food.carbs),
        fat: toNumber(log.food.fat),
        fiber: toNumber(log.food.fiber),
        sugar: toNumber(log.food.sugar),
        sodium: toNumber(log.food.sodium),
        servingQty: toNumber(log.food.servingQty),
        photoUrl: log.photoThumb || null,
      },
    }));

    const totalsData = transformedLogs.reduce(
      (acc, log) => {
        const quantity = toNumber(log.quantity);
        return {
          calories: acc.calories + toNumber(log.food.calories) * quantity,
          protein: acc.protein + toNumber(log.food.protein) * quantity,
          carbs: acc.carbs + toNumber(log.food.carbs) * quantity,
          fat: acc.fat + toNumber(log.food.fat) * quantity,
          fiber: acc.fiber + toNumber(log.food.fiber) * quantity,
          sugar: acc.sugar + toNumber(log.food.sugar) * quantity,
          sodium: acc.sodium + toNumber(log.food.sodium) * quantity,
          foodCount: acc.foodCount + 1,
        };
      },
      {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      foodCount: 0,
      },
    );

    // Group logs by meal type
    const logsByMeal: Record<string, typeof transformedLogs> = {};
    for (const log of transformedLogs) {
      const mealType = log.mealType;
      if (!logsByMeal[mealType]) {
        logsByMeal[mealType] = [];
      }
      logsByMeal[mealType].push(log);
    }

    return NextResponse.json({
      success: true,
      logs: transformedLogs,
      logsByMeal,
      totals: {
        calories: Math.round(totalsData.calories || 0),
        protein: Math.round((totalsData.protein || 0) * 10) / 10,
        carbs: Math.round((totalsData.carbs || 0) * 10) / 10,
        fat: Math.round((totalsData.fat || 0) * 10) / 10,
        fiber: Math.round((totalsData.fiber || 0) * 10) / 10,
        sugar: Math.round((totalsData.sugar || 0) * 10) / 10,
        sodium: Math.round((totalsData.sodium || 0) * 10) / 10,
      },
    });
  } catch (error) {
    console.error('Error fetching food logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch food logs' },
      { status: 500 },
    );
  }
}
