import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { nutritionixAPI } from '@/lib/nutritionix';
import { db } from '@/server/db';
import { foods, foodLogs } from '@/server/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';

import { NutritionixFood } from '@/types/nutritionix';

// Helper to get or create food in cache
async function getOrCreateFood(nutritionData: NutritionixFood) {
  const nutritionixId = nutritionData.nix_item_id || `common_${nutritionData.tags?.tag_id || nutritionData.food_name}`;
  
  // Check if food exists in cache
  const existingFood = await db.query.foods.findFirst({
    where: eq(foods.nutritionixId, nutritionixId),
  });

  if (existingFood) {
    return existingFood;
  }

  // Create new food entry
  const [newFood] = await db.insert(foods).values({
    nutritionixId,
    name: nutritionData.food_name,
    brandName: nutritionData.brand_name || null,
    servingQty: String(nutritionData.serving_qty),
    servingUnit: nutritionData.serving_unit,
    servingWeightGrams: String(nutritionData.serving_weight_grams),
    calories: String(nutritionData.nf_calories),
    protein: String(nutritionData.nf_protein),
    carbs: String(nutritionData.nf_total_carbohydrate),
    fat: String(nutritionData.nf_total_fat),
    fiber: String(nutritionData.nf_dietary_fiber || 0),
    sugar: String(nutritionData.nf_sugars || 0),
    sodium: String(nutritionData.nf_sodium || 0),
    fullNutrients: nutritionData.full_nutrients,
    photoUrl: nutritionData.photo?.thumb || null,
    upc: nutritionData.upc || null,
  }).returning();

  return newFood;
}

// POST - Create a new food log entry
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { foodName, quantity, servingUnit, mealType, consumedAt } = body;

    if (!foodName || !quantity || !mealType) {
      return NextResponse.json(
        { error: 'Missing required fields: foodName, quantity, mealType' },
        { status: 400 }
      );
    }

    // Validate meal type
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(mealType)) {
      return NextResponse.json(
        { error: 'Invalid meal type. Must be: breakfast, lunch, dinner, or snack' },
        { status: 400 }
      );
    }

    // Get nutrition data from Nutritionix
    const nutritionData = await nutritionixAPI.getNaturalNutrients(
      `${quantity} ${servingUnit || ''} ${foodName}`.trim()
    );

    if (!nutritionData.foods || nutritionData.foods.length === 0) {
      return NextResponse.json(
        { error: 'Food not found in database' },
        { status: 404 }
      );
    }

    const nutritionInfo = nutritionData.foods[0];
    
    // Get or create food in our cache
    const cachedFood = await getOrCreateFood(nutritionInfo);

    // Create food log entry
    const logDate = consumedAt ? new Date(consumedAt) : new Date();
    
    const [newLog] = await db.insert(foodLogs).values({
      userId: user.id,
      foodId: cachedFood.id,
      quantity: String(quantity),
      servingUnit: nutritionInfo.serving_unit,
      mealType: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      consumedAt: logDate,
    }).returning();

    return NextResponse.json({ 
      success: true, 
      log: {
        id: newLog.id,
        quantity: newLog.quantity,
        servingUnit: newLog.servingUnit,
        mealType: newLog.mealType,
        consumedAt: newLog.consumedAt,
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
          servingUnit: cachedFood.servingUnit,
          photoUrl: cachedFood.photoUrl,
        },
      },
    });

  } catch (error) {
    console.error('Food logging error:', error);
    return NextResponse.json(
      { error: 'Failed to log food' },
      { status: 500 }
    );
  }
}

// GET - Fetch food logs for a specific date
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get date from query params (default to today)
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    let targetDate: Date;
    if (dateParam) {
      targetDate = new Date(dateParam);
    } else {
      targetDate = new Date();
    }

    // Set to start and end of day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch logs with food data
    const logs = await db
      .select({
        id: foodLogs.id,
        quantity: foodLogs.quantity,
        servingUnit: foodLogs.servingUnit,
        mealType: foodLogs.mealType,
        consumedAt: foodLogs.consumedAt,
        createdAt: foodLogs.createdAt,
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
          photoUrl: foods.photoUrl,
        },
      })
      .from(foodLogs)
      .innerJoin(foods, eq(foodLogs.foodId, foods.id))
      .where(
        and(
          eq(foodLogs.userId, user.id),
          gte(foodLogs.consumedAt, startOfDay),
          lt(foodLogs.consumedAt, endOfDay)
        )
      )
      .orderBy(foodLogs.consumedAt);

    // Calculate daily totals
    const totals = logs.reduce(
      (acc, log) => {
        const qty = parseFloat(log.quantity) || 1;
        const servingQty = parseFloat(log.food.servingQty || '1') || 1;
        const multiplier = qty / servingQty;

        return {
          calories: acc.calories + (parseFloat(log.food.calories || '0') * multiplier),
          protein: acc.protein + (parseFloat(log.food.protein || '0') * multiplier),
          carbs: acc.carbs + (parseFloat(log.food.carbs || '0') * multiplier),
          fat: acc.fat + (parseFloat(log.food.fat || '0') * multiplier),
          fiber: acc.fiber + (parseFloat(log.food.fiber || '0') * multiplier),
          sugar: acc.sugar + (parseFloat(log.food.sugar || '0') * multiplier),
          sodium: acc.sodium + (parseFloat(log.food.sodium || '0') * multiplier),
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    );

    // Round totals
    const roundedTotals = {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      fiber: Math.round(totals.fiber * 10) / 10,
      sugar: Math.round(totals.sugar * 10) / 10,
      sodium: Math.round(totals.sodium),
    };

    // Group logs by meal type
    const logsByMeal = {
      breakfast: logs.filter(l => l.mealType === 'breakfast'),
      lunch: logs.filter(l => l.mealType === 'lunch'),
      dinner: logs.filter(l => l.mealType === 'dinner'),
      snack: logs.filter(l => l.mealType === 'snack'),
    };

    return NextResponse.json({
      logs,
      logsByMeal,
      totals: roundedTotals,
      date: targetDate.toISOString().split('T')[0],
      count: logs.length,
    });

  } catch (error) {
    console.error('Food logs fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch food logs' },
      { status: 500 }
    );
  }
}
