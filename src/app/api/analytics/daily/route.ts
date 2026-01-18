import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { foodLogs, foods } from '@/server/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';

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
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const targetDate = new Date(date);
    const { start, end } = getDayRange(targetDate);

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
          lte(foodLogs.consumedAt, end)
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
      date: date,
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