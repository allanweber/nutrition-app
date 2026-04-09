# Meal Planner Feature — Implementation Plan

## Context

The app has a `/meal-planner` page that currently shows an empty state. The DB schema for diet plans is mostly complete (`diet_plans`, `diet_plan_meals`, `diet_plan_meal_items` tables exist), but `diet_plan_meals.dayOfWeek` is currently nullable and must be made NOT NULL. All other tables need no changes. The `src/app/api/diet-plans/` directory exists but is empty.

---

## Design Decisions (confirmed with user)

- **Active plan conflict**: AlertDialog shown immediately on both new plan creation AND status change from PlanCard dropdown
- **dayOfWeek**: Required (NOT NULL) — always 1=Monday through 7=Sunday. Schema migration needed.
- **Same meal type duplicates per day**: Grouped into one card in the UI (items from all matching `dietPlanMeals` rows are combined)
- **Default plan selection on load**: Auto-select the active plan; if none exists, select none
- **Copy Day**: Implemented. Dropdown shows only days that already have meals. Copies all meals + items to the selected day.
- **Macro targets**: All four (calories, protein, carbs, fat) are required. Default values pre-filled from the user's active `nutritionGoals` record (`targetCalories`, `targetProtein`, `targetCarbs`, `targetFat`)

---

## Schema Migration Required

**Change**: `dayOfWeek integer` → `dayOfWeek integer NOT NULL` in `diet_plan_meals`.

Files to modify:
1. `src/server/db/schema.ts` line 447: `dayOfWeek: integer('day_of_week'),` → `dayOfWeek: integer('day_of_week').notNull(),`
2. Run `npm run db:generate` to generate the migration SQL
3. Run `npm run db:migrate` to apply it

---

## Files to Create

### API Routes

| File | Purpose |
|---|---|
| `src/app/api/diet-plans/route.ts` | GET (list plans + computed avgDailyCalories + completeness), POST (create plan; archive active if needed) |
| `src/app/api/diet-plans/[dietPlanId]/route.ts` | PATCH (update plan; archive active if switching to active), DELETE |
| `src/app/api/diet-plans/[dietPlanId]/meals/route.ts` | GET (all meals with items + computed macros), POST (create meal slot) |
| `src/app/api/diet-plans/[dietPlanId]/meals/[mealId]/route.ts` | PATCH (mealType/dayOfWeek), DELETE |
| `src/app/api/diet-plans/[dietPlanId]/meals/[mealId]/items/route.ts` | POST (add food item) |
| `src/app/api/diet-plans/[dietPlanId]/meals/[mealId]/items/[itemId]/route.ts` | PATCH (quantity/altMeasureId), DELETE |
| `src/app/api/diet-plans/[dietPlanId]/copy-day/route.ts` | POST (copy all meals+items from one day to another; body: `{ fromDay, toDay }`) |

### Server Service

`src/server/services/diet-plan.service.ts`
- `getDietPlansForUser(userId)` → plans with `avgDailyCalories` (sum all item calories / 7) and `completeness` (% of 7 days × distinct mealTypes that have ≥1 item)
- `getMealsForPlan(dietPlanId, userId)` → all meals + items with computed macros (`nutrient = food.nutrient / 100 * quantity_grams`), joined with `foodPhotos` for thumbnails and `foodAltMeasures` for measure labels
- `archiveActivePlans(userId, db)` → `UPDATE diet_plans SET status='archived' WHERE client_id=$userId AND status='active'`
- `copyDay(dietPlanId, fromDay, toDay, userId, db)` → delete existing meals on toDay, duplicate all meals+items from fromDay to toDay
- `getUserNutritionGoalDefaults(userId)` → query latest active `nutritionGoals` record, return `{ targetCalories, targetProtein, targetCarbs, targetFat }` or nulls
- `calculateItemMacros(food, quantityGrams)` → pure helper

### Query Hooks

