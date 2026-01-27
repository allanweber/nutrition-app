# Implementation Tasks: Multi-Source Nutrition Data Aggregation

**Branch**: `002-multi-source-nutrition-data`
**Created**: 2026-01-26
**Plan**: [plan.md](./plan.md)

## Task Overview

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1.1-1.2 | Types and interfaces |
| 2 | 2.1-2.10 | Implementation |
| 3 | 3.1-3.2 | Testing |

---

## Phase 1: Types and Interfaces

### Task 1.1: Define Shared Nutrition Source Types

**Status**: [ ] Not Started

**Description**: Create the shared type definitions that all nutrition sources must implement.

**Files to Create**:
- `src/lib/nutrition-sources/types.ts`

**Acceptance Criteria**:
- [ ] `NutritionSourceFood` interface defined with all normalized fields
- [ ] `NutritionSourceSearchResult` interface defined
- [ ] `NutritionSource` interface defined with `search()`, `getByBarcode()`, `isConfigured()`
- [ ] `SearchAggregatorResult` interface for merged results with source status

**Code Outline**:
```typescript
export interface NutritionSourceFood {
  sourceId: string;
  source: 'usda' | 'openfoodfacts' | 'fatsecret' | 'database';
  name: string;
  brandName?: string | null;
  servingQty: number;
  servingUnit: string;
  servingWeightGrams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  photo?: { thumb?: string; highres?: string } | null;
  barcode?: string;
  isRaw?: boolean;
  fullNutrients?: Array<{ attr_id: number; value: number }>;
}

export interface NutritionSourceSearchResult {
  foods: NutritionSourceFood[];
  source: string;
  cached: boolean;
}

export interface NutritionSource {
  readonly name: string;
  search(query: string): Promise<NutritionSourceSearchResult>;
  getByBarcode?(barcode: string): Promise<NutritionSourceFood | null>;
  isConfigured(): boolean;
}

export interface SourceStatus {
  name: string;
  status: 'success' | 'error' | 'timeout';
  count: number;
  error?: string;
}

export interface SearchAggregatorResult {
  foods: NutritionSourceFood[];
  sources: SourceStatus[];
  fromCache: boolean;
}
```

---

### Task 1.2: Update FoodSource Type

**Status**: [ ] Not Started

**Description**: Update the FoodSource type to include new sources and remove Nutritionix references.

**Files to Modify**:
- `src/types/food.ts`

**Acceptance Criteria**:
- [ ] FoodSource type updated: remove `nutritionix`, add `openfoodfacts`, `fatsecret`
- [ ] Keep `usda`, `user_custom`, `database`
- [ ] Remove `manual` if unused
- [ ] Remove Nutritionix-specific types (`NutritionixFood`, `NutritionixSearchResult`, etc.)
- [ ] Keep `nutritionixToBaseFood` temporarily (will be removed in Task 2.9)

---

## Phase 2: Implementation

### Task 2.1: Create USDA Server-Side Source

**Status**: [ ] Not Started

**Description**: Implement server-side USDA FoodData Central integration.

**Files to Create**:
- `src/lib/nutrition-sources/usda.ts`

**Acceptance Criteria**:
- [ ] Implements `NutritionSource` interface
- [ ] Server-side fetch to `https://api.nal.usda.gov/fdc/v1/foods/search`
- [ ] Uses `USDA_API_KEY` environment variable (server-side only)
- [ ] Transforms USDA response to `NutritionSourceFood[]`
- [ ] Handles rate limit errors gracefully (1,000/hr/IP)
- [ ] `isConfigured()` checks for API key presence

**API Reference**:
```
GET https://api.nal.usda.gov/fdc/v1/foods/search
?api_key={key}&query={query}&pageSize=25&dataType=Foundation,SR%20Legacy,Branded
```

**Notes**:
- Server-side execution protects API key
- Rate limits apply to server IP (1,000/hr)

---

### Task 2.2: Create OpenFoodFacts Server Source

**Status**: [ ] Not Started

**Description**: Implement server-side OpenFoodFacts integration.

**Files to Create**:
- `src/lib/nutrition-sources/openfoodfacts.ts`

**Acceptance Criteria**:
- [ ] Implements `NutritionSource` interface
- [ ] Search via `https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&json=1`
- [ ] Barcode lookup via `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`
- [ ] No authentication required
- [ ] Transforms response to `NutritionSourceFood[]`
- [ ] Handles missing nutrition fields gracefully
- [ ] `isConfigured()` always returns true (no auth needed)

