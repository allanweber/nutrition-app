# FatSecret Food Retrieval — Implementation Plan

## Context

Replace Nutritionix with FatSecret as the sole external food data provider. Implement keyword food search with local-DB-first priority, unified paginated results (local first + FatSecret), async background save (fire-and-forget), and a `FATSECRET_ENABLED` boolean feature flag.

---

## Design Decisions

### FatSecret API Integration
- **OAuth 2.0 Client Credentials** for server-side authentication
- Token endpoint: `https://oauth.fatsecret.com/connect/token`
- Token cached in-process for 24h (refresh 60s before expiry)
- Search endpoint: `GET /rest/foods/search/v5` with `include_food_images=true`, `max_results=10`

### v5 Search Response
- Returns `food_attributes.macros` (per-serving nutrition) and `food_images` directly in search results
- **No separate detail API call needed** - all save data comes from search
- `getFoodById` is never called

### Local-First Search Strategy
- Check local DB (`source = 'fatsecret'`) before querying external provider
- Drizzle `ilike` on `foods.name` for local search
- Local results appear first in unified results list

### Async Background Save
- Fire-and-forget: save to DB after search, don't block user
- Save uses v5 search data directly (nutrition + images)
- No retry - next search re-triggers save if failed
- `onConflictDoNothing()` handles concurrent race conditions

### Pagination Strategy
- Page 1: `[localMatches, ...deduplicatedFatSecretPage0]`
- Page 2+: FatSecret page N only (local already shown on page 1)
- `totalResults` always from FatSecret's value

### Feature Flag
- `FATSECRET_ENABLED` env var (default: `true`)
- When `false`: all FatSecret API calls disabled, local-only results

### Deduplication
- Pre-insert check: query DB for existing `source = 'fatsecret'` + `source_id`
- DB-level unique index with `ON CONFLICT DO NOTHING`

### 100g Base Serving
- Identified by `metric_serving_amount === "100.000"` OR `serving_description === "100 g"`
- If not found, use first available serving as base

### Image Sizes
- FatSecret returns 3 sizes: thumb 72×72, medium 400×400, highres 1024×1024
- Match by URL substring: `_72x72`, `_400x400`, `_1024x1024`

### Error Handling
- On FatSecret failure: log error, return local results only
- On HTTP 429: log as `console.warn('[FatSecret] rate limit event')`
- Never expose raw FatSecret errors to client

---

## Schema Changes Required

### `food_photos` — Add `medium` column

**Reason**: FatSecret provides three image sizes. Existing schema stores only thumb and highres.

```typescript
// Add between thumb and highres:
medium: varchar('medium', { length: 500 }),   // 400×400 URL
```

**Migration**: `npm run db:generate` then `npm run db:push`

### No Other Schema Changes

Existing `foods`, `food_alt_measures`, and `food_photos` tables cover all FatSecret data.

---

## Files to Create

### Type Definitions

| File | Purpose |
|------|---------|
| `src/types/fatsecret.ts` | TypeScript types for FatSecret API v5 responses |

### Library & Service

| File | Purpose |
|------|---------|
| `src/lib/fatsecret.ts` | OAuth 2.0 client, `searchFoods(keyword, page)`, mock bypass |
| `src/server/services/food-search.service.ts` | Orchestration: local + FatSecret + merge + async save |

### API Routes

| File | Purpose |
|------|---------|
| `src/app/api/foods/search/route.ts` | REPLACE - FatSecret + local + pagination |
| `src/app/api/foods/detail/route.ts` | NEW - food detail (local DB only, never calls FatSecret) |

### Testing

| File | Purpose |
|------|---------|
| `src/lib/__tests__/mock-fatsecret.ts` | Mock search responses for E2E tests |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/types/food.ts` | Replace `'nutritionix'` with `'fatsecret'` in FoodSource union |
| `src/server/db/schema.ts` | Add `medium` column to foodPhotos table |
| `.env.example` | Replace Nutritionix vars with FatSecret vars |
| `src/queries/foods.ts` | New response shape + pagination type |
| `src/components/food-search.tsx` | New unified result list + pagination |

---

## Files to Delete

| File | Reason |
|------|--------|
| `src/lib/nutritionix.ts` | Replaced by fatsecret.ts |
| `src/types/nutritionix.ts` | Replaced by fatsecret.ts |
| `src/lib/__tests__/mock-nutritionix.ts` | Replaced by mock-fatsecret.ts |
| `src/app/api/foods/nutrients/route.ts` | No FatSecret equivalent, no active callers |
| `src/app/api/foods/upc/route.ts` | No FatSecret equivalent, no active callers |

---

## Key Data Shapes

### GET /api/foods/search
```typescript
// Query params: q (string, min 3 chars), page (int, min 1, default 1)
// Response
{
  results: Array<{
    id: string | null;        // local DB UUID; null if not yet saved
    fatSecretId: string;       // FatSecret food_id
    name: string;
    brandName: string | null;
    foodType: 'Generic' | 'Brand';
    thumbnail: string | null;
    calories: number | null;   // null for new foods
    isLocal: boolean;          // true = from local DB
  }>,
  pagination: {
    page: number;              // 1-based
    totalResults: number;
    maxResults: number;        // always 20
  }
}
```

### GET /api/foods/detail
```typescript
// Query params: fatSecretId (required string)
// Response
{
  food: {
    id: string;
    fatSecretId: string;
    name: string;
    brandName: string | null;
    foodType: 'Generic' | 'Brand';
    foodUrl: string | null;
    baseServing: { /* 100g macros */ };
    servings: Array<{
      id: string;
      description: string;
      weightGrams: number;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      // ... other macros
    }>;
    images: {
      thumb: string | null;
      medium: string | null;
      highres: string | null;
    } | null;
  }
}
// 404 when food not found in local DB
```

---

## Implementation Order

1. **Setup**: Delete Nutritionix files, update .env.example
2. **Foundational**:
   - Create TypeScript types for FatSecret v5
   - Add `medium` column to foodPhotos schema
   - Run migration
   - Create FatSecret OAuth client + mock data
   - Create food-search.service.ts
3. **User Story 1** (P1 - MVP): Search Foods by Keyword
   - Implement search service + API route
   - Update queries and component
   - Add E2E tests
4. **User Story 2** (P2): View Food Nutritional Detail
   - Add `getDetail()` to service (local DB only)
   - Create detail API route
   - Update component with detail view
5. **User Story 3** (P3): Reliable Availability Under Errors
   - Wrap FatSecret calls with error handling
   - Log errors and rate limit events
   - Ensure graceful degradation
6. **Polish**: Verify no Nutritionix refs remain, lint, update docs

---

## Verification Checklist

- [ ] No Nutritionix references remain in codebase
- [ ] Search returns paginated results within 2s (local) / 5s (FatSecret)
- [ ] Local foods appear first on page 1
- [ ] Foods saved to DB after search with correct nutrition + images
- [ ] Detail endpoint reads local DB only, never calls FatSecret
- [ ] FatSecret failures return local results gracefully
- [ ] Rate limit events logged appropriately
- [ ] npm run lint passes
- [ ] E2E tests pass for all three user stories
