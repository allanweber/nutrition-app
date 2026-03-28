# Plan: Redesign PhotoUploader Component

## Context
The current `PhotoUploader` is a compact 7rem square drop zone with a side panel — functional but minimal. The new design from `docs/design/uploader.html` and `docs/design/uploader_with_image.html` calls for a full-width, prominent upload area matching the brand aesthetic. Additionally, the uploader should now appear in **create mode** (not just edit mode), with the image upload queued until after the entity is saved.

## Scope

### Files to modify
- `src/components/photo-uploader.tsx` — full redesign
- `src/components/forms/custom-food-form.tsx` — show uploader in create mode, upload image after entity creation
- `src/components/forms/custom-dish-form.tsx` — same as above

## New Design

### Empty state (no image)
Full-width dashed bordered box, centered content:
- `UploadCloud` icon from lucide in a green-tinted circle
- Heading: "Drag & drop files here"
- Subtext: "Upload images of your meals, ingredient lists, or clinical results for AI processing."
- Primary "Browse Files" button + "or" + "Paste Ctrl+V" pill
- Footer: "Supports JPG, PNG, WebP · max 10 MB"
- Dragging state: border becomes solid primary, background tints green

### With-image state
Side-by-side layout (`flex-row` on md+, stacked on mobile):
- **Left panel** (`flex-1`): image fills container (`object-cover`), rounded corners, with:
  - **Top-right badge**: filename (from state on new upload) or "Uploaded" (for existing server images where filename is unavailable)
  - **Bottom-right button**: `Trash2` icon, white background, rounded, deletes the image
- **Right panel** (`flex-1`): same drop zone, slightly compact (smaller icon, tighter padding), allows replacing the image

### Busy / error states
- Processing/uploading/deleting: spinner overlay on the image panel (or drop zone for initial upload)
- Error message shown below the component as before

## `PhotoUploader` Props Changes

```ts
export interface PhotoUploaderProps {
  currentThumb?: string | null;      // existing: server thumbnail URL
  uploadUrl?: string;                // now OPTIONAL — omit in create mode
  onUploaded?: (thumb: string, highres: string) => void;
  onDeleted?: () => void;
  onFileSelected?: (file: File | null) => void; // NEW: called in create mode instead of uploading
  disabled?: boolean;
  label?: string;
}
```

**Behaviour by mode:**
- `uploadUrl` provided → upload immediately on file selection (edit mode, existing behaviour)
- `uploadUrl` absent → hold file locally, call `onFileSelected(file)`, show preview (create mode)

**Filename tracking:**
- Add `localFileName` state: set to `file.name` when a file is selected, cleared on delete
- Badge shows `localFileName` if set, otherwise `"Uploaded"`

## Form Changes

### Create mode (both forms)

Add to `CustomFoodForm` and `CustomDishForm`:
```ts
const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
```

Show `PhotoUploader` unconditionally (remove `isEdit &&` guard):
```tsx
<PhotoUploader
  currentThumb={isEdit ? (initialFood?.images?.thumb ?? null) : null}
  uploadUrl={isEdit && foodId ? `/api/foods/custom/${foodId}/photo` : undefined}
  onFileSelected={!isEdit ? (file) => setPendingImageFile(file) : undefined}
  onUploaded={isEdit ? () => qc.invalidateQueries(...) : undefined}
  onDeleted={isEdit ? () => qc.invalidateQueries(...) : undefined}
  label="Food Photo"
  disabled={mutation.isPending}
/>
```

In the create mutation's `onSuccess`, after getting back the new entity ID, upload the pending file:
```ts
onSuccess: async (newFood) => {
  if (pendingImageFile) {
    const resized = await resizeForUpload(pendingImageFile);
    const fd = new FormData();
    fd.append('thumb', resized.thumb, 'thumb.jpg');
    fd.append('display', resized.display, 'display.jpg');
    await fetch(`/api/foods/custom/${newFood.id}/photo`, { method: 'POST', body: fd });
  }
  router.push('/my-foods');
}
```

Same pattern for `CustomDishForm` using dish ID and `/api/dishes/${dishId}/photo`.

## Implementation Steps

1. **Redesign `photo-uploader.tsx`**
   - Add `localFileName` state
   - Make `uploadUrl` optional; add `onFileSelected` prop
   - When no `uploadUrl`: skip fetch, call `onFileSelected(file)` instead
   - Rewrite JSX: empty-state layout matching design, with-image layout (side-by-side)
   - Use `UploadCloud` + `Trash2` from lucide-react; keep existing icons for busy states
   - Keep all drag/drop/paste event logic unchanged

2. **Update `custom-food-form.tsx`**
   - Add `pendingImageFile` state
   - Remove `isEdit &&` guard on the photo section
   - Pass correct props based on `isEdit`
   - After create mutation `onSuccess`: upload pending file if present

3. **Update `custom-dish-form.tsx`**
   - Same changes as food form

## Verification
- Open `/my-foods/create` — uploader renders, selecting an image shows preview with filename badge; no network upload until save
- Save the form — food is created then image uploads, navigating to list shows the thumbnail
- Open `/my-foods/[id]/edit` — existing image shown with "Uploaded" badge; delete button removes it; dropping a new file replaces it immediately
- Same flows for `/my-foods/dishes/create` and `/my-foods/dishes/[id]/edit`
- Drag & drop and Ctrl+V paste work in both modes
- Mobile: layout stacks correctly (image on top, drop zone below)