**Notes**:
- Rate limit: 100 requests/minute
- Good for branded/packaged foods and barcodes

---

### Task 2.3: Create FatSecret Server Source

**Status**: [ ] Not Started

**Description**: Implement server-side FatSecret integration with OAuth 2.0.

**Files to Create**:
- `src/lib/nutrition-sources/fatsecret.ts`

**Acceptance Criteria**:
- [ ] Implements `NutritionSource` interface
- [ ] OAuth 2.0 Client Credentials flow
- [ ] Token caching with expiration handling
- [ ] Uses `FATSECRET_CLIENT_ID` and `FATSECRET_CLIENT_SECRET` env vars
- [ ] Search via `foods.search` method
- [ ] Barcode lookup via `food.find_id_for_barcode` method
- [ ] Transforms response to `NutritionSourceFood[]`
- [ ] `isConfigured()` checks for credentials

**OAuth Flow**:
```
POST https://oauth.fatsecret.com/connect/token
Content-Type: application/x-www-form-urlencoded
grant_type=client_credentials&scope=basic
```

**Notes**:
- Rate limit: 5,000 calls/day (free tier)
- Credentials must NEVER be exposed client-side

---

### Task 2.4: Create Aggregator with Parallel Execution

**Status**: [ ] Not Started

**Description**: Create the aggregator that queries multiple sources in parallel and merges results.

**Files to Create**:
- `src/lib/nutrition-sources/aggregator.ts`

**Acceptance Criteria**:
- [ ] `searchAllSources(query)` function
- [ ] Queries database first using ILIKE (instant)
- [ ] Queries USDA, OpenFoodFacts, and FatSecret in parallel
- [ ] Uses `Promise.allSettled()` for graceful degradation
- [ ] 3-second timeout per source via `withTimeout()` helper
- [ ] Merges and deduplicates results using normalized name + brand
- [ ] Sorts by source priority (USDA > OFF > FS)
- [ ] Returns `SearchAggregatorResult` with source statuses
- [ ] `searchByBarcode(barcode)` function with same pattern
- [ ] Saves new foods to database immediately (with dedup check)

**Code Outline**:
```typescript
export async function searchAllSources(query: string): Promise<SearchAggregatorResult> {
  // 1. Check database first (ILIKE search)
  const dbResults = await searchDatabase(query);

  // 2. Query ALL external sources in parallel with timeout
  const [usdaResult, offResult, fsResult] = await Promise.allSettled([
    withTimeout(usda.search(query), 3000),
    withTimeout(openFoodFacts.search(query), 3000),
    withTimeout(fatSecret.search(query), 3000),
  ]);

  // 3. Merge, deduplicate, sort by priority
  // 4. Save new foods to database (dedup by sourceId + source)
  return mergeAndDeduplicate(dbResults, usdaResult, offResult, fsResult);
}

function normalizeForDedup(name: string, brand?: string): string {
  return [name, brand].filter(Boolean).join('|').toLowerCase().replace(/[^a-z0-9]/g, '');
}
```

---

### Task 2.4b: Add Database Search Index

**Status**: [ ] Not Started

**Description**: Add database index for food search performance optimization.

**Files to Create**:
- `drizzle/XXXX_food_search_index.sql`

**Acceptance Criteria**:
- [ ] Create index on `lower(name)` for case-insensitive search
- [ ] Create index on `lower(brand_name)` for case-insensitive search
- [ ] Migration runs successfully
- [ ] Search queries use index (verify with EXPLAIN)

**Migration SQL**:
```sql
CREATE INDEX idx_foods_name_lower ON foods (lower(name));
CREATE INDEX idx_foods_brand_lower ON foods (lower(brand_name));
```

**Notes**:
- Index optimizes prefix searches (`query%`)
- Middle-of-string searches (`%query%`) may not use index but acceptable for initial scale

---

### Task 2.5: Create LRU Cache

**Status**: [ ] Not Started

**Description**: Implement a simple LRU cache for search results.

**Files to Create**:
- `src/lib/nutrition-sources/cache.ts`

