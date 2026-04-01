import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { dietPlanMealItems, dietPlanMeals, dietPlans, foodAltMeasures, foodPhotos, foods } from '@/server/db/schema';
import { addMealItemSchema, validateRequestBody } from '@/lib/api-validation';
import { calculateItemMacros, toNumber } from '@/server/services/diet-plan.service';

type Params = { params: Promise<{ dietPlanId: string; mealId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { dietPlanId, mealId } = await params;

    // Verify ownership
    const plan = await db.query.dietPlans.findFirst({
      where: and(eq(dietPlans.id, dietPlanId), eq(dietPlans.clientId, user.id)),
    });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const meal = await db.query.dietPlanMeals.findFirst({
      where: and(eq(dietPlanMeals.id, mealId), eq(dietPlanMeals.dietPlanId, dietPlanId)),
    });
    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    const validation = await validateRequestBody(request, addMealItemSchema);
    if (!validation.success) return validation.response;

    const { foodId, altMeasureId, quantity } = validation.data;

    // Verify food exists
    const food = await db.query.foods.findFirst({ where: eq(foods.id, foodId) });
    if (!food) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    // Look up altMeasure if provided
    let altMeasure: typeof foodAltMeasures.$inferSelect | null = null;
    if (altMeasureId) {
      altMeasure = await db.query.foodAltMeasures.findFirst({
        where: eq(foodAltMeasures.id, altMeasureId),
      }) ?? null;
    }

    const [item] = await db
      .insert(dietPlanMealItems)
      .values({
        groupId: mealId,
        foodId,
        altMeasureId: altMeasure?.id ?? null,
        quantity: quantity.toString(),
      })
      .returning();

    const photo = await db.query.foodPhotos.findFirst({ where: eq(foodPhotos.foodId, foodId) });

    const qGrams = altMeasure
      ? quantity * toNumber(altMeasure.servingWeight)
      : quantity;
    const macros = calculateItemMacros(food, qGrams);
    const altMeasureLabel = altMeasure
      ? `${toNumber(altMeasure.qty)} ${altMeasure.measure} (${Math.round(toNumber(altMeasure.servingWeight))}g)`
      : null;

    return NextResponse.json(
      {
        item: {
          id: item.id,
          foodId,
          foodName: food.name,
          brandName: food.brandName,
          thumbnail: photo?.thumb ?? null,
          altMeasureId: altMeasure?.id ?? null,
          altMeasureLabel,
          quantity,
          ...macros,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error adding meal item:', error);
    return NextResponse.json({ error: 'Failed to add meal item' }, { status: 500 });
  }
}