`src/queries/diet-plans.ts`
```typescript
export const dietPlanKeys = {
  all: ['diet-plans'] as const,
  meals: (planId: string) => ['diet-plans', planId, 'meals'] as const,
}
// Queries:
//   useDietPlansQuery()
//   useDietPlanMealsQuery(planId: string | null)  — enabled only when planId is non-null
// Mutations:
//   useCreateDietPlanMutation   → onSuccess: invalidate all
//   useUpdateDietPlanMutation   → onSuccess: invalidate all
//   useDeleteDietPlanMutation   → onSuccess: invalidate all
//   useCreateMealMutation       → onSuccess: invalidate all + meals(planId)
//   useUpdateMealMutation       → onSuccess: invalidate meals(planId)
//   useDeleteMealMutation       → onSuccess: invalidate all + meals(planId)
//   useAddMealItemMutation      → onSuccess: invalidate all + meals(planId)
//   useUpdateMealItemMutation   → onSuccess: invalidate meals(planId)
//   useDeleteMealItemMutation   → onSuccess: invalidate all + meals(planId)
//   useCopyDayMutation          → onSuccess: invalidate all + meals(planId)
```

Note: mutations that change item counts invalidate `dietPlanKeys.all` too because `completeness` and `avgDailyCalories` on plan cards must update.

### Shared Hook

`src/hooks/use-activate-plan.ts`
- Encapsulates: check `useDietPlansQuery` data for an existing active plan → surface conflict via AlertDialog → on confirm call `archiveActivePlans` mutation → proceed with create/update
- Used by both `NewPlanModal` and `PlanCard` status dropdown to avoid duplicating this logic

### Zod Schemas

**`src/lib/form-validation.ts`** — add:
```typescript
export const dietPlanFormSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(255),
  description: z.string().optional(),
  targetCalories: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number({ required_error: 'Calories are required' }).positive()
  ),
  targetProtein: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number({ required_error: 'Protein is required' }).positive()
  ),
  targetCarbs: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number({ required_error: 'Carbs are required' }).positive()
  ),
  targetFat: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number({ required_error: 'Fat is required' }).positive()
  ),
  startDate: z.coerce.date({ required_error: 'Start date is required' }),
  endDate: z.coerce.date().optional(),
  status: z.enum(['active', 'draft', 'archived']),
})
export type DietPlanFormData = z.infer<typeof dietPlanFormSchema>
```

**`src/lib/api-validation.ts`** — add API-level schemas for all request bodies (mirrors of form schemas, for use in route handlers).

### Page and Client Components

`src/app/(dashboard)/meal-planner/page.tsx` — **replace entirely**
- Server component. Reads `searchParams` → passes `initialPlanId`, `initialDay` to client component.
- Renders `<MealPlannerClient initialPlanId={...} initialDay={...} />`

**New directory: `src/components/meal-planner/`**

| File | Responsibility |
|---|---|
| `meal-planner-client.tsx` | Root `'use client'` component. Owns all modal state. URL param handling. Auto-selects active plan on first load. |
| `plan-carousel.tsx` | Scrollable horizontal row. "Add New Plan" card first. Overflow-only arrows + dots. |
| `plan-card.tsx` | Name, status `DropdownMenu` (calls `useActivatePlan` hook + `useUpdateDietPlanMutation`), target calories, avg daily calories, macro target row, completeness progress bar. Green ring when selected. |
| `day-selector.tsx` | 7 flex blocks Mon–Sun. Calorie total + % of plan target. Three macro color bars (protein/carbs/fat) as % of target. Selected day highlighted. `flex flex-wrap justify-between`. |
| `day-meals-view.tsx` | All meal cards for the selected day. "Copy Day" button (shown if any other day has meals) + "Add meal" button. |
| `copy-day-popover.tsx` | Popover with a dropdown listing days that have meals. On select → `useCopyDayMutation`. |
| `meal-card.tsx` | Header: `MealTypeLabel` badge + total kcal. Body: `MealItemRow` list. Footer: calorie + macro summary. Click header/body → edit modal. |
| `meal-item-row.tsx` | Display only: thumb (or fallback icon), food name, serving description (e.g. "1 cup · 240g"), calorie, protein/carbs/fat pills. |
| `new-plan-modal.tsx` | shadcn `Dialog` + TanStack Form with `dietPlanFormSchema`. Defaults pre-filled from `nutritionGoals`. Uses `useActivatePlan` hook for conflict flow. |
| `meal-modal.tsx` | shadcn `Dialog`. Create or edit mode. `FoodSearchField` + `MealItemEditor` list + totals footer. |
| `meal-item-editor.tsx` | Editable item row in `MealModal`: thumb, name/brand, `QuantityUnitInput`, live macro badges, X button. |

---

## Files to Modify

