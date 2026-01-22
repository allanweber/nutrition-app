import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { nutritionixAPI } from '@/lib/nutritionix';
import { db } from '@/server/db';
import { foods, foodLogs, foodPhotos, foodAltMeasures } from '@/server/db/schema';
import { eq, and, gte, lt, desc, sql } from 'drizzle-orm';

import { NutritionixFood, nutritionixToBaseFood } from '@/types/food';
import { validateRequestBody, createFoodLogSchema, dateSchema, validateApiInput } from '@/lib/api-validation';

// Helper to get or create food in cache
async function getOrCreateFood(nutritionixData: NutritionixFood) {
  const sourceId = nutritionixData.nix_item_id || `common_${nutritionixData.tags?.tag_id || nutritionixData.food_name}`;
  
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
  const [newFood] = await db.insert(foods).values({
    sourceId: baseFoodData.sourceId,
    source: baseFoodData.source,
    name: baseFoodData.name,
    brandName: baseFoodData.brandName || null,
    servingQty: baseFoodData.servingQty ? String(baseFoodData.servingQty) : null,
    servingUnit: baseFoodData.servingUnit || null,
    servingWeightGrams: baseFoodData.servingWeightGrams ? String(baseFoodData.servingWeightGrams) : null,
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
  }).returning();

  // Insert photo if available
  if (baseFoodData.photo && (baseFoodData.photo.thumb || baseFoodData.photo.highres)) {
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
      }))
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
        { status: 401 }
      );
    }

    // Validate request body
    const validation = await validateRequestBody(request, createFoodLogSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { foodName, brandName, quantity, servingUnit, mealType, consumedAt } = validation.data;

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
      quantity: quantity.toString(),
      servingUnit: nutritionInfo.serving_unit,
      mealType: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      consumedAt: logDate,
    }).returning();
    
    // Get photo URL from relation or null
    const photoThumb = cachedFood && 'photo' in cachedFood && cachedFood.photo 
      ? (cachedFood.photo as { thumb?: string | null })?.thumb || null 
      : null;
    
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
          servingWeightGrams: cachedFood.servingWeightGrams,
          servingUnit: cachedFood.servingUnit,
          photoUrl: photoThumb,
        }
      }
    });
  } catch (error) {
    console.error('Error creating food log:', error);
    return NextResponse.json(
      { error: 'Failed to create food log' },
      { status: 500 }
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
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Validate date parameter
    const dateValidation = validateApiInput(dateSchema, dateParam, 'date');
    if (!dateValidation.success) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 }
      );
    }

    const date = dateValidation.data;

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
      .where(and(
        eq(foodLogs.userId, user.id),
        gte(foodLogs.consumedAt, new Date(date)),
        lt(foodLogs.consumedAt, new Date(date + 'T23:59:59.999Z'))
      ))
      .orderBy(desc(foodLogs.consumedAt))
      .limit(50);

    // Transform logs to include photoUrl in food object
    const transformedLogs = logs.map(log => ({
      id: log.id,
      quantity: log.quantity,
      servingUnit: log.servingUnit,
      mealType: log.mealType,
      consumedAt: log.consumedAt,
      food: {
        ...log.food,
        photoUrl: log.photoThumb,
      }
    }));

    // Calculate daily totals
    const totals = await db
      .select({
        calories: sql<number>`SUM(CAST(${foods.calories} AS NUMERIC) * ${foodLogs.quantity})`.mapWith(Number),
        protein: sql<number>`SUM(CAST(${foods.protein} AS NUMERIC) * ${foodLogs.quantity})`.mapWith(Number),
        carbs: sql<number>`SUM(CAST(${foods.carbs} AS NUMERIC) * ${foodLogs.quantity})`.mapWith(Number),
        fat: sql<number>`SUM(CAST(${foods.fat} AS NUMERIC) * ${foodLogs.quantity})`.mapWith(Number),
        fiber: sql<number>`SUM(CAST(${foods.fiber} AS NUMERIC) * ${foodLogs.quantity})`.mapWith(Number),
        sugar: sql<number>`SUM(CAST(${foods.sugar} AS NUMERIC) * ${foodLogs.quantity})`.mapWith(Number),
        sodium: sql<number>`SUM(CAST(${foods.sodium} AS NUMERIC) * ${foodLogs.quantity})`.mapWith(Number),
        foodCount: sql<number>`COUNT(${foodLogs.id})`.mapWith(Number)
      })
      .from(foodLogs)
      .leftJoin(foods, eq(foodLogs.foodId, foods.id))
      .where(and(
        eq(foodLogs.userId, user.id),
        gte(foodLogs.consumedAt, new Date(date)),
        lt(foodLogs.consumedAt, new Date(date + 'T23:59:59.999Z'))
      ));

    const totalsData = totals[0] || {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      foodCount: 0
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
      }
    });
  } catch (error) {
    console.error('Error fetching food logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch food logs' },
      { status: 500 }
    );
  }
}
