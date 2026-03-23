# Data Model: FatSecret Food Retrieval

**Branch**: `003-fatsecret-food-retrieval` | **Date**: 2026-03-16

## Schema Changes (Drizzle Migrations Required)

### 1. `food_photos` — Add `medium` column

**Reason**: FatSecret provides three image sizes (thumb 72×72, medium 400×400,
highres 1024×1024). The existing schema stores only `thumb` and `highres`.

```typescript
// BEFORE
export const foodPhotos = pgTable('food_photos', {
  id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
  foodId: uuid('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }).unique(),
  thumb: varchar('thumb', { length: 500 }),
  highres: varchar('highres', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// AFTER — add medium column
export const foodPhotos = pgTable('food_photos', {
  id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
  foodId: uuid('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }).unique(),
  thumb: varchar('thumb', { length: 500 }),
  medium: varchar('medium', { length: 500 }),   // NEW: 400×400 URL
  highres: varchar('highres', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Migration**: `drizzle-kit generate` then `npm run db:push` (dev) or migration
file for production.

---

## No Other Schema Changes

The existing `foods`, `food_alt_measures`, and `food_photos` tables cover all
FatSecret data when mapped correctly (see below).

---

## Entity Mapping: FatSecret → Local Schema

### `foods` Table — 100g Base Record

| Existing Column | FatSecret Source | Notes |
|---|---|---|
| `source` | `'fatsecret'` (constant) | Replaces 'nutritionix' |
| `sourceId` | `food.food_id` | Used for deduplication (FR-004) |
| `name` | `food.food_name` | |
| `brandName` | `food.brand_name` (Brand foods only) | null for Generic foods |
| `servingQty` | `100` | Always 100 for base record |
| `servingUnit` | `'g'` | Always grams for base record |
| `servingWeightGrams` | `100` | |
| `calories` | 100g serving `calories` | |
| `protein` | 100g serving `protein` | |
| `carbs` | 100g serving `carbohydrate` | |
| `fat` | 100g serving `fat` | |
| `fiber` | 100g serving `fiber` | nullable |
| `sugar` | 100g serving `sugar` | nullable |
| `sodium` | 100g serving `sodium` | nullable |
| `fullNutrients` | Extended nutrients JSONB (see below) | |
| `isRaw` | `false` | FatSecret doesn't flag raw foods |
| `isCustom` | `false` | Not user-created |
| `userId` | `null` | Shared global food |

**`fullNutrients` JSONB structure** (stores micronutrients + metadata):
```json
{
  "saturatedFat": 0.039,
  "polyunsaturatedFat": 0.070,
  "monounsaturatedFat": 0.010,
  "cholesterol": 0,
  "potassium": 107,
  "vitaminA": 1,
  "vitaminC": 10,
  "calcium": 1,
  "iron": 1,
  "foodType": "Generic",
  "foodUrl": "https://www.fatsecret.com/..."
}
```

---

### `food_photos` Table

| Column | FatSecret Source | Notes |
|---|---|---|
| `foodId` | local `foods.id` after insert | FK |
| `thumb` | `images.image[]` URL with `_tb`/`_72` pattern | nullable if absent |
| `medium` | `images.image[]` URL with `_200`/`_400` pattern | **NEW column**; nullable if absent |
| `highres` | `images.image[]` URL without size suffix or `_1024` | nullable if absent |

When `images` is absent or empty: row is not inserted (omit image section per
clarification Q3).

---

### `food_alt_measures` Table — Alternate Servings

All servings from FatSecret **excluding** the 100g base serving are stored here.

| Column | FatSecret Source | Notes |
|---|---|---|
| `foodId` | local `foods.id` after insert | FK |
| `servingWeight` | `serving.metric_serving_amount` | grams |
| `measure` | `serving.serving_description` | e.g., "1 cup (245g)" |
| `seq` | Index in servings array (0-based + 1) | display order |
| `qty` | `1` | FatSecret doesn't separate qty from measure |

**Nutritional values per serving** are calculated at query time by proportional
scaling from the 100g base record:

```
value_per_serving = base_100g_value × (servingWeight / 100)
```

This avoids storing redundant nutritional data in `food_alt_measures`.

---

## Transient Types (Not Persisted)

### `FoodSearchResult` (API response item)

Used in `GET /api/foods/search` response only. Not a DB entity.

```typescript
interface FoodSearchResultItem {
  id: string | null;           // local DB UUID; null if not yet saved
  fatSecretId: string;         // FatSecret food_id
  name: string;
  brandName: string | null;
  foodType: 'Generic' | 'Brand';
  thumbnail: string | null;
  calories: number | null;     // null for new foods (only from search list, no 100g yet)
  isLocal: boolean;            // true = fetched from local DB
}

interface SearchPagination {
  page: number;               // 1-based
  totalResults: number;
  maxResults: number;         // always 20
}
```

### `FoodDetailResponse` (API response)

Used in `GET /api/foods/detail?fatSecretId=...` response only.

```typescript
interface FoodDetailResponse {
  id: string;                 // local DB UUID
  fatSecretId: string;
  name: string;
  brandName: string | null;
  foodType: 'Generic' | 'Brand';
  foodUrl: string | null;
  baseServing: {              // 100g base
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    saturatedFat: number | null;
    fiber: number | null;
    sugar: number | null;
    sodium: number | null;
    potassium: number | null;
    // ... other micronutrients
  };
  servings: FoodServing[];
  images: FoodImages | null;
}

interface FoodServing {
  id: string;                 // local DB UUID (foodAltMeasures.id)
  description: string;
  weightGrams: number;
  // Calculated fields (proportional from 100g base):
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
}

interface FoodImages {
  thumb: string | null;
  medium: string | null;
  highres: string | null;
}
```

---

## Updated TypeScript Types

### `src/types/food.ts` changes

```typescript
// FoodSource — remove 'nutritionix', add 'fatsecret'
export type FoodSource =
  | 'fatsecret'         // NEW
  | 'user_custom'
  | 'usda'
  | 'manual'
  | 'database';

// FoodPhoto — add medium
export interface FoodPhoto {
  thumb?: string | null;
  medium?: string | null;   // NEW
  highres?: string | null;
}
```

Remove `NutritionixFood`, `NutritionixSearchResult`, `NaturalLanguageResponse`,
`InstantSearchResponse`, and `nutritionixToBaseFood` — replaced by FatSecret equivalents.

---

## Deduplication Logic

Before saving a FatSecret food to local DB (FR-004):

```sql
SELECT id FROM foods WHERE source = 'fatsecret' AND source_id = $1 LIMIT 1;
```

If a row exists, skip the insert entirely. Drizzle query:

```typescript
await db.select({ id: foods.id })
  .from(foods)
  .where(and(eq(foods.source, 'fatsecret'), eq(foods.sourceId, fatSecretId)))
  .limit(1);
```

For concurrent saves, the unique index `foods_source_id_idx` combined with an
`ON CONFLICT DO NOTHING` insert strategy prevents duplicates silently.
