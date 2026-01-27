# Implementation Plan: Multi-Source Nutrition Data Aggregation

**Branch**: `002-multi-source-nutrition-data` | **Date**: 2026-01-26 | **Spec**: `/specs/002-multi-source-nutrition-data/spec.md`
**Input**: Feature specification from `spec.md`

## Summary

Replace the Nutritionix-only integration with a multi-source nutrition data aggregation system that:

- **Queries free APIs in parallel (all server-side)**: USDA FoodData Central, OpenFoodFacts, FatSecret
- **Implements tiered caching**: in-memory cache → database → external APIs
- **Progressive loading**: show cached/DB results instantly, then external API results
- **Barcode lookup**: manual UPC entry with lookup via OpenFoodFacts and FatSecret (camera scanning deferred)

Key architectural decisions:
- **All sources server-side**: Protects API keys, simplifies architecture
- **ILIKE + index for DB search**: Simple, sufficient for initial scale

## Technical Context

**Language/Version**: TypeScript + Next.js (App Router)
**Primary Dependencies**: React Query, Drizzle ORM (Postgres), Zod, Tailwind + shadcn/ui
**Storage**: PostgreSQL (food cache), in-memory LRU cache (search results)
**Testing**: Playwright E2E (`e2e/**`)
**Target Platform**: Web
**Project Type**: Single Next.js application
**New Libraries**: None (use native `fetch`, existing React Query)
**Constraints**:

- No paid APIs ($0 budget) - USDA + OpenFoodFacts + FatSecret free tier only
- All API calls server-side (protect API keys)
- FatSecret requires server-side OAuth (credentials cannot be exposed)
- 3-second hard timeout for search results
- Minimal new dependencies
- Manual barcode entry only (camera scanning deferred)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Code quality: changes are scoped, typed, and maintainable via adapter pattern.
- Testing: E2E tests cover multi-source search, caching, barcode flows.
- UX: Progressive loading with instant cached results; graceful degradation.
- Performance: Parallel API calls; LRU cache eviction; DB index for search.
- Safety: All API keys server-side only; no credentials exposed to client.

## Project Structure

### Documentation (this feature)

```text
specs/002-multi-source-nutrition-data/
├── spec.md
├── plan.md
├── research.md (to be created if needed)
├── data-model.md (to be created)
└── checklists/ (to be created)
```

### Source Code Changes

```text
src/
 lib/
  nutrition-sources/
   types.ts                         # Shared interfaces for all sources
   usda.ts                          # Server-side USDA FoodData Central
   openfoodfacts.ts                 # Server-side OpenFoodFacts
   fatsecret.ts                     # Server-side FatSecret (OAuth)
   aggregator.ts                    # Parallel query orchestration
   cache.ts                         # LRU in-memory cache
   mock-sources.ts                  # Mock data for E2E tests
  nutritionix.ts                    # DELETE

 types/
  food.ts                           # Update FoodSource enum
  nutritionix.ts                    # DELETE

 app/
  api/
   foods/
    search/route.ts                 # Rewrite: DB + all sources in parallel
    nutrients/route.ts              # Rewrite: get detailed nutrition
    upc/route.ts                    # Rewrite: barcode lookup

 queries/
  foods.ts                          # Update types for new response format

 components/
  food-search.tsx                   # Update: barcode input field, simplified loading

drizzle/
 XXXX_food_search_index.sql         # NEW: Add index for food search

e2e/
 phase-2-food-logging.spec.ts       # Extend for multi-source
```

### Files to Delete

```text
src/lib/nutritionix.ts
src/types/nutritionix.ts
src/lib/__tests__/mock-nutritionix.ts
```

### Files to Modify

```text
src/types/food.ts                   # Update FoodSource, remove Nutritionix types
src/app/api/foods/search/route.ts   # Rewrite
src/app/api/foods/nutrients/route.ts # Rewrite
src/app/api/foods/upc/route.ts      # Rewrite
src/app/api/food-logs/route.ts      # Update getOrCreateFood
src/components/food-search.tsx      # Add barcode input field
src/queries/foods.ts                # Update types for new response format
.env.example                        # Add new API keys
```

## Complexity Tracking

No constitution violations anticipated. Parallelism handled via `Promise.allSettled()` for graceful degradation.

## Design Notes

### Source Priority & Execution Model

| Source | Execution | Rate Limit | Priority | Notes |
|--------|-----------|------------|----------|-------|
| **Database** | Server | N/A | 1 (first) | Cached foods, ILIKE search |
| **USDA** | Server | 1,000/hr/IP | 2 | Authoritative source |
| **OpenFoodFacts** | Server | 100/min | 3 | Crowdsourced, good for barcodes |
| **FatSecret** | Server | 5,000/day | 4 | OAuth required |

### Search Flow (All Server-Side)

