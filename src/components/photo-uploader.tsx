'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { UploadCloud, Trash2, Loader2 } from 'lucide-react';
import { resizeForUpload } from '@/lib/image-resize';

export interface PhotoUploaderProps {
  /** Current thumbnail URL to display (from the server) */
  currentThumb?: string | null;
  /** API endpoint to POST/DELETE photo — omit in create mode */
  uploadUrl?: string;
  /** Called after a successful upload with the new thumb + highres URLs */
  onUploaded?: (thumb: string, highres: string) => void;
  /** Called after a successful delete */
  onDeleted?: () => void;
  /** Called in create mode instead of uploading — receives the file (or null on clear) */
  onFileSelected?: (file: File | null) => void;
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
  onFileSelected,
  disabled = false,
  label,
}: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<UploaderState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localFileName, setLocalFileName] = useState<string | null>(null);
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
      setLocalFileName(file.name);
      setState('processing');
      setErrorMsg(null);

      if (!uploadUrl) {
        // Create mode: hold file locally, notify parent
        setState('idle');
        onFileSelected?.(file);
        return;
      }

      // Edit mode: resize + upload immediately
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
        setPreviewUrl(null);
        setLocalFileName(null);
        setState('idle');
        onUploaded?.(data.thumb, data.highres);
      } catch (err) {
        setState('error');
        setErrorMsg(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      }
    },
    [disabled, uploadUrl, onUploaded, onFileSelected],
  );

  // --- Event handlers ---

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
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

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleDelete = async () => {
    if (disabled || isDeleting) return;

    if (!uploadUrl) {
      // Create mode: clear local state only
      setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
      setLocalFileName(null);
      setState('idle');
      setErrorMsg(null);
      onFileSelected?.(null);
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(uploadUrl, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete photo');
      setPreviewUrl(null);
      setLocalFileName(null);
      setState('idle');
      setErrorMsg(null);
      onDeleted?.();
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
  const badgeLabel = localFileName ?? 'Uploaded';

  // Shared drag/drop props
  const dropHandlers = {
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  };

  const DropZone = ({ compact }: { compact: boolean }) => (
    <div
      ref={dropZoneRef}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={displaySrc ? 'Replace photo' : 'Upload photo'}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      {...dropHandlers}
      className={[
        'relative flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer select-none rounded-2xl border-2 border-dashed',
        compact ? 'p-6' : 'p-8 md:p-12',
        isDragging
          ? 'border-primary bg-primary/10'
          : 'border-outline-variant/60 bg-muted/30 hover:bg-muted/50',
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
      ].join(' ')}
    >
      {/* Spinner when busy with no preview yet */}
      {!displaySrc && isBusy ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">
            {state === 'processing' ? 'Processing…' : 'Uploading…'}
          </span>
        </div>
      ) : (
        <>
          <div className={[
            'rounded-full bg-primary/10 flex items-center justify-center mb-3',
            compact ? 'w-10 h-10' : 'w-14 h-14',
          ].join(' ')}>
            <UploadCloud className={['text-primary', compact ? 'h-5 w-5' : 'h-7 w-7'].join(' ')} />
          </div>

          <h2 className={[
            'font-bold font-headline text-on-surface mb-2',
            compact ? 'text-base' : 'text-xl',
          ].join(' ')}>
            Drag &amp; drop files here
          </h2>

          {!compact && (
            <p className="text-on-surface-variant text-sm max-w-xs mx-auto mb-5">
              Upload images of your meals, ingredient lists, or clinical results for AI processing.
            </p>
          )}

          <div className={['flex items-center gap-3 justify-center', compact ? 'mb-3' : 'mb-4'].join(' ')}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClick(); }}
              className={[
                'bg-primary text-white font-bold font-headline rounded-xl hover:brightness-110 active:scale-95 transition-all duration-200 shadow-md shadow-primary/20 whitespace-nowrap',
                compact ? 'px-4 py-2 text-sm' : 'px-7 py-2.5 text-base',
              ].join(' ')}
            >
              Browse Files
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-on-surface-variant text-xs uppercase tracking-wider">or</span>
              <div className="flex items-center gap-1 bg-background px-2.5 py-1.5 rounded-lg border border-outline-variant/40 shadow-sm">
                <span className="text-xs text-on-surface-variant font-medium">Paste</span>
                <div className="flex items-center gap-0.5">
                  <kbd className="font-sans bg-muted px-1.5 py-0.5 rounded text-[10px] border border-outline-variant/30 text-on-surface">Ctrl</kbd>
                  <span className="text-[10px] text-on-surface-variant">+</span>
                  <kbd className="font-sans bg-muted px-1.5 py-0.5 rounded text-[10px] border border-outline-variant/30 text-on-surface">V</kbd>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-on-surface-variant/60 font-medium">
            Supports JPG, PNG, WebP · max 10 MB
          </p>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-2">
      {label && <span className="text-xs font-semibold text-foreground">{label}</span>}

      {displaySrc ? (
        // With-image: side-by-side layout
        <div className="flex flex-row gap-4">
          {/* Image panel — left */}
          <div className="flex-1 relative rounded-2xl overflow-hidden min-h-55 border border-outline-variant/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displaySrc}
              alt="Uploaded photo"
              className="w-full h-full object-cover"
            />

            {/* Busy overlay */}
            {isBusy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <span className="text-xs text-white font-medium">
                  {isDeleting ? 'Removing…' : state === 'processing' ? 'Processing…' : 'Uploading…'}
                </span>
              </div>
            )}

            {/* Top-right filename badge */}
            <div className="absolute top-3 right-3 bg-background/90 px-2 py-1 rounded-md text-[10px] font-bold text-primary shadow-sm uppercase tracking-tight max-w-40 truncate">
              {badgeLabel}
            </div>

            {/* Bottom-right delete button */}
            {!isBusy && (
              <button
                type="button"
                aria-label="Delete image"
                disabled={disabled || isDeleting}
                onClick={(e) => { e.stopPropagation(); void handleDelete(); }}
                className="absolute bottom-3 right-3 w-9 h-9 bg-background/90 hover:bg-background rounded-lg shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-90 border border-outline-variant/20 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 text-[#717a6d]" />
              </button>
            )}
          </div>

          {/* Drop zone (compact) — right */}
          <div className="flex-1">
            <DropZone compact />
          </div>
        </div>
      ) : (
        // Empty state: full-width drop zone
        <DropZone compact={false} />
      )}

      {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}

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
