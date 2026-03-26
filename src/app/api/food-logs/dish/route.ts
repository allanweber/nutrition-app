import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { customDishes, customDishIngredients, foodLogItems, foodLogMeals } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { validateRequestBody } from '@/lib/api-validation';
import { uuidv7 } from 'uuidv7';

const VALID_MULTIPLIERS = [0.25, 0.5, 1, 1.5, 2, 3] as const;

const logDishSchema = z.object({
  dishId: z.string().uuid(),
  multiplier: z.number().refine((v) => (VALID_MULTIPLIERS as readonly number[]).includes(v), {
    message: 'multiplier must be one of 0.25, 0.5, 1, 1.5, 2, 3',
  }),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  consumedAt: z.string().optional().transform((v) => (v ? new Date(v) : new Date())),
});

function roundToMinute(date: Date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  return d;
}

// POST /api/food-logs/dish — log an entire dish as a group of items
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const validation = await validateRequestBody(request, logDishSchema);
  if (!validation.success) return validation.response;

  const { dishId, multiplier, mealType, consumedAt } = validation.data;

  // Verify ownership
  const dish = await db.query.customDishes.findFirst({
    where: and(eq(customDishes.id, dishId), eq(customDishes.userId, user.id)),
  });
  if (!dish) return NextResponse.json({ error: 'Dish not found' }, { status: 404 });

  // Fetch ingredients
  const ingredients = await db.query.customDishIngredients.findMany({
    where: eq(customDishIngredients.dishId, dishId),
  });
  if (ingredients.length === 0) {
    return NextResponse.json({ error: 'Dish has no ingredients' }, { status: 422 });
  }

  const normalizedConsumedAt = roundToMinute(consumedAt);
  const dishLogGroupId = uuidv7();

  const result = await db.transaction(async (tx) => {
    // Find or create meal
    const existingMeal = await tx.query.foodLogMeals.findFirst({
      where: and(
        eq(foodLogMeals.userId, user.id),
        eq(foodLogMeals.mealType, mealType),
        eq(foodLogMeals.consumedAt, normalizedConsumedAt),
      ),
    });

    let mealId = existingMeal?.id;
    if (!mealId) {
      const [newMeal] = await tx
        .insert(foodLogMeals)
        .values({ userId: user.id, mealType, consumedAt: normalizedConsumedAt })
        .returning();
      mealId = newMeal.id;
    }

    // Insert one food log item per ingredient
    const itemCount = ingredients.length;
    for (const ing of ingredients) {
      const qty = parseFloat(ing.quantity) * multiplier;
      await tx.insert(foodLogItems).values({
        mealId,
        foodId: ing.foodId,
        altMeasureId: ing.altMeasureId ?? null,
        quantity: qty.toString(),
        dishLogGroupId,
        dishNameSnapshot: dish.name,
      });
    }

    return { mealId, itemCount };
  });

  return NextResponse.json({ success: true, dishLogGroupId, itemCount: result.itemCount }, { status: 201 });
}
