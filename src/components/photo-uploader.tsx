'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import { resizeForUpload } from '@/lib/image-resize';

export interface PhotoUploaderProps {
  /** Current thumbnail URL to display (from the server) */
  currentThumb?: string | null;
  /** API endpoint to POST/DELETE photo — e.g. '/api/foods/custom/abc/photo' */
  uploadUrl: string;
  /** Called after a successful upload with the new thumb + highres URLs */
  onUploaded: (thumb: string, highres: string) => void;
  /** Called after a successful delete */
  onDeleted: () => void;
  /** Disable all interactions */
  disabled?: boolean;
  /** Label shown above the drop zone */
  label?: string;
}

type UploaderState = 'idle' | 'dragging' | 'processing' | 'uploading' | 'error';

export function PhotoUploader({
  currentThumb,
  uploadUrl,
  onUploaded,
  onDeleted,
  disabled = false,
  label = 'Photo',
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<UploaderState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Clean up preview object URL on unmount or when it changes
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const processFile = useCallback(
    async (file: File) => {
      if (disabled) return;
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Only image files are accepted.');
        setState('error');
        return;
      }

      // Show local preview immediately
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return localPreview;
      });

      setState('processing');
      setErrorMsg(null);

      let resized: Awaited<ReturnType<typeof resizeForUpload>>;
      try {
        resized = await resizeForUpload(file);
      } catch {
        setState('error');
        setErrorMsg('Failed to process image. Please try another file.');
        return;
      }

      setState('uploading');

      try {
        const formData = new FormData();
        formData.append('thumb', resized.thumb, 'thumb.jpg');
        formData.append('display', resized.display, 'display.jpg');

        const res = await fetch(uploadUrl, { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? 'Upload failed');
        }

        const data = (await res.json()) as { thumb: string; highres: string };
        setPreviewUrl(null); // clear local preview; parent will pass new currentThumb
        setState('idle');
        onUploaded(data.thumb, data.highres);
      } catch (err) {
        setState('error');
        setErrorMsg(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      }
    },
    [disabled, uploadUrl, onUploaded],
  );

  // --- Event handlers ---

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    // Reset input so the same file can be re-selected after delete
    e.target.value = '';
  };

  const handleClick = () => {
    if (disabled || state === 'processing' || state === 'uploading') return;
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setState('dragging');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only leave if the pointer actually left the drop zone
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setState('idle');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setState('idle');
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (disabled) return;
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItem = items.find((item) => item.type.startsWith('image/'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) void processFile(file);
      }
    },
    [disabled, processFile],
  );

  // Register global paste listener when the drop zone is focused or hovered
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleDelete = async () => {
    if (disabled || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(uploadUrl, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete photo');
      setPreviewUrl(null);
      setState('idle');
      setErrorMsg(null);
      onDeleted();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete photo');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Derived state ---

  const displaySrc = previewUrl ?? currentThumb ?? null;
  const isBusy = state === 'processing' || state === 'uploading' || isDeleting;
  const isDragging = state === 'dragging';

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold text-foreground">{label}</span>

      <div className="flex items-start gap-4">
        {/* Drop zone / preview area */}
        <div
          ref={dropZoneRef}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={displaySrc ? 'Replace photo' : 'Upload photo'}
          onClick={handleClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={[
            'relative flex items-center justify-center w-28 h-28 rounded-xl overflow-hidden cursor-pointer select-none transition-colors',
            'border-2 border-dashed',
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-outline-variant/40 bg-surface-container-lowest hover:border-primary/60 hover:bg-muted/40',
            disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
          ].join(' ')}
        >
          {/* Current photo */}
          {displaySrc && !isBusy && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displaySrc}
              alt="Uploaded photo"
              className="w-full h-full object-cover"
            />
          )}

          {/* Busy overlay */}
          {isBusy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 gap-1">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-[10px] text-muted-foreground">
                {state === 'processing' ? 'Processing…' : isDeleting ? 'Removing…' : 'Uploading…'}
              </span>
            </div>
          )}

          {/* Empty state */}
          {!displaySrc && !isBusy && (
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground p-2">
              <ImageIcon className="h-6 w-6" />
              <Upload className="h-3 w-3" />
            </div>
          )}

          {/* Hover replace overlay when photo exists */}
          {displaySrc && !isBusy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-medium text-white text-center px-1">
                Replace
              </span>
            </div>
          )}
        </div>

        {/* Right-side hints + delete */}
        <div className="flex flex-col justify-between h-28 py-0.5">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground leading-snug">
              Drop image, paste&nbsp;
              <kbd className="text-[10px] font-mono border border-border rounded px-0.5">⌘V</kbd>
              , or click to browse
            </p>
            <p className="text-[10px] text-muted-foreground">JPEG, PNG, WebP · max 10 MB</p>
          </div>

          {displaySrc && !isBusy && (
            <button
              type="button"
              disabled={disabled || isDeleting}
              onClick={(e) => { e.stopPropagation(); void handleDelete(); }}
              className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
            >
              <X className="h-3 w-3" />
              Remove photo
            </button>
          )}
        </div>
      </div>

      {errorMsg && <p className="text-xs text-destructive mt-1">{errorMsg}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
        disabled={disabled}
        aria-hidden="true"
      />
    </div>
  );
}
