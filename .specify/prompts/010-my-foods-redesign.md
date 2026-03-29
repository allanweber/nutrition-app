# Plan: My Foods Page Redesign

## Context
Redesign the `/my-foods` page to match the `docs/design/custom_foods_list.html` design. The current page uses a simple card list; the new design uses a data table with macro-colored cells and progress bars. A generic, reusable table component is required to serve both the "Custom Foods" and "Custom Dishes" tabs.

---

## Files to Create
- `src/components/nutrition-items-table.tsx` — generic table component (new)

## Files to Modify
- `src/app/(dashboard)/my-foods/page.tsx` — full redesign using new table
- `src/lib/nutrition-constants.ts` — add `MACRO_CELL_BG` light-tint constants

---

## 1. `nutrition-constants.ts` — Add cell background constants

Add two new export constants for the macro-colored table cells:
```ts
export const MACRO_CELL_BG = {
  protein: 'bg-[#FFEBEC]',
  carbs:   'bg-[#FEF6D4]',
  fat:     'bg-[#DFF2FE]',
} as const;

export const MACRO_CELL_TEXT = {
  protein: 'text-[#D54069]',
  carbs:   'text-[#CC7A40]',
  fat:     'text-[#408FBE]',
} as const;

export const MACRO_CELL_FILL = {
  protein: 'bg-[#D54069]',
  carbs:   'bg-[#CC7A40]',
  fat:     'bg-[#408FBE]',
} as const;
```

---

## 2. `NutritionItemsTable` component

### Generic config pattern (TypeScript)

```ts
interface MacroColConfig<T> {
  label: string;        // e.g. 'Protein'
  unit: string;         // e.g. '/100g'
  getValue: (item: T) => number;
  getBarWidth: (item: T) => number; // returns 0–100
  bg: string;           // cell bg class e.g. 'bg-[#FFEBEC]'
  text: string;         // value text class
  fill: string;         // progress fill class
}

interface TableConfig<T> {
  getId: (item: T) => string;
  getItemName: (item: T) => string;
  getItemSubtitle: (item: T) => string | null;
  getThumbnail: (item: T) => string | null;
  getEnergy: (item: T) => number;
  macros: [MacroColConfig<T>, MacroColConfig<T>, MacroColConfig<T>];
  extraCol: { label: string; getValue: (item: T) => string };
  getEditHref: (item: T) => string;
  onDelete: (id: string) => void;
}
```

### Component props
```ts
interface NutritionItemsTableProps<T> {
  items: T[];
  config: TableConfig<T>;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  searchPlaceholder?: string;
}
```

### Internal behavior
- **Text filter**: client-side `includes` search on `getItemName` (case-insensitive)
- **Pagination**: client-side, `pageSize` state defaults to 10; rows per page selector [10, 25, 50]; page resets to 1 on filter change
- **Loading**: centered `<Loader2>` spinner
- **Empty state**: `<UtensilsCrossed>` icon (always) + `emptyTitle` + `emptyDescription`
- **Inline delete confirm**: same inline confirm/cancel pattern as current page
- **Thumbnail**: `<Image>` if present, else `<UtensilsCrossed>` icon in `bg-surface-container` square
- **Progress bar**: `<div>` with colored fill, width set via inline style `width: ${pct}%`

### Table structure (per design)
```
Header: Item Name | Energy (kcal) | Protein /100g | Carbs /100g | Fats /100g | <extraCol> | Actions
Row:    [img/icon + name + subtitle] | [mono right] | [pink bg + value + bar] | [amber bg] | [sky bg] | text | [edit+delete]
Footer: Rows per page select + "Showing X–Y of Z entries" + prev/page btns/next
```

### Header / top controls (rendered above the table card)
- Search input with `<Search>` icon, right-aligned flex row
- "X Items View" badge with green dot (shows filtered count)
- Both on the same row as the tab toggle

---

## 3. `my-foods/page.tsx` redesign

### Header section
- Left border accent (`border-l-4 border-primary pl-6`)
- "SYSTEM ANALYTICS" overline label (uppercase, `text-primary`)
- H1 "Custom Foods and Dishes"
- Subtitle text
- "Add Entry" button top-right — label changes per tab:
  - Foods tab → Link to `/my-foods/create`, label "Add Food"
  - Dishes tab → Link to `/my-foods/dishes/create`, label "Add Dish"

