# Plan: Custom Foods Edit/Create Redesign

## Context
Redesigning the custom food form (`CustomFoodForm`) to match the new design mockup (`docs/design/custom_foods_edit.html`). The current form is functional but visually plain. The redesign introduces stepped layout, macro cards with colored left borders, a serving unit dropdown, and a proper page header with back navigation.

## User Decisions
- **Brand Name**: Keep optional (no required validation)
- **Legacy serving units**: Show empty dropdown if existing value doesn't match enum — user must re-select

---

## Files to Modify / Create

### 1. `src/lib/nutrition-constants.ts` — Add `MACRO_CELL_BORDER`
Purely additive. Add after `MACRO_CELL_FILL`:
```typescript
export const MACRO_CELL_BORDER = {
  protein: 'border-l-[#D54069] dark:border-l-rose-400',
  carbs:   'border-l-[#CC7A40] dark:border-l-amber-400',
  fat:     'border-l-[#408FBE] dark:border-l-sky-400',
} as const;
```

### 2. `src/lib/form-validation.ts` — Add `SERVING_UNIT_VALUES` + update schema
Add before `customFoodFormSchema`:
```typescript
export const SERVING_UNIT_VALUES = [
  'g', 'oz', 'mL', 'c', 'fl oz', 'container', 'scoop', 'piece',
] as const satisfies [string, ...string[]];
export type ServingUnit = typeof SERVING_UNIT_VALUES[number];
```

Change `servingUnit` in `customFoodFormSchema`:
```typescript
// from:
servingUnit: z.string().max(50).optional(),
// to:
servingUnit: z.enum(SERVING_UNIT_VALUES).optional(),
```

### 3. `src/components/serving-unit-select.tsx` — New file
Controlled `Select` component using shadcn `Select/SelectTrigger/SelectContent/SelectItem`. Consumes `SERVING_UNIT_VALUES` from `form-validation.ts`.

Props:
```typescript
interface ServingUnitSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
  disabled?: boolean;
}
```

Labels map: `{ g: 'Grams (g)', oz: 'Ounces (oz)', mL: 'Milliliters (mL)', c: 'Cups (c)', 'fl oz': 'Fluid ounces (fl oz)', container: 'Container', scoop: 'Scoop', piece: 'Piece' }`

Renders `border-destructive` on `SelectTrigger` + `<p className="text-sm text-destructive">` below on error.

### 4. `src/components/forms/custom-food-form.tsx` — Full layout redesign

Keep all existing logic (mutations, `useEffect` reset, `pendingImageFile`, `onSubmit` payload builder). Change the visual structure:

**Header** (above `<form>`):
```tsx
// Small back link above PageHeader
<Link href="/my-foods" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
  <ArrowLeft className="h-4 w-4" /> My Foods
</Link>
<PageHeader
  title={isEdit ? (initialFood?.name ?? 'Edit Food') : 'Create Food'}
  subtitle={
    isEdit
      ? (initialFood?.brandName ?? 'Update nutrition values (per 100g)')
      : 'Define a custom food with your own nutrition values (per 100g)'
  }
/>
```

**Step labels**: `<p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">STEP N: ...</p>`

**Step 1 — Photo**: Wrap `PhotoUploader` in a section with step label. No card border needed — the uploader renders its own dashed border.

**Step 2 — General Info**:
- 2-column grid: Food Name (required) | Brand Name (optional)
- 3-column grid: Serving Qty | Serving Unit (`ServingUnitSelect`) | Weight (g)
- All wrapped in `rounded-xl border border-outline-variant/20 p-6 bg-surface-container-lowest`

Add `onSubmit` validators to `servingQty`, `servingUnit`, `servingWeightGrams` so they are required on submit:
```typescript
validators={{
  onChange: zodValidator(customFoodFormSchema.shape.servingUnit),
  onSubmit: ({ value }) => (!value ? 'Serving unit is required' : undefined),
}}
```

**Step 3 — Nutrition Details**: Add new `MacroCard` inner component alongside the existing `NumberField`:
```typescript
function MacroCard({ label, name, fieldApi, unit, bgClass, textClass, borderClass }) {
  // renders a card div with colored left border + large number input
}
```

Macro card grid: `grid grid-cols-2 md:grid-cols-4 gap-3`
- Calories: `bg-surface-container-lowest`, no colored border, label in `text-muted-foreground`
- Protein: `cn(MACRO_CELL_BG.protein, 'border-l-4', MACRO_CELL_BORDER.protein)`, label in `MACRO_CELL_TEXT.protein`
- Carbs: same pattern with carbs constants
- Fat: same pattern with fat constants

Additional Nutrients sub-section (inside same Step 3 card):
- Separator `<hr className="border-outline-variant/20" />`
- Label `"Additional Nutrients"` + `"(optional)"` in muted
- 3-column grid: Fiber | Sugar | Sodium (using `NumberField`)

**Footer**:
```tsx
<div className="flex gap-3 pt-4">
  <Button variant="outline" asChild>
    <Link href="/my-foods">Cancel</Link>
  </Button>
  <Button type="submit" disabled={isSubmitting || mutation.isPending} className="flex-1">
    {isSubmitting || mutation.isPending ? <><Loader2 ... />Saving…</> : isEdit ? 'Save Changes' : 'Create Food'}
  </Button>
</div>
```

**Serving unit form field** — replace `<Input>` with `<ServingUnitSelect>`:
```tsx
<form.Field name="servingUnit" validators={{...}}>
  {(field) => (
    <div className="space-y-1.5">
      <Label htmlFor="servingUnit" className="text-xs font-semibold">Serving Unit</Label>
      <ServingUnitSelect
        id="servingUnit"
        value={field.state.value as string}
        onChange={(v) => field.handleChange(v as never)}
        error={field.state.meta.errors[0]}
        disabled={mutation.isPending}
      />
    </div>
  )}
</form.Field>
```

---

## Page files — No changes needed
- `src/app/(dashboard)/my-foods/[foodId]/edit/page.tsx` — unchanged
- `src/app/(dashboard)/my-foods/create/page.tsx` — unchanged

---

## Implementation Order
1. Add `MACRO_CELL_BORDER` to `nutrition-constants.ts`
2. Add `SERVING_UNIT_VALUES` to `form-validation.ts` + update schema
3. Create `serving-unit-select.tsx`
4. Rewrite `custom-food-form.tsx` layout

## Verification
- Create flow: navigate to `/my-foods/create`, fill all fields, submit → redirects to `/my-foods`
- Edit flow: navigate to `/my-foods/{id}/edit`, verify food name/brand in header, change fields, save
- Legacy serving unit: edit a food with old serving unit → dropdown shows empty placeholder
- Macro cards: verify colored left borders on Protein/Carbs/Fat cards
- Required fields: try submitting with empty Serving Qty/Unit/Weight → errors appear
- Optional brand name: submit without brand name → no error
