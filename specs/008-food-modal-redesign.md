# Plan: Food Modal Redesign

## Context
Replace two separate modals (`FoodLogAddModal` + `FoodLogAddForm`, `DishLogModal`) and the inline ingredient-add in `CustomDishForm` with a unified `FoodModal` component matching the design in `docs/design/food_modal.html` / `food_modal.png`. Three reusable sub-components are extracted for the new form fields.

## User Decisions
- Dish quantity: discrete slider steps (¼, ½, 1, 1½, 2, 3)
- Ingredient add in CustomDishForm: FoodModal opens (not inline)
- No-image fallback: green gradient header
- Default date: selected date from food log page (passed as prop)

---

## New Files to Create

### 1. `src/components/meal-type-select.tsx`
Controlled select using MEAL_TYPE_ORDER/LABELS from `nutrition-constants.ts`.
```tsx
interface MealTypeSelectProps {
  value: MealType;
  onChange: (value: MealType) => void;
  error?: string;
  id?: string;
}
```
Styled: label above (10px bold uppercase), shadcn `Select` full-width with design tokens.

---

### 2. `src/components/date-navigator.tsx`
Row: left-arrow button (−1 day) | center click area (calendar icon + "Oct 27") | right-arrow button (+1 day).
Center click opens shadcn `Popover` with `Calendar`. Uses `date-fns` (`format`, `addDays`, `subDays`).
```tsx
interface DateNavigatorProps {
  value: Date;
  onChange: (date: Date) => void;
}
```

---

### 3. `src/components/quantity-unit-input.tsx`
Top row: number `<input>` (flex-1, no spin buttons) + vertical divider + `Select` for measure (min-w-[70px]).
Below: `<input type="range">` — two-way bound to the number input.

When measure changes → quantity resets to `measure.defaultQty`, slider range updates.

```tsx
interface QuantityMeasure {
  id: string;
  label: string;
  defaultQty: number;
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  weightGrams: number; // grams per 1 unit (1 for base grams)
}
interface QuantityUnitInputProps {
  measures: QuantityMeasure[];
  selectedMeasureId: string;
  quantity: number;
  onMeasureChange: (id: string, newQty: number) => void;
  onQuantityChange: (qty: number) => void;
}
```

**Measure configs:**
- Base (100g): `{ id:'base', label:'g', defaultQty:100, sliderMin:10, sliderMax:500, sliderStep:5, weightGrams:1 }`
- AltMeasure: `{ id:s.id, label:s.description, defaultQty:1, sliderMin:0.25, sliderMax:10, sliderStep:0.25, weightGrams:s.weightGrams }`
- Dish serving: `{ id:'serving', label:'Serving', defaultQty:1, sliderMin:0.25, sliderMax:3, sliderStep:0.25, weightGrams:1 }` *(slider snaps to discrete values: 0.25, 0.5, 1, 1.5, 2, 3)*

---

### 4. `src/components/food-modal.tsx`
Unified modal with discriminated union `mode` prop. Uses `useState` internally (not TanStack Form — reactive macro display needs instant updates without form subscription overhead).

```tsx
type FoodModalMode =
  | { kind: 'log-food'; foodDetail: FoodDetailResponse; initialMealType?: MealType; initialDate?: Date; onAdded: () => void; }
  | { kind: 'log-dish'; dishId: string; dishTotals: { calories:number; protein:number; carbs:number; fat:number }; initialMealType?: MealType; initialDate?: Date; onLogged: () => void; }
  | { kind: 'ingredient'; foodDetail: FoodDetailResponse; onSelect: (data: { foodId:string; altMeasureId:string|null; quantityGrams:number }) => void; };

interface FoodModalProps {
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  name: string;
  subtitle?: string;      // brandName or description
  imageUrl?: string;      // null → green gradient fallback
  submitLabel?: string;   // override accept button label
  mode: FoodModalMode;
}
```

**Internal state:** `mealType`, `date`, `selectedMeasureId`, `quantity`, `isSubmitting`

