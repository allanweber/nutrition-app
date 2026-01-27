import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { foods } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { searchAllSources } from '@/lib/nutrition-sources/aggregator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, foodId } = body as { query?: string; foodId?: number };

    if (!query && !foodId) {
      return NextResponse.json(
        { error: 'foodId or query is required' },
        { status: 400 }
      );
    }

    if (typeof foodId === 'number' && Number.isFinite(foodId)) {
      const food = await db.query.foods.findFirst({
        where: eq(foods.id, foodId),
        with: { photo: true },
      });

      if (!food) {
        return NextResponse.json({ error: 'Food not found' }, { status: 404 });
      }

      return NextResponse.json({
        food: {
          id: food.id,
          name: food.name,
          brandName: food.brandName,
          servingQty: food.servingQty,
          servingUnit: food.servingUnit,
          servingWeightGrams: food.servingWeightGrams,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber,
          sugar: food.sugar,
          sodium: food.sodium,
          fullNutrients: food.fullNutrients,
          isRaw: food.isRaw,
          photoUrl: food.photo?.highres ?? food.photo?.thumb ?? null,
        },
      });
    }

    const results = await searchAllSources(String(query));
    const top = results.foods[0];
    if (!top) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }

    return NextResponse.json({ results, food: top });
  } catch (error) {
    console.error('Natural nutrients error:', error);
    return NextResponse.json(
      { error: 'Failed to get nutrition information' },
      { status: 500 }
    );
  }
}