import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { nutritionixAPI } from '@/lib/nutritionix';

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
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get nutrition data from Nutritionix
    const nutritionData = await nutritionixAPI.getNaturalNutrients(
      `${quantity} ${foodName}`
    );

    if (!nutritionData.foods || nutritionData.foods.length === 0) {
      return NextResponse.json(
        { error: 'Food not found in database' },
        { status: 404 }
      );
    }

    const nutritionInfo = nutritionData.foods[0];
    
    // For now, just return the nutrition data without database storage
    // TODO: Implement proper database logging
    return NextResponse.json({ 
      success: true, 
      nutritionData: {
        foodName: nutritionInfo.food_name,
        brandName: nutritionInfo.brand_name,
        calories: nutritionInfo.nf_calories,
        protein: nutritionInfo.nf_protein,
        carbs: nutritionInfo.nf_total_carbohydrate,
        fat: nutritionInfo.nf_total_fat,
        quantity: parseFloat(quantity),
        servingUnit: nutritionInfo.serving_unit,
        mealType,
        consumedAt: consumedAt ? new Date(consumedAt) : new Date(),
      }
    });

  } catch (error) {
    console.error('Food logging error:', error);
    return NextResponse.json(
      { error: 'Failed to log food' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For now, return empty logs
    // TODO: Implement proper database fetching
    return NextResponse.json({
      logs: [],
      totals: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      },
      date: new Date().toISOString().split('T')[0],
    });

  } catch (error) {
    console.error('Food logs fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch food logs' },
      { status: 500 }
    );
  }
}