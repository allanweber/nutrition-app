import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { favorites, foods, customDishes, foodPhotos } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { validateRequestBody } from '@/lib/api-validation';

const addFavoriteSchema = z
  .object({
    foodId: z.string().uuid().optional(),
    dishId: z.string().uuid().optional(),
  })
  .refine((d) => d.foodId || d.dishId, { message: 'Either foodId or dishId is required' })
  .refine((d) => !(d.foodId && d.dishId), { message: 'Only one of foodId or dishId can be set' });

function toNum(v: string | number | null | undefined) {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
}

// GET /api/favorites — all user favorites with food/dish details
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
    })
    .from(favorites)
    .leftJoin(foods, eq(favorites.foodId, foods.id))
    .leftJoin(foodPhotos, eq(favorites.foodId, foodPhotos.foodId))
    .leftJoin(customDishes, eq(favorites.dishId, customDishes.id))
    .where(eq(favorites.userId, user.id))
    .orderBy(desc(favorites.createdAt));

  const items = rows.map((r) => ({
    id: r.id,
    type: r.foodId ? 'food' as const : 'dish' as const,
    itemId: (r.foodId ?? r.dishId)!,
    name: r.foodId ? (r.foodName ?? '') : (r.dishName ?? ''),
    calories: r.foodId ? (r.foodCalories ? Math.round(toNum(r.foodCalories)) : null) : null,
    thumbnail: r.foodThumb ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ favorites: items });
}

// POST /api/favorites — add favorite (upsert-safe: 200 if already exists)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const validation = await validateRequestBody(request, addFavoriteSchema);
  if (!validation.success) return validation.response;

  const { foodId, dishId } = validation.data;

  // Check if already exists
  const existing = await db.query.favorites.findFirst({
    where: foodId
      ? eq(favorites.foodId, foodId)
      : eq(favorites.dishId, dishId!),
  });

  if (existing && existing.userId === user.id) {
    return NextResponse.json({ success: true, favoriteId: existing.id, alreadyExists: true });
  }

  const [newFav] = await db
    .insert(favorites)
    .values({ userId: user.id, foodId: foodId ?? null, dishId: dishId ?? null })
    .returning();

  return NextResponse.json({ success: true, favoriteId: newFav.id }, { status: 201 });
}
