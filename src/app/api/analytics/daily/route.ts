import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { foodLogItems, foodLogMeals } from '@/server/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';
import { dateSchema, validateApiInput } from '@/lib/api-validation';

// Helper function to get start and end of day
function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
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

    const targetDate = new Date(dateValidation.data);
    const { start, end } = getDayRange(targetDate);

    // Get food logs for the day with snapshot food data
    const dayLogs = await db
      .select({
        id: foodLogItems.id,
        quantity: foodLogItems.quantity,
        mealType: foodLogMeals.mealType,
        consumedAt: foodLogMeals.consumedAt,
        food: {
          id: foodLogItems.foodId,
          name: foodLogItems.foodName,
          calories: foodLogItems.calories,
          protein: foodLogItems.protein,
          carbs: foodLogItems.carbs,
          fat: foodLogItems.fat,
          fiber: foodLogItems.fiber,
          sugar: foodLogItems.sugar,
          sodium: foodLogItems.sodium,
        }
      })
      .from(foodLogItems)
      .innerJoin(foodLogMeals, eq(foodLogItems.mealId, foodLogMeals.id))
      .where(
        and(
          eq(foodLogMeals.userId, user.id),
          gte(foodLogMeals.consumedAt, start),
          lte(foodLogMeals.consumedAt, end)
        )
      )
      .orderBy(desc(foodLogMeals.consumedAt));

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