### Tab toggle
- Same segmented control style as current page
- "Custom Foods" + "Dishes" tabs (keep existing `data-testid` attributes)

### Foods tab config
```ts
const foodsConfig: TableConfig<CustomFood> = {
  getId: (f) => f.id,
  getItemName: (f) => f.name,
  getItemSubtitle: (f) => f.brandName,
  getThumbnail: (f) => f.thumbnail,
  getEnergy: (f) => f.calories,
  macros: [
    { label: 'Protein', unit: '/100g', getValue: (f) => f.protein,
      getBarWidth: (f) => Math.min((f.protein / 50) * 100, 100),
      bg: MACRO_CELL_BG.protein, text: MACRO_CELL_TEXT.protein, fill: MACRO_CELL_FILL.protein },
    { label: 'Carbs',   unit: '/100g', getValue: (f) => f.carbs,
      getBarWidth: (f) => Math.min(f.carbs, 100),
      bg: MACRO_CELL_BG.carbs, text: MACRO_CELL_TEXT.carbs, fill: MACRO_CELL_FILL.carbs },
    { label: 'Fats',    unit: '/100g', getValue: (f) => f.fat,
      getBarWidth: (f) => Math.min(f.fat, 100),
      bg: MACRO_CELL_BG.fat, text: MACRO_CELL_TEXT.fat, fill: MACRO_CELL_FILL.fat },
  ],
  extraCol: { label: 'Fiber', getValue: (f) => `${f.fiber ?? 0}g` },
  getEditHref: (f) => `/my-foods/${f.id}/edit`,
  onDelete: (id) => deleteFood.mutate(id),
};
```

### Dishes tab config
```ts
const dishesConfig: TableConfig<DishListItem> = {
  getId: (d) => d.id,
  getItemName: (d) => d.name,
  getItemSubtitle: (d) => d.description,
  getThumbnail: (d) => d.thumbnail,
  getEnergy: (d) => d.totalCalories,
  macros: [
    { label: 'Protein', unit: 'total', getValue: (d) => d.totalProtein,
      getBarWidth: (d) => { const t = d.totalProtein + d.totalCarbs + d.totalFat; return t > 0 ? Math.min((d.totalProtein / t) * 100, 100) : 0; },
      ... },
    { label: 'Carbs', unit: 'total', getValue: (d) => d.totalCarbs, ... },
    { label: 'Fats',  unit: 'total', getValue: (d) => d.totalFat, ... },
  ],
  extraCol: { label: 'Ingredients', getValue: (d) => `${d.ingredientCount}` },
  getEditHref: (d) => `/my-foods/dishes/${d.id}/edit`,
  onDelete: (id) => deleteDish.mutate(id),
};
```

### Types used
- `CustomFood` — already defined locally in page.tsx (keep as-is, also add `fiber` field which the API already returns)
- `DishListItem` — import from `@/types/dish`

---

## 4. Macro bar width logic
- **Foods protein**: `min((value / 50) * 100, 100)` — 50g is practical max per 100g
- **Foods carbs/fat**: `min(value, 100)` — values are already 0–100 per 100g
- **Dishes**: bar = macro % of total macros (protein+carbs+fat), so bar visually shows macro composition

---

## 5. Pagination logic (client-side)
```
filteredItems = items.filter(name includes search)
totalPages = ceil(filteredItems.length / pageSize)
pageItems = filteredItems.slice((page-1)*pageSize, page*pageSize)

Page buttons: show first 3, ellipsis, last if totalPages > 5
```

---

## Verification
1. Run dev server; navigate to `/my-foods`
2. Verify both tabs render the table with correct columns
3. Type in search filter → table filters rows, page resets to 1
4. Change rows per page → table updates
5. Pagination controls work correctly
6. Edit button navigates to correct edit pages
7. Delete shows inline confirm → on confirm, row removed
8. Empty state shows UtensilsCrossed icon
9. "Add Entry" button label changes per tab
10. `npm test && npm run lint` passes
