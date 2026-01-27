import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { foodLogs, foods } from '@/server/db/schema';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';
import { dateSchema, validateApiInput } from '@/lib/api-validation';
import { addDays, parseISO, startOfDay } from 'date-fns';

function getDayRangeFromDateString(date: string) {
  const start = startOfDay(parseISO(date));
  const end = addDays(start, 1);
  return { start, end };
}

// Get nutrition summary for a specific day
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Validate date parameter
    const dateValidation = validateApiInput(dateSchema, dateParam, 'date');
    if (!dateValidation.success) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 }
      );
    }

    const { start, end } = getDayRangeFromDateString(dateValidation.data);

    // Get food logs for the day with food data
    const dayLogs = await db
      .select({
        id: foodLogs.id,
        quantity: foodLogs.quantity,
        mealType: foodLogs.mealType,
        consumedAt: foodLogs.consumedAt,
        food: {
          id: foods.id,
          name: foods.name,
          calories: foods.calories,
          protein: foods.protein,
          carbs: foods.carbs,
          fat: foods.fat,
          fiber: foods.fiber,
          sugar: foods.sugar,
          sodium: foods.sodium,
        }
      })
      .from(foodLogs)
      .leftJoin(foods, eq(foodLogs.foodId, foods.id))
      .where(
        and(
          eq(foodLogs.userId, user.id),
          gte(foodLogs.consumedAt, start),
          lt(foodLogs.consumedAt, end)
        )
      )
      .orderBy(desc(foodLogs.consumedAt));

    // Calculate totals
    const totals = dayLogs.reduce(
      (acc, log) => {
        const multiplier = log.quantity;
        const baseValues = {
          calories: Number(log.food?.calories || 0),
          protein: Number(log.food?.protein || 0),
          carbs: Number(log.food?.carbs || 0),
          fat: Number(log.food?.fat || 0),
          fiber: Number(log.food?.fiber || 0),
          sugar: Number(log.food?.sugar || 0),
          sodium: Number(log.food?.sodium || 0),
        };

        return {
          calories: acc.calories + (baseValues.calories * Number(multiplier)),
          protein: acc.protein + (baseValues.protein * Number(multiplier)),
          carbs: acc.carbs + (baseValues.carbs * Number(multiplier)),
          fat: acc.fat + (baseValues.fat * Number(multiplier)),
          fiber: acc.fiber + (baseValues.fiber * Number(multiplier)),
          sugar: acc.sugar + (baseValues.sugar * Number(multiplier)),
          sodium: acc.sodium + (baseValues.sodium * Number(multiplier)),
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
      }
    );

    const summary = {
      date: dateValidation.data,
      ...totals,
    };

    return NextResponse.json({ summary, logs: dayLogs });
  } catch (error) {
    console.error('Analytics daily summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily analytics' },
      { status: 500 }
    );
  }
}