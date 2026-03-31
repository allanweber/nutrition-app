# Plan: Custom Dish Create/Edit Redesign

## Context

The current `CustomDishForm` is a single-column, `max-w-2xl` layout where adding an ingredient opens `FoodModal`. The redesign introduces a two-column responsive layout (form left, sticky nutrition summary right), removes the modal entirely replacing it with an inline auto-add flow, adds a slider+input per ingredient row with live macro badges, and a collapsible mobile-first summary panel showing kcal + protein/carbs/fat/fiber/sugar/sodium.

## User decisions

- Summary: kcal + Protein, Carbs, Fat + Fiber, Sugar, Sodium
- Edit header title: static dish name from DB (not reactive)
- Photo uploader: keep as-is

---

## Critical Files

- **Modify**: `src/components/forms/custom-dish-form.tsx` — full redesign
- **Modify**: `src/lib/nutrition-constants.ts` — add fiber/sugar/sodium color constants
- **Read-only**: `src/components/page-header.tsx`, `src/components/dashboard/shared/progress-bar.tsx`
- **Read-only**: `src/queries/food-detail.ts` — `FoodDetailResponse.baseServing` (per-100g; sodium is in **mg**)
- **Read-only**: `src/queries/goals.ts` / `src/types/goals.ts` — `NutritionGoals` has `fiber` (g) and `sodium` (mg)
- **Read-only**: `src/components/ui/badge.tsx`
- No changes to `create/page.tsx` or `[dishId]/edit/page.tsx`

---

## Step 0: Add constants to `nutrition-constants.ts`

Append fiber, sugar, sodium color constants:

```typescript
export const NUTRIENT_COLORS = {
  fiber:  { bg: 'bg-[#F3E8FF]', text: 'text-[#7E22CE]', fill: 'bg-[#7E22CE]' },
  sugar:  { bg: 'bg-[#FFF1F2]', text: 'text-[#E11D48]', fill: 'bg-[#E11D48]' },
  sodium: { bg: 'bg-[#F1F5F9]', text: 'text-[#475569]', fill: 'bg-[#475569]' },
} as const;
```

> Note: `DishIngredient` (edit mode load) does not carry fiber/sugar/sodium — only protein/carbs/fat/calories. Existing ingredients will contribute 0 to those summary totals; newly added ingredients will have full data. Acceptable limitation.

---

## Step 1: New `Ingredient` Interface

```typescript
interface Ingredient {
  key: string;
  foodId: string;
  foodName: string;
  thumbnail?: string | null;
  quantity: number;           // grams
  caloriesPer100g: number;
  proteinPer100g: number;     // g per 100g food
  carbsPer100g: number;       // g per 100g food
  fatPer100g: number;         // g per 100g food
  fiberPer100g: number;       // g per 100g food
  sugarPer100g: number;       // g per 100g food
  sodiumMgPer100g: number;    // mg per 100g food  ← mg, not g
  isLoadingNutrition?: boolean;
}
```

**Conversion from `initialDish.ingredients` (edit mode)**:

```typescript
caloriesPer100g = ing.quantity > 0 ? (ing.calories / ing.quantity) * 100 : 0
// same for protein, carbs, fat; fiber/sugar/sodiumMgPer100g default to 0
```

---

## Step 2: Header

```tsx
<PageHeader
  overline={isEdit ? 'Edit Dish' : undefined}
  title={isEdit ? (initialDish?.name ?? 'Edit Dish') : 'Create Dish'}
  subtitle={isEdit
    ? (initialDish?.description ?? undefined)
    : 'Combine foods into a multi-ingredient dish'}
/>
```

---

## Step 3: Two-Column Layout

Remove `max-w-2xl` wrapper. Use CSS grid:

```tsx
<div className="pt-8 pb-16">
  <PageHeader ... />
  <form onSubmit=...>
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">

      {/* Summary — first in DOM: top on mobile, right on desktop */}
      <aside className="order-first lg:order-last lg:sticky lg:top-24">
        <DishNutritionSummary ingredients={ingredients} goals={goalsQuery.data} />
      </aside>

      {/* Form fields */}
      <div className="space-y-6">
        {/* Photo card */}
        {/* Name + Description card */}
        {/* Ingredients card */}
        {/* Error + Cancel/Save buttons */}
      </div>
    </div>
  </form>
</div>
```

`order-first lg:order-last` — aside first in DOM (top on mobile), pushed right on desktop.
`items-start` — required for `lg:sticky` to work (no height stretching).

---

## Step 4: Auto-Add Ingredient Flow (no modal)

**Remove**: `FoodModal` import, `ingredientModalOpen`, `handleIngredientModalClose`, `handleIngredientSelect`.
**Add state**: `pendingIngredientKey: string | null`.

**`handleAddIngredient`**:

```typescript
const handleAddIngredient = useCallback((item: UnifiedFoodSearchResultItem) => {
  if (!item.id || item.itemKind === 'dish') return;
  const key = `${item.id}-${Date.now()}`;
  setIngredients(prev => [...prev, {
    key, foodId: item.id!, foodName: item.name,
    thumbnail: item.thumbnail ?? null, quantity: 100,
    caloriesPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0,
    fiberPer100g: 0, sugarPer100g: 0, sodiumMgPer100g: 0,
    isLoadingNutrition: true,
  }]);
  setPendingIngredientItem(item);
  setPendingIngredientKey(key);
  setIngredientError(null);
  foodSearch.setQuery('');
}, [foodSearch]);
```

