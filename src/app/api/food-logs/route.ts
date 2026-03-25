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

    const validation = await validateRequestBody(request, createFoodLogSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { foodId, altMeasureId, quantity, mealType, consumedAt } =
      validation.data;

    // Verify the food exists
    const matchingFoods = await db
      .select({ food: foods, photo: foodPhotos })
      .from(foods)
      .leftJoin(foodPhotos, eq(foodPhotos.foodId, foods.id))
      .where(eq(foods.id, foodId))
      .limit(1);

    if (matchingFoods.length === 0) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    const cachedFood = matchingFoods[0].food;
    const cachedPhotoThumb = matchingFoods[0].photo?.thumb ?? null;

    // Look up altMeasure if provided
    let altMeasure: typeof foodAltMeasures.$inferSelect | null = null;
    if (altMeasureId) {
      const rows = await db
        .select()
        .from(foodAltMeasures)
        .where(eq(foodAltMeasures.id, altMeasureId))
        .limit(1);
      altMeasure = rows[0] ?? null;
    }

    // Find or create meal
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
        altMeasureId: altMeasure?.id ?? null,
        quantity: quantity.toString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      log: {
        id: newLogItem.id,
        quantity: toNumber(newLogItem.quantity),
        mealType,
        consumedAt: normalizedConsumedAt,
        food: {
          id: cachedFood.id,
          name: cachedFood.name,
          brandName: cachedFood.brandName,
          calories: toNumber(cachedFood.calories),
          protein: toNumber(cachedFood.protein),
          carbs: toNumber(cachedFood.carbs),
          fat: toNumber(cachedFood.fat),
          fiber: toNumber(cachedFood.fiber),
          sugar: toNumber(cachedFood.sugar),
          sodium: toNumber(cachedFood.sodium),
          photoUrl: cachedPhotoThumb,
        },
        altMeasure: altMeasure
          ? {
              id: altMeasure.id,
              description: altMeasure.measure,
              weightGrams: toNumber(altMeasure.servingWeight),
              qty: toNumber(altMeasure.qty),
            }
          : null,
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
        dishLogGroupId: foodLogItems.dishLogGroupId,
        dishNameSnapshot: foodLogItems.dishNameSnapshot,
        mealType: foodLogMeals.mealType,
        consumedAt: foodLogMeals.consumedAt,
        food: {
          id: foods.id,
          name: foods.name,
          brandName: foods.brandName,
          calories: foods.calories,
          protein: foods.protein,
          carbs: foods.carbs,
          fat: foods.fat,
          fiber: foods.fiber,
          sugar: foods.sugar,
          sodium: foods.sodium,
          fullNutrients: foods.fullNutrients,
        },
        photoThumb: foodPhotos.thumb,
        altMeasureId: foodAltMeasures.id,
        altMeasureDescription: foodAltMeasures.measure,
        altMeasureWeightGrams: foodAltMeasures.servingWeight,
        altMeasureQty: foodAltMeasures.qty,
      })
      .from(foodLogItems)
      .innerJoin(foodLogMeals, eq(foodLogItems.mealId, foodLogMeals.id))
      .innerJoin(foods, eq(foodLogItems.foodId, foods.id))
      .leftJoin(foodPhotos, eq(foodLogItems.foodId, foodPhotos.foodId))
      .leftJoin(foodAltMeasures, eq(foodLogItems.altMeasureId, foodAltMeasures.id))
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
      dishLogGroupId: log.dishLogGroupId ?? null,
      dishNameSnapshot: log.dishNameSnapshot ?? null,
      mealType: log.mealType,
      consumedAt: log.consumedAt,
      food: {
        id: log.food.id,
        name: log.food.name,
        brandName: log.food.brandName,
        calories: toNumber(log.food.calories),
        protein: toNumber(log.food.protein),
        carbs: toNumber(log.food.carbs),
        fat: toNumber(log.food.fat),
        fiber: toNumber(log.food.fiber),
        sugar: toNumber(log.food.sugar),
        sodium: toNumber(log.food.sodium),
        fullNutrients: (log.food.fullNutrients as Record<string, unknown>) ?? {},
        photoUrl: log.photoThumb ?? null,
      },
      altMeasure: log.altMeasureId
        ? {
            id: log.altMeasureId,
            description: log.altMeasureDescription!,
            weightGrams: toNumber(log.altMeasureWeightGrams),
            qty: toNumber(log.altMeasureQty),
          }
        : null,
    }));

    const totalsData = transformedLogs.reduce(
      (acc, log) => {
        const quantity = toNumber(log.quantity);
        const fn = log.food.fullNutrients;
        const fnNum = (key: string) => {
          const v = fn[key];
          return typeof v === 'number' ? v : 0;
        };
        return {
          calories: acc.calories + (toNumber(log.food.calories) / 100) * quantity,
          protein: acc.protein + (toNumber(log.food.protein) / 100) * quantity,
          carbs: acc.carbs + (toNumber(log.food.carbs) / 100) * quantity,
          fat: acc.fat + (toNumber(log.food.fat) / 100) * quantity,
          fiber: acc.fiber + (toNumber(log.food.fiber) / 100) * quantity,
          sugar: acc.sugar + (toNumber(log.food.sugar) / 100) * quantity,
          sodium: acc.sodium + (toNumber(log.food.sodium) / 100) * quantity,
          saturatedFat: acc.saturatedFat + (fnNum('saturatedFat') / 100) * quantity,
          polyunsaturatedFat: acc.polyunsaturatedFat + (fnNum('polyunsaturatedFat') / 100) * quantity,
          monounsaturatedFat: acc.monounsaturatedFat + (fnNum('monounsaturatedFat') / 100) * quantity,
          cholesterol: acc.cholesterol + (fnNum('cholesterol') / 100) * quantity,
          potassium: acc.potassium + (fnNum('potassium') / 100) * quantity,
          vitaminA: acc.vitaminA + (fnNum('vitaminA') / 100) * quantity,
          vitaminC: acc.vitaminC + (fnNum('vitaminC') / 100) * quantity,
          calcium: acc.calcium + (fnNum('calcium') / 100) * quantity,
          iron: acc.iron + (fnNum('iron') / 100) * quantity,
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
        saturatedFat: 0,
        polyunsaturatedFat: 0,
        monounsaturatedFat: 0,
        cholesterol: 0,
        potassium: 0,
        vitaminA: 0,
        vitaminC: 0,
        calcium: 0,
        iron: 0,
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
        saturatedFat: Math.round((totalsData.saturatedFat || 0) * 10) / 10,
        polyunsaturatedFat: Math.round((totalsData.polyunsaturatedFat || 0) * 10) / 10,
        monounsaturatedFat: Math.round((totalsData.monounsaturatedFat || 0) * 10) / 10,
        cholesterol: Math.round((totalsData.cholesterol || 0) * 10) / 10,
        potassium: Math.round((totalsData.potassium || 0) * 10) / 10,
        vitaminA: Math.round((totalsData.vitaminA || 0) * 10) / 10,
        vitaminC: Math.round((totalsData.vitaminC || 0) * 10) / 10,
        calcium: Math.round((totalsData.calcium || 0) * 10) / 10,
        iron: Math.round((totalsData.iron || 0) * 10) / 10,
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
