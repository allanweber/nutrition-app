import { NextRequest, NextResponse } from 'next/server';
import { putBlob, delBlob } from '@/lib/blob-storage';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { foods, foodPhotos } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/foods/custom/[foodId]/photo
// Body: FormData with 'thumb' and 'display' blobs (pre-resized by client canvas)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ foodId: string }> },
) {
  const { foodId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const food = await db.query.foods.findFirst({
    where: and(eq(foods.id, foodId), eq(foods.userId, user.id)),
  });
  if (!food) return NextResponse.json({ error: 'Food not found' }, { status: 404 });

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
    putBlob(`photos/foods/${user.id}/${foodId}/thumb-${ts}.jpg`, thumbFile),
    putBlob(`photos/foods/${user.id}/${foodId}/display-${ts}.jpg`, displayFile),
  ]);

  // Upsert food_photos row (reuse existing table, thumb + highres columns)
  await db
    .insert(foodPhotos)
    .values({
      foodId,
      thumb: thumbResult.url,
      highres: displayResult.url,
    })
    .onConflictDoUpdate({
      target: foodPhotos.foodId,
      set: {
        thumb: thumbResult.url,
        highres: displayResult.url,
      },
    });

  return NextResponse.json({ thumb: thumbResult.url, highres: displayResult.url });
}

// DELETE /api/foods/custom/[foodId]/photo
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ foodId: string }> },
) {
  const { foodId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const food = await db.query.foods.findFirst({
    where: and(eq(foods.id, foodId), eq(foods.userId, user.id)),
  });
  if (!food) return NextResponse.json({ error: 'Food not found' }, { status: 404 });

  // Get current photo URLs to delete from blob storage
  const existing = await db.query.foodPhotos.findFirst({
    where: eq(foodPhotos.foodId, foodId),
  });

  if (existing) {
    const toDelete: string[] = [];
    if (existing.thumb) toDelete.push(existing.thumb);
    if (existing.highres) toDelete.push(existing.highres);
    if (toDelete.length > 0) {
      await Promise.allSettled(toDelete.map((url) => delBlob(url)));
    }
    await db.delete(foodPhotos).where(eq(foodPhotos.foodId, foodId));
  }

  return new NextResponse(null, { status: 204 });
}
