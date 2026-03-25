/**
 * Blob storage abstraction.
 * - Production (BLOB_READ_WRITE_TOKEN set): uses Vercel Blob
 * - Local dev (no token): saves to public/uploads/ and returns relative URLs
 */

import path from 'path';
import fs from 'fs/promises';

const isLocal = !process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function putBlob(blobPath: string, blob: Blob): Promise<{ url: string }> {
  if (isLocal) {
    const filePath = path.join(LOCAL_UPLOADS_DIR, blobPath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const buffer = Buffer.from(await blob.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    return { url: `/uploads/${blobPath}` };
  }

  const { put } = await import('@vercel/blob');
  return put(blobPath, blob, { access: 'public' });
}

export async function delBlob(url: string): Promise<void> {
  if (isLocal) {
    // url is like /uploads/photos/... — map back to filesystem path
    const relativePath = url.replace(/^\/uploads\//, '');
    const filePath = path.join(LOCAL_UPLOADS_DIR, relativePath);
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore — file may already be gone
    }
    return;
  }

  const { del } = await import('@vercel/blob');
  await del(url);
}
