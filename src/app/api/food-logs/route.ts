import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import {
  foodLogItems,
  foodLogMeals,
  foodPhotos,
  foods,
} from '@/server/db/schema';
import { and, desc, eq, gte, ilike, lt } from 'drizzle-orm';
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

    // Validate request body
    const validation = await validateRequestBody(request, createFoodLogSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { foodName, quantity, servingUnit, mealType, consumedAt } =
      validation.data;

    // Look up food from local DB by name (FatSecret foods are pre-saved during search)
    const matchingFoods = await db
      .select({ food: foods, photo: foodPhotos })
      .from(foods)
      .leftJoin(foodPhotos, eq(foodPhotos.foodId, foods.id))
      .where(ilike(foods.name, foodName))
      .limit(1);

    let cachedFood: typeof matchingFoods[number]['food'] | null = matchingFoods[0]?.food ?? null;
    const cachedPhotoThumb: string | null = matchingFoods[0]?.photo?.thumb ?? null;

    if (!cachedFood) {
      // Create a minimal food entry if not found in local DB
      const [newFood] = await db
        .insert(foods)
        .values({
          source: 'user_custom',
          sourceId: null,
          name: foodName,
          brandName: null,
          servingQty: String(quantity),
          servingUnit: servingUnit || 'g',
          servingWeightGrams: null,
          calories: null,
          protein: null,
          carbs: null,
          fat: null,
          isRaw: false,
          userId: null,
        })
        .returning();
      cachedFood = newFood;
    }

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
        servingUnit: servingUnit || cachedFood.servingUnit || 'g',
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
          photoUrl: cachedPhotoThumb,
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
