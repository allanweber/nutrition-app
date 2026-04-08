import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import {
  customDishes,
  customDishIngredients,
  dietPlanMealItems,
  dietPlanMeals,
  dietPlans,
} from '@/server/db/schema';
import { validateRequestBody } from '@/lib/api-validation';

const addDishToMealSchema = z.object({
  dishId: z.string().uuid(),
  multiplier: z.number().positive().max(100).default(1),
});

type Params = { params: Promise<{ dietPlanId: string; mealId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dietPlanId, mealId } = await params;

    const validation = await validateRequestBody(request, addDishToMealSchema);
    if (!validation.success) return validation.response;

    const { dishId, multiplier } = validation.data;

    // Single query: validate plan ownership, meal membership, dish ownership, and fetch ingredients.
    // INNER JOINs on plan/dish act as existence + ownership guards; LEFT JOIN on ingredients
    // lets us distinguish "dish has no ingredients" (422) from "not found" (404).
    const rows = await db
      .select({
        dishName: customDishes.name,
        foodId: customDishIngredients.foodId,
        quantity: customDishIngredients.quantity,
      })
      .from(dietPlanMeals)
      .innerJoin(dietPlans, and(eq(dietPlans.id, dietPlanMeals.dietPlanId), eq(dietPlans.clientId, user.id)))
      .innerJoin(customDishes, and(eq(customDishes.id, dishId), eq(customDishes.userId, user.id)))
      .leftJoin(customDishIngredients, eq(customDishIngredients.dishId, customDishes.id))
      .where(and(eq(dietPlanMeals.id, mealId), eq(dietPlanMeals.dietPlanId, dietPlanId)));

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const dishName = rows[0].dishName;
    const ingredients = rows.filter((r) => r.foodId !== null) as { foodId: string; quantity: string }[];

    if (ingredients.length === 0) {
      return NextResponse.json({ error: 'Dish has no ingredients' }, { status: 422 });
    }

    const dishGroupId = uuidv7();

    // customDishIngredients always stores quantity in grams, so altMeasureId must NOT be
    // forwarded — getMealsForPlan would otherwise double-multiply (quantity × servingWeight).
    await db.insert(dietPlanMealItems).values(
      ingredients.map((ing) => ({
        groupId: mealId,
        foodId: ing.foodId,
        altMeasureId: null,
        quantity: String(Number(ing.quantity) * multiplier),
        dishGroupId,
        dishNameSnapshot: dishName,
        dishSourceId: dishId,
      })),
    );

    return NextResponse.json({ success: true, dishGroupId, itemCount: ingredients.length }, { status: 201 });
  } catch (error) {
    console.error('Error adding dish to meal:', error);
    return NextResponse.json({ error: 'Failed to add dish to meal' }, { status: 500 });
  }
}
