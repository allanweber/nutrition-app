/**
 * Client-side image resize utility using the browser Canvas API.
 * Produces two JPEG blobs from a source File:
 *  - thumb:   max 300px on longest side, quality 0.65
 *  - display: max 900px on longest side, quality 0.85
 */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function resizeToBlob(
  img: HTMLImageElement,
  maxSize: number,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ratio = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight);
    // Never upscale — only downscale if image is larger than maxSize
    const scale = ratio < 1 ? ratio : 1;
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2D context not available'));
      return;
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/jpeg',
      quality,
    );
  });
}

export interface ResizedImages {
  thumb: Blob;   // ~300px max, JPEG 65%
  display: Blob; // ~900px max, JPEG 85%
}

/**
 * Resize a File into two optimised JPEG blobs suitable for upload.
 * Must be called in a browser environment (uses Canvas and URL.createObjectURL).
 */
export async function resizeForUpload(file: File): Promise<ResizedImages> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const [thumb, display] = await Promise.all([
      resizeToBlob(img, 300, 0.65),
      resizeToBlob(img, 900, 0.85),
    ]);
    return { thumb, display };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
