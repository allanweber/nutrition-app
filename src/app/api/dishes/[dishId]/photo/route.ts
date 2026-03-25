import { NextRequest, NextResponse } from 'next/server';
import { putBlob, delBlob } from '@/lib/blob-storage';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { customDishes, dishPhotos } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/dishes/[dishId]/photo
// Body: FormData with 'thumb' and 'display' blobs (pre-resized by client canvas)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dishId: string }> },
) {
  const { dishId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const dish = await db.query.customDishes.findFirst({
    where: and(eq(customDishes.id, dishId), eq(customDishes.userId, user.id)),
  });
  if (!dish) return NextResponse.json({ error: 'Dish not found' }, { status: 404 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const thumbFile = formData.get('thumb');
  const displayFile = formData.get('display');

  if (!(thumbFile instanceof Blob) || !(displayFile instanceof Blob)) {
    return NextResponse.json({ error: 'Missing thumb or display image' }, { status: 400 });
  }

  const ts = Date.now();
  const [thumbResult, displayResult] = await Promise.all([
    putBlob(`photos/dishes/${user.id}/${dishId}/thumb-${ts}.jpg`, thumbFile),
    putBlob(`photos/dishes/${user.id}/${dishId}/display-${ts}.jpg`, displayFile),
  ]);

  // Upsert dish_photos row
  await db
    .insert(dishPhotos)
    .values({
      dishId,
      thumb: thumbResult.url,
      highres: displayResult.url,
    })
    .onConflictDoUpdate({
      target: dishPhotos.dishId,
      set: {
        thumb: thumbResult.url,
        highres: displayResult.url,
      },
    });

  return NextResponse.json({ thumb: thumbResult.url, highres: displayResult.url });
}

// DELETE /api/dishes/[dishId]/photo
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ dishId: string }> },
) {
  const { dishId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const dish = await db.query.customDishes.findFirst({
    where: and(eq(customDishes.id, dishId), eq(customDishes.userId, user.id)),
  });
  if (!dish) return NextResponse.json({ error: 'Dish not found' }, { status: 404 });

  // Get current photo URLs to delete from blob storage
  const existing = await db.query.dishPhotos.findFirst({
    where: eq(dishPhotos.dishId, dishId),
  });

  if (existing) {
    const toDelete: string[] = [];
    if (existing.thumb) toDelete.push(existing.thumb);
    if (existing.highres) toDelete.push(existing.highres);
    if (toDelete.length > 0) {
      await Promise.allSettled(toDelete.map((url) => delBlob(url)));
    }
    await db.delete(dishPhotos).where(eq(dishPhotos.dishId, dishId));
  }

  return new NextResponse(null, { status: 204 });
}
