import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { customDishes, customDishIngredients, dishPhotos, foods } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { validateRequestBody } from '@/lib/api-validation';

function toNum(v: string | number | null | undefined) {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
}

const ingredientSchema = z.object({
  foodId: z.string().uuid(),
  altMeasureId: z.string().uuid().nullable().optional(),
  quantity: z.number().positive().max(100000),
  seq: z.number().int().min(1).optional(),
});

const createDishSchema = z.object({
  name: z.string().min(1).max(500).transform((s) => s.trim()),
  description: z.string().max(2000).nullable().optional(),
  ingredients: z.array(ingredientSchema).min(1).max(50),
});

// GET /api/dishes — list user's dishes with aggregate nutrition
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select({
      id: customDishes.id,
      name: customDishes.name,
      description: customDishes.description,
      createdAt: customDishes.createdAt,
      thumbnail: dishPhotos.thumb,
      ingredientQty: customDishIngredients.quantity,
      foodCalories: foods.calories,
      foodProtein: foods.protein,
      foodCarbs: foods.carbs,
      foodFat: foods.fat,
    })
    .from(customDishes)
    .leftJoin(dishPhotos, eq(dishPhotos.dishId, customDishes.id))
    .leftJoin(customDishIngredients, eq(customDishIngredients.dishId, customDishes.id))
    .leftJoin(foods, eq(customDishIngredients.foodId, foods.id))
    .where(eq(customDishes.userId, user.id))
    .orderBy(desc(customDishes.createdAt));

  // Group by dish
  const dishMap = new Map<string, {
    id: string; name: string; description: string | null; createdAt: Date;
    thumbnail: string | null;
    ingredientCount: number; totalCalories: number; totalProtein: number;
    totalCarbs: number; totalFat: number;
  }>();

  for (const row of rows) {
    if (!dishMap.has(row.id)) {
      dishMap.set(row.id, {
        id: row.id, name: row.name, description: row.description,
        createdAt: row.createdAt, thumbnail: row.thumbnail ?? null,
        ingredientCount: 0,
        totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0,
      });
    }
    const dish = dishMap.get(row.id)!;
    if (row.ingredientQty != null) {
      const qty = toNum(row.ingredientQty);
      dish.ingredientCount++;
      dish.totalCalories += (toNum(row.foodCalories) / 100) * qty;
      dish.totalProtein += (toNum(row.foodProtein) / 100) * qty;
      dish.totalCarbs += (toNum(row.foodCarbs) / 100) * qty;
      dish.totalFat += (toNum(row.foodFat) / 100) * qty;
    }
  }

  const dishes = Array.from(dishMap.values()).map((d) => ({
    ...d,
    totalCalories: Math.round(d.totalCalories),
    totalProtein: Math.round(d.totalProtein * 10) / 10,
    totalCarbs: Math.round(d.totalCarbs * 10) / 10,
    totalFat: Math.round(d.totalFat * 10) / 10,
    createdAt: d.createdAt.toISOString(),
  }));

  return NextResponse.json({ dishes });
}

// POST /api/dishes — create dish + ingredients in transaction
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const validation = await validateRequestBody(request, createDishSchema);
  if (!validation.success) return validation.response;

  const { name, description, ingredients } = validation.data;

  const dish = await db.transaction(async (tx) => {
    const [newDish] = await tx
      .insert(customDishes)
      .values({ userId: user.id, name, description: description ?? null })
      .returning();

    await tx.insert(customDishIngredients).values(
      ingredients.map((ing, i) => ({
        dishId: newDish.id,
        foodId: ing.foodId,
        altMeasureId: ing.altMeasureId ?? null,
        quantity: ing.quantity.toString(),
        seq: ing.seq ?? i + 1,
      }))
    );

    return newDish;
  });

  return NextResponse.json({ success: true, dish: { id: dish.id, name: dish.name } }, { status: 201 });
}
