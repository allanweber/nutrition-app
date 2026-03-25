import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { favorites } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/favorites/ids — just { foodIds, dishIds } for toggle state in search
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select({ foodId: favorites.foodId, dishId: favorites.dishId })
    .from(favorites)
    .where(eq(favorites.userId, user.id));

  const foodIds = rows.filter((r) => r.foodId != null).map((r) => r.foodId!);
  const dishIds = rows.filter((r) => r.dishId != null).map((r) => r.dishId!);

  return NextResponse.json({ foodIds, dishIds });
}