| File | Change |
|---|---|
| `src/server/db/schema.ts` | `dayOfWeek: integer('day_of_week'),` → add `.notNull()` |
| `src/lib/form-validation.ts` | Add `dietPlanFormSchema`, `DietPlanFormData` |
| `src/lib/api-validation.ts` | Add diet plan API request body schemas |
| `src/app/(dashboard)/meal-planner/create/page.tsx` | Change to redirect → `/meal-planner` |

---

## Key Data Shapes

### GET /api/diet-plans
```typescript
{
  plans: Array<{
    id: string
    name: string
    description: string | null
    status: 'active' | 'draft' | 'archived'
    targetCalories: number | null
    targetProtein: number | null
    targetCarbs: number | null
    targetFat: number | null
    startDate: string        // ISO
    endDate: string | null
    avgDailyCalories: number // sum(all item calories) / 7
    completeness: number     // 0–100: distinct (dayOfWeek, mealType) combos with ≥1 item / 7
  }>
  nutritionGoalDefaults: {
    targetCalories: number | null
    targetProtein: number | null
    targetCarbs: number | null
    targetFat: number | null
  }
}
```
> `nutritionGoalDefaults` is included so the new plan modal can pre-fill fields without an extra fetch.

### GET /api/diet-plans/[id]/meals
```typescript
{
  meals: Array<{
    id: string
    dietPlanId: string
    mealType: MealType
    dayOfWeek: number         // 1–7
    items: Array<{
      id: string
      foodId: string
      foodName: string
      brandName: string | null
      thumbnail: string | null
      altMeasureId: string | null
      altMeasureLabel: string | null  // e.g. "1 cup (240g)"
      quantity: number                // stored grams
      calories: number                // computed
      protein: number
      carbs: number
      fat: number
    }>
    totalCalories: number
    totalProtein: number
    totalCarbs: number
    totalFat: number
  }>
}
```

### POST /api/diet-plans/[id]/copy-day
```typescript
// Request
{ fromDay: number, toDay: number }  // 1–7
// Response
{ meals: DietPlanMealDTO[] }        // newly created meals for toDay
```

---

## Component State Architecture

```
page.tsx (Server Component — reads searchParams, no data fetching)
  └─ MealPlannerClient ('use client')
       ├─ URL state (useSearchParams + router.replace): selectedPlanId, selectedDay
       ├─ useState: newPlanModalOpen, mealModalState (null | CreateConfig | EditConfig)
       │
       ├─ useDietPlansQuery()          ← feeds PlanCarousel + NewPlanModal defaults
       ├─ useDietPlanMealsQuery(id)    ← feeds DaySelector + DayMealsView
       │
       ├─ PlanCarousel
       │    ├─ AddNewPlanCard (calls onAddNew → sets newPlanModalOpen=true)
       │    └─ PlanCard × N
       │         └─ status DropdownMenu → useActivatePlan hook → useUpdateDietPlanMutation
       │
       ├─ DaySelector (display only, calls router.replace on day click)
       │
       ├─ DayMealsView
       │    ├─ CopyDayPopover → useCopyDayMutation
       │    ├─ "+ Add Meal" button → sets mealModalState={mode:'create', day, mealType}
       │    └─ MealCard × N (grouped by mealType)
       │         ├─ click header/body → sets mealModalState={mode:'edit', mealId, ...}
       │         └─ MealItemRow × N (display only)
       │
       ├─ NewPlanModal (Dialog, controlled by newPlanModalOpen)
       │    ├─ TanStack Form + dietPlanFormSchema
       │    ├─ defaults from useDietPlansQuery().data.nutritionGoalDefaults
       │    ├─ useActivatePlan hook → conflict AlertDialog
       │    └─ useCreateDietPlanMutation → onSuccess: close modal, set planId in URL
       │
       └─ MealModal (Dialog, controlled by mealModalState !== null)
            ├─ internal: items[], pendingFood, mealType (useState)
            ├─ FoodSearchField (reuse existing) + useFoodSearch hook
            ├─ useFoodDetailQuery(pendingFood) → hydrates pending item
            └─ MealItemEditor × N → QuantityUnitInput (reuse existing)
```

---

## Active Plan Conflict Flow (`useActivatePlan` hook)