```
User types query
    │
    └─► [Server] /api/foods/search
              │
              ├─► Database (ILIKE, instant)
              │
              └─► Promise.allSettled() with 3s timeout:
                    ├─► USDA FoodData Central
                    ├─► OpenFoodFacts
                    └─► FatSecret
                              │
                              ▼
                    Merge, Dedupe, Save to DB ───► Response
```

### Parallel Implementation Strategy

1. **All sources server-side**: Single `/api/foods/search` endpoint queries DB + USDA + OFF + FS
2. **Parallel external queries**: Use `Promise.allSettled()` for USDA, OFF, FS in parallel
3. **Database first**: Return DB results immediately, external results merge in
4. **Deduplication**: By normalized name + brand matching
5. **Immediate persistence**: Save new foods to database on retrieval

### Barcode Flow (Manual Entry)

```
User enters UPC manually
    │
    └─► [Server] /api/foods/upc?upc=XXX
              │
              ├─► Database (check cache first)
              ├─► OpenFoodFacts (primary for barcodes)
              └─► FatSecret (fallback)
              │
              ▼
        Save to DB if found ───► Response
```

*Note: Camera-based barcode scanning deferred to future phase.*

### Caching Strategy

1. **In-memory LRU cache** (server): 1000 items, keyed by search query
2. **Database cache**: All foods from external APIs saved immediately on retrieval
3. **Database search**: ILIKE with lowercase index for fast prefix matching
4. **React Query cache** (client): Standard query caching with stale-while-revalidate

### API Authentication (All Server-Side)

- **USDA**: API key in `USDA_API_KEY` env var (server-side only)
- **OpenFoodFacts**: No auth required
- **FatSecret**: OAuth 2.0 Client Credentials in `FATSECRET_CLIENT_ID` and `FATSECRET_CLIENT_SECRET`

## Phase 0 - Research (to be done if needed)

- Verify USDA FoodData Central API response format
- Verify OpenFoodFacts API response format
- Verify FatSecret OAuth flow and API response format
- Document nutrient ID mappings between sources

## Phase 1 - Design & Contracts

### Task 1.1: Define Shared Types

Create `src/lib/nutrition-sources/types.ts`:

```typescript
// Common interface all sources must return
interface NutritionSourceFood {
  sourceId: string;
  source: 'usda' | 'openfoodfacts' | 'fatsecret' | 'database';
  name: string;
  brandName?: string;
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
  photo?: { thumb?: string; highres?: string };
  barcode?: string;
  isRaw?: boolean;
}

interface NutritionSourceSearchResult {
  foods: NutritionSourceFood[];
  source: string;
  cached: boolean;
}

interface NutritionSource {
  search(query: string): Promise<NutritionSourceSearchResult>;
  getByBarcode?(barcode: string): Promise<NutritionSourceFood | null>;
  isConfigured(): boolean;
}
```

### Task 1.2: Update FoodSource Type

Update `src/types/food.ts`:

```typescript
export type FoodSource =
  | 'usda'
  | 'openfoodfacts'
  | 'fatsecret'
  | 'user_custom'
  | 'database';
// Remove: 'nutritionix', 'manual'
```

## Phase 2 - Implementation

### Task 2.1: Create USDA Server-Side Source

Create `src/lib/nutrition-sources/usda.ts`:

- Server-side fetch to `https://api.nal.usda.gov/fdc/v1/foods/search`
- API key from `USDA_API_KEY` env var (server-side only)
- Implements `NutritionSource` interface
- Transform response to `NutritionSourceFood[]`
- Handle rate limits gracefully (1,000/hr/IP)
- `isConfigured()` checks for API key

### Task 2.2: Create OpenFoodFacts Server Source

Create `src/lib/nutrition-sources/openfoodfacts.ts`:

- Server-side fetch to `https://world.openfoodfacts.org/cgi/search.pl`
- No authentication required
- Transform response to `NutritionSourceFood[]`
- Support barcode lookup via `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`

### Task 2.3: Create FatSecret Server Source

Create `src/lib/nutrition-sources/fatsecret.ts`:

- OAuth 2.0 Client Credentials flow
- Token caching (expires in 24h typically)
- Server-side only (credentials in `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET`)
- Transform response to `NutritionSourceFood[]`
- Support barcode lookup

### Task 2.4: Create Aggregator with Parallel Execution

Create `src/lib/nutrition-sources/aggregator.ts`:

```typescript
async function searchAllSources(query: string): Promise<SearchAggregatorResult> {
  // 1. Check database first (ILIKE search, instant)
  const dbResults = await searchDatabase(query);

  // 2. Query ALL external sources in parallel with 3s timeout
  const [usdaResult, offResult, fsResult] = await Promise.allSettled([
    withTimeout(usda.search(query), 3000),
    withTimeout(openFoodFacts.search(query), 3000),
    withTimeout(fatSecret.search(query), 3000),
  ]);

  // 3. Merge, deduplicate (normalize name+brand), sort by priority
  // 4. Save new foods to database immediately
  return mergeAndDeduplicate(dbResults, usdaResult, offResult, fsResult);
}

async function searchDatabase(query: string): Promise<NutritionSourceFood[]> {
  // ILIKE search with index optimization
  return db.select().from(foods)
    .where(or(
      ilike(foods.name, `%${query}%`),
      ilike(foods.brandName, `%${query}%`)
    ))
    .limit(25);
}
```

**Deduplication normalization**:
```typescript
function normalizeForDedup(name: string, brand?: string): string {
  return [name, brand]
    .filter(Boolean)
    .join('|')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
```

### Task 2.5: Create LRU Cache

Create `src/lib/nutrition-sources/cache.ts`:

- Simple Map-based LRU cache
- Max 1000 entries
- TTL: 30 minutes for search results
- No external dependencies

### Task 2.6: Create Mock Sources for Testing

Create `src/lib/nutrition-sources/mock-sources.ts`:

- Mock implementations of each source
- Triggered by `USE_MOCK_NUTRITION_SOURCES=true`
- Reuse/adapt existing mock data from `mock-nutritionix.ts`

### Task 2.7: Update API Routes

Rewrite `src/app/api/foods/search/route.ts`:

- Call aggregator for DB + OpenFoodFacts + FatSecret
- Save new foods to database immediately
- Return unified response format

Rewrite `src/app/api/foods/upc/route.ts`:

- Check database first
- Query OpenFoodFacts then FatSecret for barcode
- Save result to database

Update `src/app/api/food-logs/route.ts`:

- Update `getOrCreateFood()` to work with new source format
- Remove Nutritionix-specific code

### Task 2.8: Update Frontend Components

Update `src/components/food-search.tsx`:

- Add barcode/UPC input field for manual entry
- Update loading states for server response
- Remove any Nutritionix-specific UI references
- Handle "not found" state for barcode lookups

Update `src/queries/foods.ts`:

- Update `FoodSearchResult` type for new response format (includes source statuses)
- Add `useBarcodeQuery(upc)` hook for barcode lookups
- Remove Nutritionix-specific types

### Task 2.9: Delete Nutritionix Files

- Delete `src/lib/nutritionix.ts`
- Delete `src/types/nutritionix.ts`
- Delete `src/lib/__tests__/mock-nutritionix.ts`

### Task 2.10: Update Environment Configuration

Update `.env.example`:

```bash
# Nutrition Data Sources (all server-side)
USDA_API_KEY="your_usda_api_key"  # Get free key from api.data.gov
FATSECRET_CLIENT_ID="your_fatsecret_client_id"
FATSECRET_CLIENT_SECRET="your_fatsecret_client_secret"
# OpenFoodFacts: No API key required

# Feature Flags
USE_MOCK_NUTRITION_SOURCES="false"

# REMOVED:
# NUTRITIONIX_APP_ID
# NUTRITIONIX_API_KEY
# USE_MOCK_NUTRITIONIX
```

## Phase 3 - Testing

### Task 3.1: Update E2E Tests

Update `e2e/phase-2-food-logging.spec.ts`:

- Test search returns results from multiple sources
- Test barcode scanning flow
- Test graceful degradation when sources fail
- Test cached results appear instantly

### Task 3.2: Manual Testing Checklist

- [ ] Search for common food (e.g., "apple") - verify results from USDA + OFF
- [ ] Search for branded food (e.g., "Cheerios") - verify results from OFF + FS
- [ ] Scan barcode - verify lookup works
- [ ] Disconnect network mid-search - verify graceful degradation
- [ ] Verify foods are saved to database after search
- [ ] Verify cached foods appear instantly on repeat search

## Implementation Order

Execute in this order to maintain working state:

1. **Phase 1**: Types and interfaces (non-breaking)
2. **Phase 2.1-2.4**: Create new source adapters (additive)
3. **Phase 2.5-2.6**: Cache and mocks (additive)
4. **Phase 2.7**: Update API routes (replace Nutritionix calls)
5. **Phase 2.8**: Update frontend (integrate client-side USDA)
6. **Phase 2.9**: Delete Nutritionix files (cleanup)
7. **Phase 2.10**: Update environment config
8. **Phase 3**: Testing

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| USDA API changes | Pin to v1 endpoint; monitor for deprecation notices |
| USDA rate limit (1,000/hr) | Server-side caching; graceful degradation |
| FatSecret rate limit (5,000/day) | Implement exponential backoff; degrade gracefully |
| OpenFoodFacts data quality | Use USDA as primary; OFF for branded/barcode only |
| Parallel request complexity | Use `Promise.allSettled()` for guaranteed resolution |
| Database search performance | ILIKE with index; monitor and add full-text if needed |
