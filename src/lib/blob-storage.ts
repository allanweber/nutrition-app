/**
 * Blob storage abstraction.
 * - Production (R2_ACCESS_KEY_ID set): uses Cloudflare R2 via S3-compatible API
 * - Local dev (no key): saves to public/uploads/ and returns relative URLs
 */

import path from 'path';
import fs from 'fs/promises';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const isLocal = !process.env.R2_ACCESS_KEY_ID;
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function putBlob(blobPath: string, blob: Blob): Promise<{ url: string }> {
  if (isLocal) {
    const filePath = path.join(LOCAL_UPLOADS_DIR, blobPath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const buffer = Buffer.from(await blob.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    return { url: `/uploads/${blobPath}` };
  }

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: blobPath,
      Body: Buffer.from(await blob.arrayBuffer()),
      ContentType: blob.type || 'application/octet-stream',
    })
  );

  const publicUrl = process.env.R2_PUBLIC_URL!.replace(/\/$/, '');
  return { url: `${publicUrl}/${blobPath}` };
}

export async function delBlob(url: string): Promise<void> {
  if (isLocal) {
    const relativePath = url.replace(/^\/uploads\//, '');
    const filePath = path.join(LOCAL_UPLOADS_DIR, relativePath);
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore — file may already be gone
    }
    return;
  }

  const publicUrl = process.env.R2_PUBLIC_URL!.replace(/\/$/, '');
  const key = url.replace(`${publicUrl}/`, '');
  try {
    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      })
    );
  } catch {
    // ignore — object may already be gone
  }
}
