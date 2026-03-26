import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { foodLogItems, foodLogMeals, foods } from '@/server/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';
import { daysSchema, validateApiInput } from '@/lib/api-validation';

// Get weekly nutrition data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = parseInt(searchParams.get('days') || '7');

    // Validate days parameter
    const daysValidation = validateApiInput(daysSchema, daysParam, 'days');
    if (!daysValidation.success) {
      return NextResponse.json(
        { error: daysValidation.error },
        { status: 400 }
      );
    }

    const days = daysValidation.data;

    // Get date range for the last N days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get food logs for the date range — join foods for live nutrition data
    const logs = await db
      .select({
        id: foodLogItems.id,
        quantity: foodLogItems.quantity,
        mealType: foodLogMeals.mealType,
        consumedAt: foodLogMeals.consumedAt,
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
      .from(foodLogItems)
      .innerJoin(foodLogMeals, eq(foodLogItems.mealId, foodLogMeals.id))
      .innerJoin(foods, eq(foodLogItems.foodId, foods.id))
      .where(
        and(
          eq(foodLogMeals.userId, user.id),
          gte(foodLogMeals.consumedAt, startDate),
          lte(foodLogMeals.consumedAt, endDate)
        )
      )
      .orderBy(desc(foodLogMeals.consumedAt));

    // Group by day and calculate totals — nutrients are per 100g, quantity is in grams
    const dailyMap = new Map<string, { date: string; calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number; foodCount: number }>();

    logs.forEach(log => {
      const dateKey = log.consumedAt.toISOString().split('T')[0];
      const quantity = Number(log.quantity);

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          foodCount: 0,
        });
      }

      const day = dailyMap.get(dateKey);
      if (!day) return;

      day.calories += (Number(log.food?.calories || 0) / 100) * quantity;
      day.protein += (Number(log.food?.protein || 0) / 100) * quantity;
      day.carbs += (Number(log.food?.carbs || 0) / 100) * quantity;
      day.fat += (Number(log.food?.fat || 0) / 100) * quantity;
      day.fiber += (Number(log.food?.fiber || 0) / 100) * quantity;
      day.sugar += (Number(log.food?.sugar || 0) / 100) * quantity;
      day.sodium += (Number(log.food?.sodium || 0) / 100) * quantity;
      day.foodCount += 1;
    });

    // Convert to array and sort by date
    const weeklyData = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({ data: weeklyData });
  } catch (error) {
    console.error('Analytics weekly error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly analytics' },
      { status: 500 }
    );
  }
}
