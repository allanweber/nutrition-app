import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { foodLogs, foods } from '@/server/db/schema';
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

    // Get food logs for the date range
    const logs = await db
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
          gte(foodLogs.consumedAt, startDate),
          lte(foodLogs.consumedAt, endDate)
        )
      )
      .orderBy(desc(foodLogs.consumedAt));

    // Group by day and calculate totals
    const dailyMap = new Map<string, { date: string; calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number; foodCount: number }>();

    logs.forEach(log => {
      const dateKey = log.consumedAt.toISOString().split('T')[0];
      const multiplier = Number(log.quantity);
      
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
      
      const baseValues = {
        calories: Number(log.food?.calories || 0),
        protein: Number(log.food?.protein || 0),
        carbs: Number(log.food?.carbs || 0),
        fat: Number(log.food?.fat || 0),
        fiber: Number(log.food?.fiber || 0),
        sugar: Number(log.food?.sugar || 0),
        sodium: Number(log.food?.sodium || 0),
      };

      day.calories += baseValues.calories * multiplier;
      day.protein += baseValues.protein * multiplier;
      day.carbs += baseValues.carbs * multiplier;
      day.fat += baseValues.fat * multiplier;
      day.fiber += baseValues.fiber * multiplier;
      day.sugar += baseValues.sugar * multiplier;
      day.sodium += baseValues.sodium * multiplier;
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