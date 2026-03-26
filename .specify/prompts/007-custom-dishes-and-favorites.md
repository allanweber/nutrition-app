# Plan: Custom Dishes + Favorites

## Context

Users need to define multi-ingredient dishes (recipes) they can quickly log as a unit, and a favorites system for any food or dish they want quick access to. The Nutrition Pulse sidebar's "Quick Add Recent Foods" section will be replaced with a favorites-driven section. The My Foods page will be fully built out with CRUD for both custom foods and dishes.

User answers:
- Dish items in food log: **grouped** under a "From: [Dish Name]" header, with optional individual deletion
- Dish logging: **servings multiplier** (0.25×, 0.5×, 1×, 1.5×, 2×, 3×) scaling all ingredients proportionally
- Custom tab search: **mixed** foods and dishes with 'Food'/'Dish' labels
- Favorites scope: **any food** (common, branded, custom) or dish

---

## 1. Database Schema (`src/server/db/schema.ts`)

### New Tables

**`customDishes`**
```
id uuid PK, userId text FK→users cascade, name varchar(500), description text, createdAt, updatedAt
indexes: userId, name
```

**`customDishIngredients`**
```
id uuid PK, dishId uuid FK→customDishes cascade, foodId uuid FK→foods cascade,
altMeasureId uuid FK→foodAltMeasures set-null, quantity decimal(10,2) (grams), seq int, createdAt
indexes: dishId, foodId
```

**`favorites`**
```
id uuid PK, userId text FK→users cascade, foodId uuid FK→foods cascade nullable,
dishId uuid FK→customDishes cascade nullable, createdAt
unique(userId, foodId), unique(userId, dishId)
```
Enforce "exactly one of foodId/dishId" in the API layer (not DB-level check constraint — Drizzle limitation).

### Modified Tables

**`foodLogItems`** — add two columns:
- `dishLogGroupId uuid` (nullable, no FK — just a correlator UUID generated at log time, shared across all items from a single dish log event)
- `dishNameSnapshot varchar(500)` (nullable — dish name captured at log time, survives dish deletion)
- Add index on `dishLogGroupId`

### Relations to add
Add relations for `customDishes`, `customDishIngredients`, `favorites` (connect to users, foods, altMeasures).

### Seed data (`src/server/db/seed.ts`)
After existing food inserts, add for `weightLoss` test user:
- 2 dishes: "High-Protein Breakfast Bowl" (eggs 150g + Greek yogurt 100g + almonds 15g), "Post-Workout Plate" (chicken 200g + brown rice 150g + salad 100g)
- 4 favorites: 2 food favorites (Apple, Chicken Breast), 1 dish favorite (High-Protein Breakfast Bowl), 1 more food (Banana)

---

## 2. API Routes

### Dishes CRUD
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dishes` | List user's dishes with aggregate nutrition |
| POST | `/api/dishes` | Create dish + ingredients in transaction |
| GET | `/api/dishes/[dishId]` | Full dish detail with per-ingredient nutrition |
| PATCH | `/api/dishes/[dishId]` | Update name/description + replace ingredients |
| DELETE | `/api/dishes/[dishId]` | Delete dish (cascades to ingredients) |
| GET | `/api/dishes/search?q=` | Search user's dishes (min 3 chars), returns `itemKind: 'dish'` |

### Custom Foods CRUD (new endpoints)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/foods/custom` | List user's custom foods |
| POST | `/api/foods/custom` | Create custom food (`source: 'user_custom'`, `userId: session.user.id`) |
| PATCH | `/api/foods/custom/[foodId]` | Update custom food (ownership check) |
| DELETE | `/api/foods/custom/[foodId]` | Delete custom food (ownership check) |

Update `GET /api/foods/custom/search` to also query dishes and return mixed results with `itemKind: 'food' | 'dish'`.

### Dish Logging
**`POST /api/food-logs/dish`**
- Input: `{ dishId, multiplier, mealType, consumedAt? }`
- In a DB transaction: fetch dish+ingredients, generate one `dishLogGroupId` (uuidv7), find/create `foodLogMeals`, insert N `foodLogItems` with `quantity = ingredient.quantity * multiplier`, `dishLogGroupId`, `dishNameSnapshot`
- Output: `{ success, dishLogGroupId, itemCount }`

**`DELETE /api/food-logs/dish-group/[dishLogGroupId]`**
- Delete all `foodLogItems` WHERE `dishLogGroupId = :id` (verify ownership via join to `foodLogMeals.userId`)
- Clean up orphan meals (same logic as single-item delete)

Update `GET /api/food-logs` to include `dishLogGroupId` and `dishNameSnapshot` in each item.