```
Trigger: user sets status → 'active' (new plan OR status dropdown on existing card)
  1. Check plans data for any plan where status === 'active' AND id !== currentPlanId
  2. If found:
       → set conflictPlan state → AlertDialog renders:
         "Activating this plan will archive '[conflictPlan.name]'. Continue?"
         [Cancel] [Archive and Activate]
       → on confirm: call archiveActivePlans mutation, then proceed with create/update
  3. If not found: proceed directly with create/update
  4. If DB constraint fires anyway (409): surface toast error to user
```

---

## Copy Day Flow

- "Copy Day" button appears in `DayMealsView` only when at least one *other* day has meals
- Clicking opens `CopyDayPopover`: dropdown lists days 1–7 that have meals (excluding the currently selected day), formatted as "Monday", "Tuesday", etc.
- On select: `useCopyDayMutation({ planId, fromDay: selectedDay, toDay: currentDay })`
- Server: delete all existing `dietPlanMeals` for toDay in this plan, then duplicate all meals+items from fromDay (insert new rows with new IDs)
- On success: invalidate `dietPlanKeys.meals(planId)` and `dietPlanKeys.all`

---

## Meal Modal Save Flow

**Create mode**:
1. POST `/api/diet-plans/[id]/meals` `{ mealType, dayOfWeek }` → get `mealId`
2. POST `.../meals/[mealId]/items` for each item in parallel
3. On success: invalidate, close modal

**Edit mode**:
1. Diff `currentItems[]` vs `originalItems[]` (compare by `id`)
2. New items (no id) → POST items
3. Changed items (id exists, quantity or altMeasureId differs) → PATCH items
4. Removed items → DELETE items
5. If `mealType` changed → PATCH meal row
6. All in parallel; on all settled: invalidate, close modal

---

## Nutrition Defaults in New Plan Modal

On modal open, read `data.nutritionGoalDefaults` from the already-loaded `useDietPlansQuery()` response (no extra fetch). Pre-fill the four macro fields. User can override any value before saving.

---

## Nutrition Calculation

```typescript
// Per item (live in MealModal, also computed server-side for GET responses)
const quantityGrams = altMeasure
  ? quantity * altMeasure.servingWeight  // altMeasure.qty is always 1 unit
  : quantity                             // raw grams
const calories = (food.calories / 100) * quantityGrams
const protein  = (food.protein  / 100) * quantityGrams
// etc.
```

---

## Implementation Order

1. **Schema migration** — make `dayOfWeek` NOT NULL in schema.ts, generate + apply migration
2. **Zod schemas** — `dietPlanFormSchema` in `form-validation.ts`, API schemas in `api-validation.ts`
3. **Service** — `diet-plan.service.ts` with all helpers
4. **API routes** — all 7 route files (including copy-day), test manually
5. **Query hooks** — `src/queries/diet-plans.ts` + `useActivatePlan` hook
6. **Page shell** — replace `meal-planner/page.tsx`, `MealPlannerClient` with loading/empty states, auto-select active plan
7. **Carousel** — `PlanCarousel` + `PlanCard` + status dropdown conflict flow
8. **Day selector** — `DaySelector` with macro bars
9. **Meal display** — `DayMealsView` + `MealCard` + `MealItemRow` (read-only)
10. **Copy Day** — `CopyDayPopover` + `useCopyDayMutation`
11. **New Plan Modal** — TanStack Form, date pickers, defaults from nutritionGoals, conflict AlertDialog
12. **Meal Modal create mode** — FoodSearchField → item list → save
13. **Meal Modal edit mode** — pre-populate + diff-based save
14. **Polish** — carousel arrows/dots overflow visibility, completeness bar, per-day empty states

---

## Verification Checklist

- [ ] No existing plans → empty state shown, "Add New Plan" card is the only carousel item
- [ ] Create plan (draft) → appears in carousel, not auto-selected
- [ ] Create plan (active) with existing active plan → AlertDialog shown → first plan archived → new plan auto-selected in carousel
- [ ] Change existing plan status via dropdown → same conflict flow applies
- [ ] Select a plan → day selector shows 7 days with correct calorie/macro data
- [ ] Click a day → meals for that day load below
- [ ] Add meal → select food from search → quantity/measure input → macros recalculate live
- [ ] Save meal → day card updates with new calorie/macro data, completeness bar updates on plan card
- [ ] Edit existing meal → modify quantity → save → values correct in day view
- [ ] Copy Day → meals duplicated to selected day, previous day meals unchanged
- [ ] Delete plan → carousel updates, next plan selected or empty state shown
- [ ] `npm test && npm run lint` pass
