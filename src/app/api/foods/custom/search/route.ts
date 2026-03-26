import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import db from '@/server/db';
import { foodPhotos, foods, customDishes, customDishIngredients, dishPhotos } from '@/server/db/schema';
import { and, eq, ilike, asc, desc } from 'drizzle-orm';

const searchSchema = z.object({
  q: z.string().min(3, 'Query must be at least 3 characters').max(200).transform((s) => s.trim()),
  offset: z.coerce.number().int().min(0).default(0),
});

function toNum(v: string | number | null | undefined) {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const parsed = searchSchema.safeParse({
    q: searchParams.get('q'),
    offset: searchParams.get('offset') ?? '0',
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid query';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  const { q, offset } = parsed.data;

  try {
    // Custom foods
    const foodRows = await db
      .select({
        id: foods.id,
        name: foods.name,
        brandName: foods.brandName,
        calories: foods.calories,
        thumb: foodPhotos.thumb,
      })
      .from(foods)
      .leftJoin(foodPhotos, eq(foodPhotos.foodId, foods.id))
      .where(
        and(
          eq(foods.userId, session.user.id),
          ilike(foods.name, `%${q}%`),
        ),
      )
      .orderBy(asc(foods.name))
      .limit(10)
      .offset(offset);

    // Custom dishes
    const dishRows = await db
      .select({
        id: customDishes.id,
        name: customDishes.name,
        thumbnail: dishPhotos.thumb,
        ingredientQty: customDishIngredients.quantity,
        foodCalories: foods.calories,
      })
      .from(customDishes)
      .leftJoin(dishPhotos, eq(dishPhotos.dishId, customDishes.id))
      .leftJoin(customDishIngredients, eq(customDishIngredients.dishId, customDishes.id))
      .leftJoin(foods, eq(customDishIngredients.foodId, foods.id))
      .where(and(eq(customDishes.userId, session.user.id), ilike(customDishes.name, `%${q}%`)))
      .orderBy(desc(customDishes.createdAt));

    // Aggregate dish calories
    const dishMap = new Map<string, { id: string; name: string; thumbnail: string | null; totalCalories: number }>();
    for (const row of dishRows) {
      if (!dishMap.has(row.id)) dishMap.set(row.id, { id: row.id, name: row.name, thumbnail: row.thumbnail ?? null, totalCalories: 0 });
      if (row.ingredientQty != null) {
        dishMap.get(row.id)!.totalCalories += (toNum(row.foodCalories) / 100) * toNum(row.ingredientQty);
      }
    }

    const foodResults = foodRows.map((r) => ({
      id: r.id,
      name: r.name,
      brandName: r.brandName ?? null,
      thumbnail: r.thumb ?? null,
      calories: r.calories ? parseFloat(r.calories) : null,
      itemKind: 'food' as const,
    }));

    const dishResults = Array.from(dishMap.values()).map((d) => ({
      id: null as string | null,
      name: d.name,
      brandName: null as string | null,
      thumbnail: d.thumbnail,
      calories: Math.round(d.totalCalories),
      itemKind: 'dish' as const,
      dishId: d.id,
    }));

    return NextResponse.json({ results: [...foodResults, ...dishResults] });
  } catch {
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