**Acceptance Criteria**:
- [ ] `LRUCache<K, V>` class with configurable max size
- [ ] `get(key)`, `set(key, value)`, `has(key)`, `delete(key)` methods
- [ ] LRU eviction when max size reached
- [ ] Optional TTL support (30 minutes default)
- [ ] `searchCache` instance with max 1000 items
- [ ] No external dependencies (use Map internally)

**Code Outline**:
```typescript
export class LRUCache<K, V> {
  private cache: Map<K, { value: V; expires: number }>;
  private maxSize: number;
  private ttlMs: number;

  constructor(maxSize = 1000, ttlMs = 30 * 60 * 1000) { ... }
  get(key: K): V | undefined { ... }
  set(key: K, value: V): void { ... }
  has(key: K): boolean { ... }
  delete(key: K): boolean { ... }
  clear(): void { ... }
}

export const searchCache = new LRUCache<string, NutritionSourceFood[]>(1000);
```

---

### Task 2.6: Create Mock Sources for Testing

**Status**: [ ] Not Started

**Description**: Create mock implementations for E2E testing.

**Files to Create**:
- `src/lib/nutrition-sources/mock-sources.ts`

**Acceptance Criteria**:
- [ ] Mock USDA source with sample foods
- [ ] Mock OpenFoodFacts source with sample foods
- [ ] Mock FatSecret source with sample foods
- [ ] Triggered by `USE_MOCK_NUTRITION_SOURCES=true` env var
- [ ] Includes variety of foods (fruits, proteins, branded items)
- [ ] Supports barcode lookups with test barcodes
- [ ] Reuse/adapt data from existing `mock-nutritionix.ts`

---

### Task 2.7: Update API Routes

**Status**: [ ] Not Started

**Description**: Rewrite the food API routes to use the new multi-source system.

**Files to Modify**:
- `src/app/api/foods/search/route.ts`
- `src/app/api/foods/nutrients/route.ts`
- `src/app/api/foods/upc/route.ts`
- `src/app/api/food-logs/route.ts`

**Acceptance Criteria**:

**search/route.ts**:
- [ ] Remove Nutritionix import
- [ ] Call `searchAllSources(query)` from aggregator
- [ ] Save new foods to database immediately
- [ ] Return unified response with source statuses
- [ ] Handle mock mode via env var

**nutrients/route.ts**:
- [ ] Remove Nutritionix import
- [ ] Look up food by ID from database
- [ ] If not in DB, search external sources
- [ ] Return normalized nutrition data

**upc/route.ts**:
- [ ] Remove Nutritionix import
- [ ] Call `searchByBarcode(barcode)` from aggregator
- [ ] Check database first, then OpenFoodFacts, then FatSecret
- [ ] Save result to database
- [ ] Return normalized food data or 404

**food-logs/route.ts**:
- [ ] Remove Nutritionix import
- [ ] Update `getOrCreateFood()` to work with new source format
- [ ] Use aggregator for food lookup if not in database

---

### Task 2.8: Update Frontend Components

**Status**: [ ] Not Started

**Description**: Update frontend for simplified server-only search and barcode input.

**Files to Modify**:
- `src/components/food-search.tsx`
- `src/queries/foods.ts`

**Acceptance Criteria**:

**food-search.tsx**:
- [ ] Add barcode/UPC input field for manual entry
- [ ] Add "Lookup by UPC" button/action
- [ ] Update loading states for server response
- [ ] Handle barcode "not found" state with option to search by name
- [ ] Remove any Nutritionix-specific UI references

**queries/foods.ts**:
- [ ] Update `FoodSearchResult` type for new response format (includes source statuses)
- [ ] Add `useBarcodeQuery(upc)` hook for barcode lookups
- [ ] Remove Nutritionix-specific types

---

### Task 2.9: Delete Nutritionix Files

**Status**: [ ] Not Started

**Description**: Remove all Nutritionix-related files and references.

**Files to Delete**:
- `src/lib/nutritionix.ts`
- `src/types/nutritionix.ts` (if separate from food.ts)
- `src/lib/__tests__/mock-nutritionix.ts`

**Files to Modify**:
- `src/types/food.ts` - Remove `nutritionixToBaseFood()` function
- `src/types/food.ts` - Remove Nutritionix-specific types

**Acceptance Criteria**:
- [ ] All Nutritionix files deleted
- [ ] No imports of deleted files remain
- [ ] `nutritionixToBaseFood()` removed from food.ts
- [ ] Nutritionix types removed from food.ts
- [ ] Build passes with no errors
- [ ] No references to "nutritionix" in codebase (except historical data in DB)

