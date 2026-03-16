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
  (no new packages — OAuth 1.0a implemented with Node.js built-in `crypto`)
**Storage**: PostgreSQL via Drizzle ORM
**Testing**: Playwright E2E (no unit tests explicitly requested in spec)
**Target Platform**: Next.js web server (App Router, server components + API routes)
**Performance Goals**: Search results ≤2s for cached/local foods (SC-001),
  ≤5s for uncached FatSecret queries (SC-002)
**Constraints**: No new UI frameworks; FatSecret OAuth 1.0a; no Redis/queue
**Scale/Scope**: Single-instance Next.js dev server; Vercel for production

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Status | Notes |
|---|---|---|
| **1) Code Quality** | ✅ Pass | New files follow kebab-case; small composable modules; no god files |
| **2) Testing** | ✅ Pass | E2E coverage planned for all P1/P2 user stories; tests optional per spec |
| **3) UX Consistency** | ✅ Pass | shadcn/ui patterns preserved; loading/error/empty states required |
| **4) Performance** | ✅ Pass | Search result caching (FR-009 via `unstable_cache`); async save (FR-007) |
| **5) Correctness/Safety** | ✅ Pass | OAuth secrets server-side only; Zod validation on all endpoints; FATSECRET_ENABLED env var |
| **Next.js rules** | ✅ Pass | Route handlers under `src/app/api/**`; server-side auth/DB logic; `'use client'` only where needed |
| **TanStack Query** | ✅ Pass | `useFoodSearchQuery` updated; mutations invalidate cache |
| **External API rules** | ✅ Pass | Async background save; search result cache; error logging; no raw errors to client; duplicate suppression |
| **DB rules** | ✅ Pass | Schema change via Drizzle migration; Drizzle ORM used throughout |
| **Dependencies** | ✅ Pass | No new packages — OAuth 1.0a signing implemented inline with Node.js built-in `crypto` (~40 lines). See research.md §2. |

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
No new project layers or packages beyond `oauth-1.0a`.

## Complexity Tracking

> No constitution violations. No new external packages introduced.

---

## Phase 0: Research Findings

Full research in [research.md](research.md). Key decisions:

| Decision | Chosen | Rationale |
|---|---|---|
| FatSecret auth | OAuth 1.0a | Only supported method for server-side REST API |
| OAuth implementation | Node.js built-in `crypto` | ~40 lines; no external package needed |
| Search caching | `unstable_cache` (Next.js built-in) | No Redis needed; works in dev + Vercel Data Cache |
| Async save | Fire-and-forget | Zero infrastructure; app scale justifies this |
| 100g identification | `metric_serving_amount === "100.000"` AND `metric_serving_unit === "g"` | Spec FR-003 + clarification |
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
                │   ├─ searchLocalFoods(keyword)        → DB ILIKE query
                │   ├─ isFatSecretEnabled() ?
                │   │   ├─ getCachedFatSecretSearch()   → unstable_cache → FatSecret API
                │   │   ├─ deduplicateAgainstLocal()
                │   │   └─ saveFatSecretFoodsAsync()    → fire-and-forget
                │   └─ mergeResults(local, external)
                │
                └─ Return { results, pagination }


User request → GET /api/foods/detail?fatSecretId=...
                │
                ├─ Validate input (Zod)
                ├─ Authenticate session
                │
                ├─ foodSearchService.getDetail(fatSecretId)
                │   ├─ findLocalBySourceId(fatSecretId) → DB lookup
                │   ├─ found? → return local data + compute serving nutrition
                │   └─ not found? →
                │       ├─ fatSecretClient.getFoodById()  → FatSecret food.get.v4
                │       ├─ saveFoodAsync()               → fire-and-forget
                │       └─ return FatSecret data
                │
                └─ Return { food }
```

### New Files Summary

| File | Purpose |
|---|---|
| `src/lib/fatsecret.ts` | OAuth 1.0a client; `searchFoods(keyword, page)`, `getFoodById(id)`; mock support via `USE_MOCK_FATSECRET` |
| `src/types/fatsecret.ts` | TypeScript types for FatSecret API responses (`FatSecretSearchResponse`, `FatSecretFoodDetail`, etc.) |
| `src/server/services/food-search.service.ts` | Orchestration; local-first logic; merge; async save; feature flag check |
| `src/lib/__tests__/mock-fatsecret.ts` | Mock search + detail responses for E2E tests |
| `src/app/api/foods/detail/route.ts` | GET detail endpoint |

### Key Implementation Notes

1. **FatSecret single-result quirk**: When the API returns exactly one food in a
   search, `foods.food` is a plain object, not an array. Always normalize with:
   `const foods = Array.isArray(raw.food) ? raw.food : [raw.food]`

2. **Image URL pattern matching**: FatSecret image URLs use size-based suffixes.
   Sort by URL patterns: `_tb`/`72` → thumb, `_200`/`_400` → medium, rest → highres.

3. **Concurrent save deduplication**: Use Drizzle's `onConflictDoNothing()` on
   a unique index over `(source, source_id)` to silently discard race conditions.

4. **Pagination on page 1 vs page 2+**:
   - Page 1: `[localMatches, ...deduplicatedFatSecretPage0]`
   - Page 2+: FatSecret page N only (local already shown on page 1)
   - `totalResults` always reflects FatSecret's `total_results` value.
   - When FatSecret disabled: `totalResults = localMatches.length`, single page.

5. **Serving nutrition calculation** (detail endpoint):
   ```
   servingCalories = baseCalories × (servingWeightGrams / 100)
   ```
   Applied to all macros and available micros.

6. **`fullNutrients` JSONB**: Stores FatSecret micronutrients (saturatedFat,
   cholesterol, potassium, vitamins, minerals) plus `foodType` and `foodUrl` metadata.
   See data-model.md for full schema.

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