**`useEffect` to hydrate nutrition**:

```typescript
useEffect(() => {
  const detail = ingredientDetailQuery.data?.food;
  if (!detail || !pendingIngredientKey) return;
  const base = detail.baseServing;
  setIngredients(prev => prev.map(ing =>
    ing.key === pendingIngredientKey
      ? {
          ...ing,
          caloriesPer100g:  base.calories,
          proteinPer100g:   base.protein,
          carbsPer100g:     base.carbs,
          fatPer100g:       base.fat,
          fiberPer100g:     base.fiber  ?? 0,
          sugarPer100g:     base.sugar  ?? 0,
          sodiumMgPer100g:  base.sodium ?? 0,  // already in mg
          isLoadingNutrition: false,
        }
      : ing
  ));
  setPendingIngredientItem(null);
  setPendingIngredientKey(null);
}, [ingredientDetailQuery.data, pendingIngredientKey]);
```

**Submit payload**: `quantity` is already `number`, drop `parseFloat`. Guard: `|| ingredients.some(i => i.isLoadingNutrition)`.

---

## Step 5: New `IngredientRow`

Three-zone flex row:

```
[thumbnail 40×40] | [name + macro badges + slider — flex-1] | [number input + "g" + delete — shrink-0]
```

- Slider: `<input type="range" min={1} max={500} step={1}>` with `accent-primary`, clamp to `[1, 500]`
- Numeric input: `<Input type="number" min={1} max={500} className="w-16 text-right text-sm" />`
- Badges: `Badge` component with overridden className for `MACRO_CELL_BG`/`MACRO_TEXT_COLORS`. Show kcal (bg-primary/10 text-primary) + P/C/F in grams.
- When `isLoadingNutrition`: 4 skeleton `animate-pulse rounded-full bg-muted h-4 w-10` divs instead of badges.

---

## Step 6: `DishNutritionSummary`

Props: `ingredients: Ingredient[], goals: NutritionGoals | undefined`

**Totals with `useMemo`**:

```typescript
calories = Σ (caloriesPer100g / 100) * quantity          // kcal
protein  = Σ (proteinPer100g  / 100) * quantity          // g
carbs    = Σ (carbsPer100g    / 100) * quantity          // g
fat      = Σ (fatPer100g      / 100) * quantity          // g
fiber    = Σ (fiberPer100g    / 100) * quantity          // g
sugar    = Σ (sugarPer100g    / 100) * quantity          // g
sodium   = Σ (sodiumMgPer100g / 100) * quantity          // mg  ← mg throughout
```

**Collapsible** using `radix-ui` (`import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'radix-ui'`):

- Always visible header: large kcal (`text-primary`) + chevron trigger (`className="lg:hidden"`)
- `CollapsibleContent className="data-[state=closed]:lg:block"` — always visible on desktop via CSS
- `open` state: `useState(false)` (collapsed by default on mobile)
- Empty state when no ingredients: "Add ingredients to see nutrition"

**Progress bars**:

```
ProgressBar label="Protein" value={protein} goal={goals?.protein ?? 0} unit="g"  color={MACRO_COLORS.protein}
ProgressBar label="Carbs"   value={carbs}   goal={goals?.carbs   ?? 0} unit="g"  color={MACRO_COLORS.carbs}
ProgressBar label="Fat"     value={fat}     goal={goals?.fat     ?? 0} unit="g"  color={MACRO_COLORS.fat}
ProgressBar label="Fiber"   value={fiber}   goal={goals?.fiber   ?? 30} unit="g" color={NUTRIENT_COLORS.fiber.fill}
ProgressBar label="Sugar"   value={sugar}   goal={50}                   unit="g" color={NUTRIENT_COLORS.sugar.fill}
ProgressBar label="Sodium"  value={sodium}  goal={goals?.sodium  ?? 2300} unit="mg" color={NUTRIENT_COLORS.sodium.fill}
```

Sodium and fiber/sugar display values and goals are **all in mg for sodium, g for the rest** — units match naturally.

---

## Step 7: Goals Query

```typescript
const goalsQuery = useGoalsQuery();
```

---

## Imports in `custom-dish-form.tsx`

**Add**: `ChevronDown`, `ChevronUp` from `lucide-react`; `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger` from `'radix-ui'`; `Badge` from `@/components/ui/badge`; `PageHeader` from `@/components/page-header`; `ProgressBar` from `@/components/dashboard/shared/progress-bar`; `useGoalsQuery` from `@/queries/goals`; `MACRO_COLORS`, `MACRO_CELL_BG`, `MACRO_TEXT_COLORS`, `NUTRIENT_COLORS` from `@/lib/nutrition-constants`; `cn` from `@/lib/utils`.

**Remove**: `FoodModal`; `Link`; `ArrowLeft`.

---

## Verification

1. **Create**: Search food → row appears with skeleton → macros populate → slider+input synced → summary kcal/macros update live → sodium shown in mg → Save redirects to `/my-foods?tab=dishes`
2. **Edit**: Dish name in PageHeader → existing ingredients load with correct macros → add/remove/adjust → Save
3. **Mobile**: Summary at top collapsed (kcal only) → tap to expand → form below
4. **Desktop**: Two-column, summary sticky right, always expanded
5. **Cancel**: `Button variant="outline" asChild` wrapping `Link href="/my-foods?tab=dishes"`
6. **Fiber/sugar/sodium edit mode**: 0 for pre-existing ingredients (not stored in DishIngredient), real values for newly added
