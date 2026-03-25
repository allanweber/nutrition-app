import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { favorites, foods, customDishes, dishPhotos, foodPhotos } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';

function toNum(v: string | number | null | undefined) {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
}

// GET /api/favorites/top — top 6 favorites for NutritionPulse sidebar
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select({
      id: favorites.id,
      foodId: favorites.foodId,
      dishId: favorites.dishId,
      createdAt: favorites.createdAt,
      foodName: foods.name,
      foodCalories: foods.calories,
      foodThumb: foodPhotos.thumb,
      dishName: customDishes.name,
      dishThumb: dishPhotos.thumb,
    })
    .from(favorites)
    .leftJoin(foods, eq(favorites.foodId, foods.id))
    .leftJoin(foodPhotos, eq(favorites.foodId, foodPhotos.foodId))
    .leftJoin(customDishes, eq(favorites.dishId, customDishes.id))
    .leftJoin(dishPhotos, eq(favorites.dishId, dishPhotos.dishId))
    .where(eq(favorites.userId, user.id))
    .orderBy(desc(favorites.createdAt))
    .limit(6);

  const items = rows.map((r) => ({
    id: r.id,
    type: r.foodId ? 'food' as const : 'dish' as const,
    itemId: (r.foodId ?? r.dishId)!,
    name: r.foodId ? (r.foodName ?? '') : (r.dishName ?? ''),
    calories: r.foodId ? (r.foodCalories ? Math.round(toNum(r.foodCalories)) : null) : null,
    thumbnail: r.foodId ? (r.foodThumb ?? null) : (r.dishThumb ?? null),
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ favorites: items });
}
