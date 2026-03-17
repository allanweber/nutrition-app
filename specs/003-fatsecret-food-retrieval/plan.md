# Implementation Plan: FatSecret Food Retrieval

**Branch**: `003-fatsecret-food-retrieval` | **Date**: 2026-03-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-fatsecret-food-retrieval/spec.md`

## Summary

Replace Nutritionix with FatSecret as the sole external food data provider.
Implement keyword food search with local-DB-first priority, unified paginated
results (local first + FatSecret), async background save (fire-and-forget),
search result caching, food detail endpoint, and a `FATSECRET_ENABLED` boolean
feature flag. Remove all Nutritionix references from the codebase.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20
**Primary Dependencies**: Next.js 16 (App Router), Drizzle ORM, TanStack Query
  (no new packages — OAuth 2.0 Client Credentials uses native `fetch` only)
**Storage**: PostgreSQL via Drizzle ORM
**Testing**: Playwright E2E (no unit tests explicitly requested in spec)
**Target Platform**: Next.js web server (App Router, server components + API routes)
**Performance Goals**: Search results ≤2s for local-only results; ≤5s for FatSecret queries (SC-002)
**Constraints**: No new UI frameworks; FatSecret OAuth 2.0 Client Credentials; no Redis/queue
**Scale/Scope**: Single-instance Next.js dev server; Vercel for production

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Status | Notes |
|---|---|---|
| **1) Code Quality** | ✅ Pass | New files follow kebab-case; small composable modules; no god files |
| **2) Testing** | ✅ Pass | E2E coverage planned for all P1/P2 user stories; tests optional per spec |
| **3) UX Consistency** | ✅ Pass | shadcn/ui patterns preserved; loading/error/empty states required |
| **4) Performance** | ✅ Pass | Async background save (FR-007); no search result caching |
| **5) Correctness/Safety** | ✅ Pass | OAuth 2.0 token fetched server-side only; Zod validation on all endpoints; FATSECRET_ENABLED env var |
| **Next.js rules** | ✅ Pass | Route handlers under `src/app/api/**`; server-side auth/DB logic; `'use client'` only where needed |
| **TanStack Query** | ✅ Pass | `useFoodSearchQuery` updated; mutations invalidate cache |
| **External API rules** | ✅ Pass | Async background save; error logging; no raw errors to client; duplicate suppression |
| **DB rules** | ✅ Pass | Schema change via Drizzle migration; Drizzle ORM used throughout |
| **Dependencies** | ✅ Pass | No new packages — OAuth 2.0 token fetch uses native `fetch`. See research.md §2. |

## Project Structure

### Documentation (this feature)

```text
specs/003-fatsecret-food-retrieval/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── food-search.openapi.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code Changes

```text
src/
├── lib/
│   ├── fatsecret.ts              # NEW: FatSecret OAuth client (replaces nutritionix.ts)
│   ├── nutritionix.ts            # DELETE
│   └── __tests__/
│       ├── mock-fatsecret.ts     # NEW: mock data for E2E tests
│       └── mock-nutritionix.ts   # DELETE (if exists)
│
├── types/
│   ├── fatsecret.ts              # NEW: FatSecret API response types
│   ├── nutritionix.ts            # DELETE
│   └── food.ts                   # UPDATE: FoodSource + FoodPhoto
│
├── server/
│   └── services/
│       └── food-search.service.ts  # NEW: orchestration (local + FatSecret + merge)
│
├── queries/
│   └── foods.ts                  # UPDATE: new response shape + pagination
│
├── components/
│   └── food-search.tsx           # UPDATE: unified list + pagination + detail trigger
│
└── app/
    └── api/
        └── foods/
            ├── search/
            │   └── route.ts      # REPLACE: FatSecret + local + pagination
            ├── detail/
            │   └── route.ts      # NEW: food detail endpoint
            ├── nutrients/
            │   └── route.ts      # DELETE: no FatSecret equivalent, no active callers
            └── upc/
                └── route.ts      # DELETE: no FatSecret equivalent, no active callers

src/server/db/
└── schema.ts                     # UPDATE: add medium column to foodPhotos

.env.example                      # UPDATE: replace Nutritionix vars with FatSecret vars
```

**Structure Decision**: Single Next.js project (existing structure). New service
layer added at `src/server/services/` following existing server-side conventions.
No new project layers or packages.

## Complexity Tracking

> No constitution violations. No new external packages introduced.

---

## Phase 0: Research Findings

Full research in [research.md](research.md). Key decisions:

| Decision | Chosen | Rationale |
|---|---|---|
| FatSecret auth | OAuth 2.0 Client Credentials | Token endpoint at `oauth.fatsecret.com/connect/token`; credentials in POST body |
| Token implementation | Native `fetch` | No package needed; token cached in-process for 24h |
| Search API version | `GET /rest/foods/search/v5` with `include_food_images=true`, `max_results=10` | v5 returns `food_attributes.macros` and `food_images` in search results — no separate detail API call needed |
| Async save | Fire-and-forget using v5 search data | All nutrition (`food_attributes.macros`) and images (`food_images`) come from search result; `getFoodById` is not called |
| Search caching | None | No caching of search results; every request hits FatSecret API directly |
| Local search | Drizzle `ilike` on `foods.name` where `source = 'fatsecret'` | Existing index; sufficient for scale |
| Feature flag | `process.env.FATSECRET_ENABLED !== 'false'` | Simple, no DB config needed |

---

## Phase 1: Design

### Service Architecture

```
User request → GET /api/foods/search?q=...&page=N
                │
                ├─ Validate input (Zod, searchQuerySchema)
                ├─ Authenticate session
                │
                ├─ foodSearchService.search(keyword, page)
                │   ├─ searchLocalFoods(keyword)        → DB ILIKE query with LEFT JOIN food_photos (thumb)
                │   ├─ isFatSecretEnabled() ?
                │   │   ├─ fatSecretClient.searchFoods() → FatSecret API (no caching)
                │   │   ├─ deduplicateAgainstLocal()
                │   │   └─ saveFatSecretFoodsAsync()    → fire-and-forget (uses search result macros + images; no getFoodById call)
                │   └─ mergeResults(local, external)
                │
                └─ Return { results, pagination }


User request → GET /api/foods/detail?id=...
                │
                ├─ Validate input (id must be a positive integer)
                ├─ Authenticate session
                │
                ├─ DB lookup: WHERE id=$1 AND calories IS NOT NULL
                │   ├─ found? → load alt measures + compute serving nutrition + load photos
                │   └─ not found (or incomplete)? → return 404
                │       NOTE: FatSecret is NEVER called from this endpoint.
                │       Foods must be saved via search path first.
                │
                └─ Return { food } on 200, 404 if not found
```

### New Files Summary

| File | Purpose |
|---|---|
| `src/lib/fatsecret.ts` | OAuth 2.0 client; `searchFoods(keyword, page)` calling `https://platform.fatsecret.com/rest/foods/search/v5` with `include_food_images=true`, `max_results=10`; token cached in-process; mock support via `USE_MOCK_FATSECRET` |
| `src/types/fatsecret.ts` | TypeScript types for FatSecret API v5 responses (`FatSecretSearchResponse`, `FatSecretSearchFood` with `food_attributes.macros` and `food_images`, `FatSecretImage`) |
| `src/server/services/food-search.service.ts` | Orchestration; local-first logic; merge; async save; feature flag check |
| `src/lib/__tests__/mock-fatsecret.ts` | Mock search + detail responses for E2E tests |
| `src/app/api/foods/detail/route.ts` | GET detail endpoint |

### Key Implementation Notes

1. **FatSecret single-result quirk**: When the API returns exactly one food or serving,
   the value is a plain object, not an array. Always normalize:
   `foods_search.results.food` and `servings.serving` and `food_images.food_image`
   may each be a single object or an array — use `normalizeFoods`, `normalizeServings`,
   `normalizeImages` helpers from `@/types/fatsecret` respectively.

2. **v5 search provides all save data**: `GET /rest/foods/search/v5` returns
   `servings.serving[]` with full nutrition for each food in the search result.
   `saveFatSecretFoodsAsync` finds the 100g base serving, saves nutrition + micronutrients,
   alt measures, and photos — `getFoodById` is never called.

3. **Image URL pattern matching**: FatSecret v5 image URLs use `_WxH` dimension suffixes.
   Match by substring: `_72x72` → thumb, `_400x400` → medium, `_1024x1024` → highres.
   Thumbnails and calories are now available in search result items (`FoodSearchResultItem`).

4. **Save deduplication (two layers)**:
   - **Pre-insert check** (primary): `saveFatSecretFoodsAsync` queries the DB for `source = 'fatsecret' AND source_id = <food_id>` before each insert. If a record is found the food is skipped entirely.
   - **Conflict guard** (secondary): Drizzle's `onConflictDoNothing()` on the unique index over `(source, source_id)` silently discards any concurrent-race duplicates that slip past the pre-insert check.

5. **Pagination on page 1 vs page 2+**:
   - Page 1: `[localMatches, ...deduplicatedFatSecretPage0]`
   - Page 2+: FatSecret page N only (local already shown on page 1)
   - `maxResults` is `10` (matches `max_results` param sent to FatSecret v5).
   - `totalResults` always reflects FatSecret's `total_results` value.
   - When FatSecret disabled: `totalResults = localMatches.length`, single page.

6. **Serving nutrition calculation** (detail endpoint):
   ```
   servingCalories = baseCalories × (servingWeightGrams / 100)
   ```
   Applied to all macros and available micros.

7. **`foods.food_type` column**: Stores `food_type` (`'Generic'` or `'Brand'`) as a dedicated
   `varchar(50)` column — not in JSONB. Populated from `FatSecretSearchFood.food_type` during
   `saveFatSecretFoodsAsync`. `searchLocalFoods` selects it directly so `mergeResults` can
   populate `FoodSearchResultItem.foodType` without JSONB parsing.
   `fullNutrients` JSONB retains `foodUrl` and micronutrients only.

### Constitution Check (Post-Design)

All gates still pass. No new violations introduced during design.

---

## Artifacts

| Artifact | Path | Status |
|---|---|---|
| Research | `specs/003-fatsecret-food-retrieval/research.md` | ✅ Complete |
| Data Model | `specs/003-fatsecret-food-retrieval/data-model.md` | ✅ Complete |
| API Contract | `specs/003-fatsecret-food-retrieval/contracts/food-search.openapi.yaml` | ✅ Complete |
| Quickstart | `specs/003-fatsecret-food-retrieval/quickstart.md` | ✅ Complete |
| Tasks | `specs/003-fatsecret-food-retrieval/tasks.md` | ⏳ `/speckit.tasks` |
