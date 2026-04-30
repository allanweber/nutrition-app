import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, desc, eq, ilike } from 'drizzle-orm';

import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import {
  customDishes,
  customDishIngredients,
  dishPhotos,
  foodPhotos,
  foods,
} from '@/server/db/schema';

const searchSchema = z.object({
  q: z.string().trim().min(3).max(200),
});

function toNum(v: string | number | null | undefined) {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

/**
 * GET /api/foods/custom/search?q=
 *
 * Returns *user-scoped* custom foods + custom dishes, merged into a single list
 * consumable by the unified FoodSearchField's Custom tab.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const parsed = searchSchema.safeParse({ q: searchParams.get('q') });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid query' },
      { status: 400 },
    );
  }

  const { q } = parsed.data;

  const [foodRows, dishRows] = await Promise.all([
    db
      .select({
        id: foods.id,
        name: foods.name,
        brandName: foods.brandName,
        calories: foods.calories,
        thumb: foodPhotos.thumb,
        createdAt: foods.createdAt,
      })
      .from(foods)
      .leftJoin(foodPhotos, eq(foodPhotos.foodId, foods.id))
      .where(and(eq(foods.userId, user.id), ilike(foods.name, `%${q}%`)))
      .orderBy(desc(foods.createdAt))
      .limit(30),
    db
      .select({
        dishId: customDishes.id,
        name: customDishes.name,
        createdAt: customDishes.createdAt,
        ingredientQty: customDishIngredients.quantity,
        foodCalories: foods.calories,
        thumb: dishPhotos.thumb,
      })
      .from(customDishes)
      .leftJoin(dishPhotos, eq(dishPhotos.dishId, customDishes.id))
      .leftJoin(customDishIngredients, eq(customDishIngredients.dishId, customDishes.id))
      .leftJoin(foods, eq(customDishIngredients.foodId, foods.id))
      .where(and(eq(customDishes.userId, user.id), ilike(customDishes.name, `%${q}%`)))
      .orderBy(desc(customDishes.createdAt))
      .limit(60),
  ]);

  // Aggregate dish calories across ingredients (quantity is grams; foods.* are per 100g).
  const dishMap = new Map<
    string,
    { dishId: string; name: string; createdAt: Date; calories: number; thumbnail: string | null }
  >();
  for (const row of dishRows) {
    if (!dishMap.has(row.dishId)) {
      dishMap.set(row.dishId, {
        dishId: row.dishId,
        name: row.name,
        createdAt: row.createdAt,
        calories: 0,
        thumbnail: row.thumb ?? null,
      });
    }
    if (row.ingredientQty != null) {
      dishMap.get(row.dishId)!.calories += (toNum(row.foodCalories) / 100) * toNum(row.ingredientQty);
    }
  }

  const foodResults = foodRows.map((r) => ({
    id: r.id,
    fatSecretId: null as string | null,
    name: r.name,
    brandName: r.brandName ?? null,
    foodType: 'Custom' as const,
    thumbnail: r.thumb ?? null,
    calories: Math.round(toNum(r.calories)),
    itemKind: 'food' as const,
  }));

  const dishResults = Array.from(dishMap.values()).map((d) => ({
    id: null as string | null,
    fatSecretId: null as string | null,
    name: d.name,
    brandName: null as string | null,
    foodType: 'Custom' as const,
    thumbnail: d.thumbnail,
    calories: Math.round(d.calories),
    itemKind: 'dish' as const,
    dishId: d.dishId,
  }));

  // Sort newest first, then cap to a reasonable amount.
  const merged = [
    ...foodResults.map((r, i) => ({ sort: foodRows[i]!.createdAt.getTime(), item: r })),
    ...dishResults.map((r) => ({ sort: dishMap.get(r.dishId!)!.createdAt.getTime(), item: r })),
  ]
    .sort((a, b) => b.sort - a.sort)
    .slice(0, 40)
    .map((x) => x.item);

  return NextResponse.json({ results: merged });
}
