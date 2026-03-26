import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { customDishes, customDishIngredients, dishPhotos, foodAltMeasures, foodPhotos, foods } from '@/server/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { validateRequestBody } from '@/lib/api-validation';

function toNum(v: string | number | null | undefined) {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
}

const updateDishSchema = z.object({
  name: z.string().min(1).max(500).transform((s) => s.trim()).optional(),
  description: z.string().max(2000).nullable().optional(),
  ingredients: z.array(z.object({
    foodId: z.string().uuid(),
    altMeasureId: z.string().uuid().nullable().optional(),
    quantity: z.number().positive().max(100000),
    seq: z.number().int().min(1).optional(),
  })).min(1).max(50).optional(),
});

// GET /api/dishes/[dishId] — full dish detail with per-ingredient nutrition
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ dishId: string }> }
) {
  const { dishId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dish = await db.query.customDishes.findFirst({
    where: and(eq(customDishes.id, dishId), eq(customDishes.userId, user.id)),
  });

  if (!dish) return NextResponse.json({ error: 'Dish not found' }, { status: 404 });

  const photoRow = await db.query.dishPhotos.findFirst({
    where: eq(dishPhotos.dishId, dishId),
  });

  const rows = await db
    .select({
      id: customDishIngredients.id,
      foodId: customDishIngredients.foodId,
      foodName: foods.name,
      altMeasureId: customDishIngredients.altMeasureId,
      altMeasureDescription: foodAltMeasures.measure,
      quantity: customDishIngredients.quantity,
      seq: customDishIngredients.seq,
      calories: foods.calories,
      protein: foods.protein,
      carbs: foods.carbs,
      fat: foods.fat,
      thumbnail: foodPhotos.thumb,
    })
    .from(customDishIngredients)
    .innerJoin(foods, eq(customDishIngredients.foodId, foods.id))
    .leftJoin(foodAltMeasures, eq(customDishIngredients.altMeasureId, foodAltMeasures.id))
    .leftJoin(foodPhotos, eq(foodPhotos.foodId, customDishIngredients.foodId))
    .where(eq(customDishIngredients.dishId, dishId))
    .orderBy(asc(customDishIngredients.seq));

  const ingredients = rows.map((r) => {
    const qty = toNum(r.quantity);
    return {
      id: r.id,
      foodId: r.foodId,
      foodName: r.foodName,
      thumbnail: r.thumbnail ?? null,
      altMeasureId: r.altMeasureId ?? null,
      altMeasureDescription: r.altMeasureDescription ?? null,
      quantity: qty,
      seq: r.seq ?? 1,
      calories: Math.round((toNum(r.calories) / 100) * qty),
      protein: Math.round((toNum(r.protein) / 100) * qty * 10) / 10,
      carbs: Math.round((toNum(r.carbs) / 100) * qty * 10) / 10,
      fat: Math.round((toNum(r.fat) / 100) * qty * 10) / 10,
    };
  });

  const totals = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fat: acc.fat + ing.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return NextResponse.json({
    dish: {
      id: dish.id,
      name: dish.name,
      description: dish.description,
      photo: photoRow
        ? { thumb: photoRow.thumb ?? null, highres: photoRow.highres ?? null }
        : null,
      ingredients,
      totals,
      createdAt: dish.createdAt.toISOString(),
      updatedAt: dish.updatedAt.toISOString(),
    },
  });
}

// PATCH /api/dishes/[dishId] — update name/description + replace ingredients
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dishId: string }> }
) {
  const { dishId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dish = await db.query.customDishes.findFirst({
    where: and(eq(customDishes.id, dishId), eq(customDishes.userId, user.id)),
  });
  if (!dish) return NextResponse.json({ error: 'Dish not found' }, { status: 404 });

  const validation = await validateRequestBody(request, updateDishSchema);
  if (!validation.success) return validation.response;

  const { name, description, ingredients } = validation.data;

  await db.transaction(async (tx) => {
    if (name !== undefined || description !== undefined) {
      await tx
        .update(customDishes)
        .set({
          ...(name !== undefined ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
          updatedAt: new Date(),
        })
        .where(eq(customDishes.id, dishId));
    }

    if (ingredients !== undefined) {
      await tx.delete(customDishIngredients).where(eq(customDishIngredients.dishId, dishId));
      await tx.insert(customDishIngredients).values(
        ingredients.map((ing, i) => ({
          dishId,
          foodId: ing.foodId,
          altMeasureId: ing.altMeasureId ?? null,
          quantity: ing.quantity.toString(),
          seq: ing.seq ?? i + 1,
        }))
      );
    }
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/dishes/[dishId] — delete dish (cascades to ingredients)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ dishId: string }> }
) {
  const { dishId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dish = await db.query.customDishes.findFirst({
    where: and(eq(customDishes.id, dishId), eq(customDishes.userId, user.id)),
  });
  if (!dish) return NextResponse.json({ error: 'Dish not found' }, { status: 404 });

  await db.delete(customDishes).where(eq(customDishes.id, dishId));

  return NextResponse.json({ success: true });
}