### Favorites CRUD
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/favorites` | All user favorites with food/dish details |
| GET | `/api/favorites/top` | Top 6 favorites (for NutritionPulse sidebar) |
| GET | `/api/favorites/ids` | Just `{ foodIds, dishIds }` for toggle state in search |
| POST | `/api/favorites` | Add favorite `{ foodId? } \| { dishId? }` — upsert-safe (200 if exists) |
| DELETE | `/api/favorites/[favoriteId]` | Remove favorite (ownership check) |

---

## 3. New Types

### `src/types/dish.ts` (new file)
```ts
DishIngredient: { id, foodId, foodName, altMeasureId, altMeasureDescription, quantity, calories, protein, carbs, fat }
DishDetail: { id, name, description, ingredients: DishIngredient[], totals }
DishListItem: { id, name, description, ingredientCount, totalCalories, totalProtein, totalCarbs, totalFat, createdAt }
```

### `src/types/favorites.ts` (new file)
```ts
FavoriteItem: { id, type: 'food'|'dish', itemId, name, calories, thumbnail, createdAt }
```

### Extend `src/types/food.ts`
- `FoodLogEntry`: add `dishLogGroupId?: string | null`, `dishNameSnapshot?: string | null`
- Add `FoodLogEntryDishGroup: { dishLogGroupId, dishNameSnapshot, items: FoodLogEntry[], totalCalories }`

### Extend `UnifiedFoodSearchResultItem` (food-search-field types)
- Add `itemKind: 'food' | 'dish'`
- Add `dishId?: string` (for dish items)
- Add `isFavorite?: boolean`

---

## 4. New Query Hooks

### `src/queries/dishes.ts` (new)
`useDishesQuery`, `useDishDetailQuery`, `useCreateDishMutation`, `useUpdateDishMutation`, `useDeleteDishMutation`, `useLogDishMutation`, `useDeleteDishGroupMutation`

### `src/queries/favorites.ts` (new)
`useFavoritesQuery`, `useFavoritesTopQuery`, `useFavoriteIdsQuery` (lightweight, for toggle state), `useToggleFavoriteMutation` (optimistic update), `useDeleteFavoriteMutation`

---

## 5. Frontend Components

### New Components

**`src/components/dish-log-modal.tsx`**
- Triggered when user selects a search result with `itemKind: 'dish'`
- Shows dish name, description, ingredient list with calorie breakdown
- Live-updating nutrition totals as multiplier changes (pure client math: `sum(ingredient.calories * multiplier)`)
- Multiplier select: 0.25×, 0.5×, 1×, 1.5×, 2×, 3×
- Meal type select + "Add to Log" button → calls `useLogDishMutation`

**`src/components/favorites-modal.tsx`**
- Full list of user's favorites from `useFavoritesQuery`
- Each row: name, calorie, type badge ('Food'/'Dish'), remove button

**`src/components/favorite-toggle-button.tsx`**
- Small star/heart icon button
- Receives `foodId` or `dishId` + `isFavorite` state from `useFavoriteIdsQuery`
- Calls `useToggleFavoriteMutation` with optimistic update

### Modified Components

**`src/components/food-search-field/result-item.tsx`**
- Add `itemKind` badge ('Dish' label when `itemKind === 'dish'`, replaces/joins existing 'Custom' badge)
- Add `<FavoriteToggleButton>` (appears on hover for desktop)

**`src/components/food-search-field/tabs.tsx`**
- Accept new prop `preferCustomTab: boolean`
- Auto-switch to Custom tab when `preferCustomTab` becomes true AND user hasn't manually switched tabs (track with `userHasManuallySelectedTab` ref)

**`src/hooks/use-food-search.ts`**
- Expose `hasCustomResults: boolean` derived from custom results count > 0
- Pass `preferCustomTab={hasCustomResults}` to the tabs component via `FoodSearchField`

**`src/components/food-log-client.tsx`**
- Add `onDeleteDishGroup: (dishLogGroupId: string) => Promise<void>` prop
- Group items by `dishLogGroupId` before rendering each meal section
- Render dish groups under a sub-header: "From: [dishNameSnapshot]" + total kcal + delete-group button
- Individual items within a group still have their own delete button

**`src/components/food-log/nutrition-pulse.tsx`**
- Remove `recentFoods: string[]` and `onQuickAdd` props
- Add `onAddFood: (item: FavoriteItem) => void` prop
- Replace "Quick Add Recent Foods" section with:
  - "Favorites" title
  - Top 6 favorites from `useFavoritesTopQuery` as pill buttons
  - "See all →" button opening `<FavoritesModal>`
- Clicking a food favorite → calls `onAddFood` (opens FoodLogAddModal with that food)
- Clicking a dish favorite → opens DishLogModal with that dish

**`src/app/(dashboard)/food-log/food-log-content.tsx`**
- Add `selectedDish` state + `dishModalOpen` state
- Add `onDeleteDishGroup` handler (calls `useDeleteDishGroupMutation`, invalidates food logs query)
- Wire `onAddFood` for NutritionPulse favorites → open appropriate modal (food detail or dish modal)
- Remove `recentFoods` extraction logic (replaced by favorites)

### New Pages

**`src/app/(dashboard)/my-foods/page.tsx`** — replace placeholder with tabbed layout
- Tabs: "Custom Foods" | "Dishes"
- Custom Foods tab: list from `GET /api/foods/custom`, create/edit/delete actions
- Dishes tab: list from `GET /api/dishes`, create/edit/delete actions

**`src/app/(dashboard)/my-foods/create/page.tsx`** — replace "coming soon" with real form
- TanStack Form with all nutrition fields (name, brand, serving, all macros per 100g)
- Submit → `POST /api/foods/custom`

**`src/app/(dashboard)/my-foods/[foodId]/edit/page.tsx`** (new)
- Pre-populate from `GET /api/foods/detail?id=[foodId]`
- Submit → `PATCH /api/foods/custom/[foodId]`

**`src/app/(dashboard)/my-foods/dishes/create/page.tsx`** (new)
- Name + description fields
- Ingredient rows: each row has food search picker, quantity input, unit selector
- Live nutrition totals update as ingredients are added
- Submit → `POST /api/dishes`

**`src/app/(dashboard)/my-foods/dishes/[dishId]/edit/page.tsx`** (new)
- Pre-populate from `GET /api/dishes/[dishId]`
- Submit → `PATCH /api/dishes/[dishId]`

---

## 6. E2E Tests

### `e2e/007-custom-dishes.spec.ts` (and `007-favorites.spec.ts`, `007-my-foods-full.spec.ts`)
- Create a dish with 2 ingredients via My Foods > Dishes tab, verify in list with calorie total
- Search for dish in food log → Custom tab auto-selected → 'Dish' label visible
- Open DishLogModal, change multiplier to 2×, verify totals double, add to log
- Verify "From: [Dish Name]" group header in food log with 2 items underneath
- Delete whole group via group header button, verify both items removed
- Delete one item within a group, verify sibling remains with group header

### `e2e/007-favorites.spec.ts`
- Toggle favorite on a search result, reload, verify star still filled
- Verify favorited food appears in NutritionPulse favorites section
- Open "See all" modal, verify all favorites listed, remove one, verify removed from pills
- Add a dish to favorites from My Foods Dishes tab, verify it appears in favorites section
- Click dish favorite pill → DishLogModal opens

### `e2e/007-my-foods-full.spec.ts`
- Create custom food via `/my-foods/create`, verify appears in Custom Foods tab
- Search for it in food log Custom tab, add to log, verify entry
- Edit custom food (change calorie value), verify updated value
- Delete custom food, verify disappears from list and search

---

## 7. Critical Files

| File | Change |
|------|--------|
| `src/server/db/schema.ts` | Add 3 tables, 2 columns to `foodLogItems` |
| `src/server/db/seed.ts` | Add dishes + favorites for test users |
| `src/components/food-log-client.tsx` | Dish-group rendering + delete-group callback |
| `src/components/food-log/nutrition-pulse.tsx` | Replace recent-foods with favorites |
| `src/app/(dashboard)/food-log/food-log-content.tsx` | Wire new modals, dish-group delete, favorites |
| `src/components/food-search-field/tabs.tsx` | Custom-tab priority logic |
| `src/components/food-search-field/result-item.tsx` | Dish label + favorite toggle |
| `src/hooks/use-food-search.ts` | Expose `hasCustomResults` signal |
| `src/app/(dashboard)/my-foods/page.tsx` | Full rebuild with tabs |
| `src/app/(dashboard)/my-foods/create/page.tsx` | Real form (was "coming soon") |

New files to create:
- `src/types/dish.ts`, `src/types/favorites.ts`
- `src/queries/dishes.ts`, `src/queries/favorites.ts`
- `src/components/dish-log-modal.tsx`
- `src/components/favorites-modal.tsx`
- `src/components/favorite-toggle-button.tsx`
- `src/app/(dashboard)/my-foods/[foodId]/edit/page.tsx`
- `src/app/(dashboard)/my-foods/dishes/create/page.tsx`
- `src/app/(dashboard)/my-foods/dishes/[dishId]/edit/page.tsx`
- `src/app/api/dishes/route.ts`, `src/app/api/dishes/[dishId]/route.ts`, `src/app/api/dishes/search/route.ts`
- `src/app/api/food-logs/dish/route.ts`, `src/app/api/food-logs/dish-group/[dishLogGroupId]/route.ts`
- `src/app/api/favorites/route.ts`, `src/app/api/favorites/top/route.ts`, `src/app/api/favorites/ids/route.ts`, `src/app/api/favorites/[favoriteId]/route.ts`
- `src/app/api/foods/custom/route.ts` (GET+POST), `src/app/api/foods/custom/[foodId]/route.ts` (PATCH+DELETE)
- `e2e/007-custom-dishes.spec.ts`, `e2e/007-favorites.spec.ts`, `e2e/007-my-foods-full.spec.ts`

---

## 8. Verification

1. Run `npm run db:push` (or recreate DB) to apply schema changes
2. Run `npm run db:seed` to verify seed dishes + favorites insert without error
3. `npm run dev` → My Foods page shows two tabs with seeded data
4. Create a dish end-to-end: My Foods → Dishes → Create → add ingredients → save → appears in list
5. Food Log page: search for seeded dish name → Custom tab auto-selected → 'Dish' label shown → open DishLogModal → change multiplier → Add → food log shows grouped items under "From:" header
6. NutritionPulse: verify favorites pills show seeded favorites; click "See all" → modal opens; remove one → disappears
7. `npm run test:e2e` — all three new spec files pass
8. `npm test && npm run lint` — no regressions
