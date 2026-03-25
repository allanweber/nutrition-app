import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { favorites } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

// DELETE /api/favorites/[favoriteId] — remove favorite (ownership check)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ favoriteId: string }> }
) {
  const { favoriteId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const fav = await db.query.favorites.findFirst({
    where: and(eq(favorites.id, favoriteId), eq(favorites.userId, user.id)),
  });

  if (!fav) return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });

  await db.delete(favorites).where(eq(favorites.id, favoriteId));

  return NextResponse.json({ success: true });
}