**Macro calculation (useMemo):**
- log-food: `grams = (measureId==='base') ? qty : qty × measure.weightGrams`; `nutrient = (baseServing.nutrient / 100) × grams`
- log-dish: `nutrient = dishTotals.nutrient × qty`
- ingredient: same as log-food

**Layout** (matches design reference):
```
[image h-24 or green gradient]
  [gradient overlay → subtitle (9px) + title (lg extrabold white)]
  [close button absolute top-2 right-2 rounded-full bg-white/90]

[body flex-1 overflow-y-auto p-4 space-y-4]
  section "Quick Log" (hidden in ingredient mode):
    MealTypeSelect
    DateNavigator
  QuantityUnitInput

  section "Macros for current amount":
    [Calories box — primary color, large font]
    [3-col grid: Protein (rose-500), Carbs (amber-500), Fat (sky-500)]

[footer bg-surface-container-high border-t p-3 flex gap-2]
  [Cancel button]
  [Accept button flex-1 bg-primary — label from submitLabel prop]
```

**Submit logic per mode:**
- `log-food` → call `useCreateFoodLogMutation` with `{ foodId, altMeasureId, quantity (grams), mealType, consumedAt: date }`
- `log-dish` → call `useLogDishMutation` with `{ dishId, multiplier: qty, mealType, consumedAt: date.toISOString() }`
- `ingredient` → call `onSelect({ foodId, altMeasureId, quantityGrams })`

---

## data-testid Attributes (required for e2e)

Preserve existing IDs (used in current tests):
- `food-add-modal` — root modal element
- `meal-type-select` — MealTypeSelect trigger
- `quantity-input` — numeric input in QuantityUnitInput
- `add-food-button` — accept/submit button

New IDs to add:
- `date-navigator` — DateNavigator wrapper
- `date-nav-prev` — left arrow button
- `date-nav-next` — right arrow button
- `date-nav-display` — center clickable area (shows date)
- `quantity-slider` — range input
- `measure-select` — unit dropdown trigger
- `food-modal-cancel` — cancel button
- `macros-calories`, `macros-protein`, `macros-carbs`, `macros-fat` — macro value displays

---

## Files to Modify

### 5. `src/components/food-log-add-modal.tsx`
Rewrite as thin wrapper around `<FoodModal>`:
- Receives existing `FoodAddModalProps` (add optional `defaultDate?: Date`)
- Passes `mode={{ kind:'log-food', foodDetail, initialMealType, initialDate: defaultDate ?? new Date(), onAdded }}`
- Shows loading spinner in body when `isDetailLoading`

### 6. `src/components/dish-log-modal.tsx`
Rewrite as thin wrapper around `<FoodModal>`:
- Fetch dish detail internally (keep `useDishDetailQuery`)
- Pass `mode={{ kind:'log-dish', dishId, dishTotals: dish.totals, initialDate: defaultDate, onLogged }}`
- Pass `imageUrl={dish.photo?.highres ?? dish.photo?.thumb ?? undefined}`
- Replace string `consumedAt` prop with `defaultDate?: Date`

### 7. `src/components/forms/custom-dish-form.tsx`
- Add state: `ingredientModalFood: { detail: FoodDetailResponse; name: string; imageUrl?: string } | null`
- Add state: `ingredientModalOpen: boolean`
- When food selected from `FoodSearchField`:
  1. Fetch `FoodDetailResponse` via `useFoodDetailQuery`
  2. Open `FoodModal` in `ingredient` mode
- On `onSelect({ foodId, altMeasureId, quantityGrams })` → add to ingredients list with `quantityGrams`
- Render `<FoodModal>` in ingredient mode (no meal type / date shown)

### 8. `src/app/(dashboard)/food-log/food-log-content.tsx`
- Pass `defaultDate={selectedDate}` (the active date from the calendar strip) to `FoodLogAddModal`
- Pass `defaultDate={selectedDate}` to `DishLogModal`

### 9. `src/components/food-search-field/types.ts`
- Add `defaultDate?: Date` to `FoodAddModalProps`

---

