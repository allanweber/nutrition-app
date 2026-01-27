import { getCurrentUser } from '@/lib/session';
import { searchAllSources } from '@/lib/nutrition-sources/aggregator';
import { db } from '@/server/db';
import {
  foodLogs,
  foodPhotos,
  foods,
} from '@/server/db/schema';
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { addDays, parseISO, startOfDay } from 'date-fns';

import {
  createFoodLogSchema,
  dateSchema,
  validateApiInput,
  validateRequestBody,
} from '@/lib/api-validation';

async function resolveFoodForLog(input: {
  foodId?: number;
  foodName?: string;
}): Promise<{ id: number; name: string; brandName: string | null } | null> {
  if (typeof input.foodId === 'number' && Number.isFinite(input.foodId)) {
    const food = await db.query.foods.findFirst({
      where: eq(foods.id, input.foodId),
    });
    return food ? { id: food.id, name: food.name, brandName: food.brandName ?? null } : null;
  }

  if (!input.foodName) return null;

  const results = await searchAllSources(input.foodName);
  const best = results.foods.find((f) => typeof f.id === 'number');
  if (!best?.id) return null;

  return { id: best.id, name: best.name, brandName: best.brandName ?? null };
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

    const resolved = await resolveFoodForLog({
      foodId: validation.data.foodId,
      foodName,
    });

    if (!resolved) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    // Create food log entry
    const logDate = consumedAt ? new Date(consumedAt) : new Date();

    const [newLog] = await db
      .insert(foodLogs)
      .values({
        userId: user.id,
        foodId: resolved.id,
        quantity: quantity.toString(),
        servingUnit: servingUnit || null,
        mealType: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        consumedAt: logDate,
      })
      .returning();

    const cachedFood = await db.query.foods.findFirst({
      where: eq(foods.id, resolved.id),
      with: { photo: true },
    });

    const photoThumb = cachedFood?.photo?.thumb ?? null;

    return NextResponse.json({
      success: true,
      log: {
        id: newLog.id,
        quantity: newLog.quantity,
        servingUnit: newLog.servingUnit,
        mealType: newLog.mealType,
        consumedAt: newLog.consumedAt,
        food: {
          id: cachedFood?.id ?? resolved.id,
          name: cachedFood?.name ?? resolved.name,
          brandName: cachedFood?.brandName ?? resolved.brandName,
          calories: cachedFood?.calories ?? null,
          protein: cachedFood?.protein ?? null,
          carbs: cachedFood?.carbs ?? null,
          fat: cachedFood?.fat ?? null,
          fiber: cachedFood?.fiber ?? null,
          sugar: cachedFood?.sugar ?? null,
          sodium: cachedFood?.sodium ?? null,
          servingQty: cachedFood?.servingQty ?? null,
          servingWeightGrams: cachedFood?.servingWeightGrams ?? null,
          servingUnit: cachedFood?.servingUnit ?? null,
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

    const dayStart = startOfDay(parseISO(date));
    const dayEnd = addDays(dayStart, 1);

    // Query food logs with related food data and photos
    const logs = await db
      .select({
        id: foodLogs.id,
        quantity: foodLogs.quantity,
        servingUnit: foodLogs.servingUnit,
        mealType: foodLogs.mealType,
        consumedAt: foodLogs.consumedAt,
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
          servingQty: foods.servingQty,
          servingUnit: foods.servingUnit,
        },
        photoThumb: foodPhotos.thumb,
      })
      .from(foodLogs)
      .leftJoin(foods, eq(foodLogs.foodId, foods.id))
      .leftJoin(foodPhotos, eq(foods.id, foodPhotos.foodId))
      .where(
        and(
          eq(foodLogs.userId, user.id),
          gte(foodLogs.consumedAt, dayStart),
          lt(foodLogs.consumedAt, dayEnd),
        ),
      )
      .orderBy(desc(foodLogs.consumedAt))
      .limit(50);

    // Transform logs to include photoUrl in food object
    const transformedLogs = logs.map((log) => ({
      id: log.id,
      quantity: log.quantity,
      servingUnit: log.servingUnit,
      mealType: log.mealType,
      consumedAt: log.consumedAt,
      food: {
        ...log.food,
        photoUrl: log.photoThumb,
      },
    }));

    // Calculate daily totals
    const totals = await db
      .select({
        calories:
          sql<number>`SUM(CAST(${foods.calories} AS NUMERIC) * ${foodLogs.quantity})`.mapWith(
            Number,
          ),
        protein:
          sql<number>`SUM(CAST(${foods.protein} AS NUMERIC) * ${foodLogs.quantity})`.mapWith(
            Number,
          ),
        carbs:
          sql<number>`SUM(CAST(${foods.carbs} AS NUMERIC) * ${foodLogs.quantity})`.mapWith(
            Number,
          ),
        fat: sql<number>`SUM(CAST(${foods.fat} AS NUMERIC) * ${foodLogs.quantity})`.mapWith(
          Number,
        ),
        fiber:
          sql<number>`SUM(CAST(${foods.fiber} AS NUMERIC) * ${foodLogs.quantity})`.mapWith(
            Number,
          ),
        sugar:
          sql<number>`SUM(CAST(${foods.sugar} AS NUMERIC) * ${foodLogs.quantity})`.mapWith(
            Number,
          ),
        sodium:
          sql<number>`SUM(CAST(${foods.sodium} AS NUMERIC) * ${foodLogs.quantity})`.mapWith(
            Number,
          ),
        foodCount: sql<number>`COUNT(${foodLogs.id})`.mapWith(Number),
      })
      .from(foodLogs)
      .leftJoin(foods, eq(foodLogs.foodId, foods.id))
      .where(
        and(
          eq(foodLogs.userId, user.id),
          gte(foodLogs.consumedAt, dayStart),
          lt(foodLogs.consumedAt, dayEnd),
        ),
      );

    const totalsData = totals[0] || {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      foodCount: 0,
    };

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