---

### Task 2.10: Update Environment Configuration

**Status**: [ ] Not Started

**Description**: Update environment configuration for new API sources.

**Files to Modify**:
- `.env.example`
- `.env.test` (if exists)

**Acceptance Criteria**:
- [ ] Add `USDA_API_KEY` (server-side only)
- [ ] Add `FATSECRET_CLIENT_ID` (server-side)
- [ ] Add `FATSECRET_CLIENT_SECRET` (server-side)
- [ ] Add `USE_MOCK_NUTRITION_SOURCES` flag
- [ ] Remove `NUTRITIONIX_APP_ID`
- [ ] Remove `NUTRITIONIX_API_KEY`
- [ ] Remove `USE_MOCK_NUTRITIONIX`
- [ ] Add comments explaining each variable

---

## Phase 3: Testing

### Task 3.1: Update E2E Tests

**Status**: [ ] Not Started

**Description**: Update Playwright E2E tests for multi-source functionality.

**Files to Modify**:
- `e2e/phase-2-food-logging.spec.ts`

**Acceptance Criteria**:
- [ ] Test: Search returns results (mock mode)
- [ ] Test: Food can be logged from search results
- [ ] Test: Cached foods appear on repeat search
- [ ] Test: Barcode lookup returns product (mock mode)
- [ ] Test: Graceful handling when no results found
- [ ] Update mock data setup for new sources
- [ ] Tests pass in CI

---

### Task 3.2: Manual Testing Checklist

**Status**: [ ] Not Started

**Description**: Manual verification of all functionality.

**Checklist**:
- [ ] Search for common food (e.g., "apple") - verify results from USDA + OFF
- [ ] Search for branded food (e.g., "Cheerios") - verify results from OFF + FS
- [ ] Scan barcode - verify lookup works
- [ ] Disconnect network mid-search - verify graceful degradation
- [ ] Verify foods are saved to database after search
- [ ] Verify cached foods appear instantly on repeat search
- [ ] Verify source is NOT displayed in UI
- [ ] Verify progressive loading (results appear as sources respond)
- [ ] Test with missing API keys - verify graceful degradation
- [ ] Test rate limit behavior (if possible)

---

## Dependency Graph

```
Task 1.1 (Types)
    │
    ├──► Task 1.2 (Update FoodSource)
    │
    ├──► Task 2.1 (USDA Server) ────────────────────┐
    │                                                │
    ├──► Task 2.2 (OpenFoodFacts) ──┐               │
    │                                │               │
    ├──► Task 2.3 (FatSecret) ──────┼───► Task 2.4 (Aggregator)
    │                                │         │
    ├──► Task 2.4b (DB Index) ──────┤         │
    │                                │         │
    └──► Task 2.5 (LRU Cache) ──────┘         │
                                               │
    Task 2.6 (Mocks) ─────────────────────────┤
                                               │
                                               ▼
                                        Task 2.7 (API Routes)
                                               │
                                               ▼
                                        Task 2.8 (Frontend)
                                               │
                                               ▼
                                        Task 2.9 (Delete Nutritionix)
                                               │
                                               ▼
                                        Task 2.10 (Env Config)
                                               │
                                               ▼
                                        Task 3.1 (E2E Tests)
                                               │
                                               ▼
                                        Task 3.2 (Manual Testing)
```

---

## Execution Order

For maintaining a working state throughout implementation:

1. **Task 1.1** - Types (non-breaking, additive)
2. **Task 1.2** - Update FoodSource (non-breaking if Nutritionix types kept temporarily)
3. **Task 2.4b** - DB Index (additive, can run migration early)
4. **Task 2.5** - LRU Cache (additive, no dependencies)
5. **Task 2.1** - USDA Server (additive)
6. **Task 2.2** - OpenFoodFacts (additive)
7. **Task 2.3** - FatSecret (additive)
8. **Task 2.6** - Mocks (additive)
9. **Task 2.4** - Aggregator (additive, uses sources)
10. **Task 2.7** - API Routes (breaking change - switches from Nutritionix)
11. **Task 2.8** - Frontend (barcode input, simplified loading)
12. **Task 2.9** - Delete Nutritionix (cleanup)
13. **Task 2.10** - Env Config (cleanup)
14. **Task 3.1** - E2E Tests
15. **Task 3.2** - Manual Testing
