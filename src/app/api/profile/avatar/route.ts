import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { putBlob } from '@/lib/blob-storage';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function getExtension(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('avatar');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ACCEPTED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG and WebP images are accepted' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File must be smaller than 5MB' }, { status: 400 });
    }

    const ext = getExtension(file.type);
    const blobPath = `avatars/${user.id}.${ext}`;
    const { url } = await putBlob(blobPath, new Blob([buffer], { type: file.type }));

    await db.update(users).set({ image: url, updatedAt: new Date() }).where(eq(users.id, user.id));

    return NextResponse.json({ success: true, image: url });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}