## Key Constraints
- Macro colors always from `MACRO_TEXT_COLORS` / `MACRO_HEX_COLORS` in `nutrition-constants.ts`
- Design tokens from `globals.css` (OKLch vars): `surface-container-high`, `outline-variant`, `primary`, etc.
- Spinner during `isDetailLoading` (body area, not blocking header)
- Escape key + backdrop click → close modal
- Body scroll lock when open

---

## E2E Tests

### New spec: `e2e/008-food-modal-redesign.spec.ts`
Test suite covering all three modal modes:

**Food modal (log-food)**
- Modal opens with image header, title, subtitle, close button visible
- Close button dismisses modal; Escape key dismisses modal
- MealTypeSelect: options Breakfast/Lunch/Dinner/Snack selectable
- DateNavigator: prev arrow decrements date; next arrow increments date; clicking center opens calendar popover; picking a date updates display
- QuantityUnitInput: typing in number input updates slider position; dragging slider updates number input (two-way binding)
- Changing measure unit resets quantity to measure's default and updates slider range
- MacrosSummary: displayed values update when quantity changes (calories, protein, carbs, fat)
- Submitting logs to the date/meal type shown in the form (not always today)

**Dish modal (log-dish)**
- Opens with dish name and meal type controls
- QuantityUnitInput shows "Serving" as sole unit option
- Slider snaps to discrete values: 0.25, 0.5, 1, 1.5, 2, 3
- Macros scale proportionally with quantity

**Ingredient modal (ingredient)**
- No meal type field visible
- No date field visible
- Submit calls `onSelect` with correct grams (altMeasure qty × weightGrams)

### Update: `e2e/pages/food-log.page.ts`
Add locators for new modal UI:
```ts
readonly dateNavigator: Locator;       // data-testid="date-navigator"
readonly dateNavPrev: Locator;         // data-testid="date-nav-prev"
readonly dateNavNext: Locator;         // data-testid="date-nav-next"
readonly dateNavDisplay: Locator;      // data-testid="date-nav-display"
readonly quantitySlider: Locator;      // data-testid="quantity-slider"
readonly measureSelect: Locator;       // data-testid="measure-select"
readonly macrCalories: Locator;        // data-testid="macros-calories"
readonly macroProtein: Locator;        // data-testid="macros-protein"
readonly macroCarbs: Locator;          // data-testid="macros-carbs"
readonly macroFat: Locator;            // data-testid="macros-fat"
readonly cancelButton: Locator;        // data-testid="food-modal-cancel"
```
Add helper methods: `setMeasure(label)`, `navigateModalDate(direction: 'prev'|'next')`, `getMacroCalories()`.

### Keep passing: existing 006 tests
The 006 spec uses `food-add-modal`, `quantity-input`, `meal-type-select`, `add-food-button` test IDs — all preserved in the new implementation.

---

## Documentation

### Update: `CLAUDE.md`
Add under **Component System** section:
- `MealTypeSelect` — `src/components/meal-type-select.tsx`, controlled select for meal types, accepts `value/onChange/error/id`
- `DateNavigator` — `src/components/date-navigator.tsx`, date picker row with prev/next arrows + calendar popover, accepts `value/onChange`
- `QuantityUnitInput` — `src/components/quantity-unit-input.tsx`, combined numeric input + unit dropdown + slider, accepts `measures[]`, `selectedMeasureId`, `quantity`, `onMeasureChange`, `onQuantityChange`
- `FoodModal` — `src/components/food-modal.tsx`, unified modal for log-food / log-dish / ingredient modes; controlled by `open`, `mode` discriminated union, `onClose`

---

## Verification
1. **Food log**: Search food → select → FoodModal opens with image header, meal type pre-set to active date's strip date, quantity=100g slider works, macros update live, submit logs to correct date/meal
2. **Dish log**: Select dish → FoodModal opens with dish photo, discrete slider snaps to ¼/½/1/1½/2/3, macros scale correctly, submit logs dish
3. **Custom dish**: Search food in dish form → FoodModal opens in ingredient mode (no meal type/date), set quantity, confirm → ingredient added with correct grams
4. **No image**: Custom food with no photo → green gradient header, text still readable
5. **Date navigation**: Arrows ±1 day, center opens calendar picker
