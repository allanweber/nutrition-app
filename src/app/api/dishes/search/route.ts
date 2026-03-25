import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { customDishes, customDishIngredients, foods } from '@/server/db/schema';
import { eq, and, ilike, desc } from 'drizzle-orm';

const searchSchema = z.object({
  q: z.string().min(3).max(200).transform((s) => s.trim()),
});

function toNum(v: string | number | null | undefined) {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
}

// GET /api/dishes/search?q= — search user's dishes, returns itemKind: 'dish'
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const parsed = searchSchema.safeParse({ q: searchParams.get('q') });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid query' }, { status: 400 });
  }

  const { q } = parsed.data;

  const rows = await db
    .select({
      id: customDishes.id,
      name: customDishes.name,
      ingredientQty: customDishIngredients.quantity,
      foodCalories: foods.calories,
    })
    .from(customDishes)
    .leftJoin(customDishIngredients, eq(customDishIngredients.dishId, customDishes.id))
    .leftJoin(foods, eq(customDishIngredients.foodId, foods.id))
    .where(and(eq(customDishes.userId, user.id), ilike(customDishes.name, `%${q}%`)))
    .orderBy(desc(customDishes.createdAt));

  const dishMap = new Map<string, { id: string; name: string; totalCalories: number }>();
  for (const row of rows) {
    if (!dishMap.has(row.id)) {
      dishMap.set(row.id, { id: row.id, name: row.name, totalCalories: 0 });
    }
    if (row.ingredientQty != null) {
      dishMap.get(row.id)!.totalCalories += (toNum(row.foodCalories) / 100) * toNum(row.ingredientQty);
    }
  }

  const results = Array.from(dishMap.values()).map((d) => ({
    id: null as string | null,
    fatSecretId: null as string | null,
    name: d.name,
    brandName: null as string | null,
    foodType: 'Custom' as const,
    thumbnail: null as string | null,
    calories: Math.round(d.totalCalories),
    itemKind: 'dish' as const,
    dishId: d.id,
  }));

  return NextResponse.json({ results });
}
