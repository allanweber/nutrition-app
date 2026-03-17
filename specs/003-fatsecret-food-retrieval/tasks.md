# Tasks: FatSecret Food Retrieval

**Input**: Design documents from `/specs/003-fatsecret-food-retrieval/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/food-search.openapi.yaml ✅, quickstart.md ✅

**Tests**: E2E tasks included for US1 and US2 (constitution §2 MUST). No unit test tasks (not requested in spec).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every task description

## Architecture Decisions (applied across all tasks)

- **FatSecret call site**: FatSecret API is called **only from the search path**. The detail endpoint reads local DB only and returns 404 if not found — it never calls FatSecret.
- **v5 search saves**: `saveFatSecretFoodsAsync` uses `food_attributes.macros` and `food_images` from the v5 search result directly — `getFoodById` is never called. Foods without `food_attributes.macros.calories` are skipped.
- **Component pattern**: `src/components/food-search.tsx` is a purely presentational component. All TanStack Query hooks live in the parent page. Props are passed down.

---

## Phase 1: Setup (Nutritionix Removal & Environment)

**Purpose**: Remove all Nutritionix artifacts and establish FatSecret environment config.

- [X] T001 Delete Nutritionix source files: `src/lib/nutritionix.ts`, `src/types/nutritionix.ts`, and `src/lib/__tests__/mock-nutritionix.ts` (if it exists)
- [X] T002 [P] Delete retired API route files: `src/app/api/foods/nutrients/route.ts` and `src/app/api/foods/upc/route.ts` (no FatSecret equivalents; no active callers per research.md §7)
- [X] T003 [P] Update `.env.example`: remove all `NUTRITIONIX_*` variables; add `FATSECRET_CONSUMER_KEY`, `FATSECRET_CONSUMER_SECRET`, `FATSECRET_ENABLED` (default `"true"`), and `USE_MOCK_FATSECRET` (default `"false"`) per quickstart.md §1

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, DB schema, OAuth client, and mock data that ALL user stories depend on.

**⚠️ CRITICAL**: Phase 3, 4, and 5 are blocked until T004–T009 are complete. T009 must complete before T008 (T008 imports from mock file at runtime).

- [X] T004 [P] Create `src/types/fatsecret.ts` with TypeScript types for FatSecret API v5 responses: `FatSecretSearchResponse`, `FatSecretSearchFood` (includes `food_attributes.macros` and `food_images`), `FatSecretImage` — normalize single-object vs array quirk with `Array.isArray` for `food` and `food_image` fields per plan.md Key Implementation Notes #1
- [X] T005 [P] Update `src/types/food.ts`: replace `'nutritionix'` with `'fatsecret'` in `FoodSource` union; add `medium?: string | null` field to `FoodPhoto` interface per data-model.md Updated TypeScript Types
- [X] T009 [P] Create `src/lib/__tests__/mock-fatsecret.ts` with hardcoded mock responses matching FatSecret v5 shapes: one multi-result search response (foods include `food_attributes.macros` and `food_images`), one single-result search response (food as object, not array with `food_attributes.macros`)
- [X] T006 Update `src/server/db/schema.ts`: add `medium: varchar('medium', { length: 500 })` column to the `foodPhotos` table definition between `thumb` and `highres`, exactly as specified in data-model.md Schema Changes
- [X] T007 Run Drizzle migration: `npm run db:generate` then `npm run db:push` — verify `medium` column appears in `food_photos` table per quickstart.md §2
- [X] T008 Create `src/lib/fatsecret.ts` (sequential — T009 must be complete first): (a) OAuth 2.0 Client Credentials token fetch using native `fetch`; token cached in-process; (b) `searchFoods(keyword: string, page: number)` calling `https://platform.fatsecret.com/rest/foods/search/v5` with `include_food_images=true`, `max_results=10`, `format=json`; each function calls `fetch` directly (no shared `callApi` helper); (c) mock bypass when `USE_MOCK_FATSECRET === 'true'`

**Checkpoint**: Foundation ready — OAuth client, types, DB schema, and mocks are in place.

---

## Phase 3: User Story 1 — Search Foods by Keyword (Priority: P1) 🎯 MVP

**Goal**: Users search foods by keyword and receive a unified paginated list with local results first, followed by FatSecret results. New foods are saved completely (nutrition + alt measures + photos) to local DB asynchronously.

**Independent Test**: Search for a keyword (e.g., `apple`) and verify: (1) paginated list with `results` and `pagination` fields; (2) local foods appear first; (3) FatSecret results follow; (4) empty search returns `{ results: [], pagination: { page: 1, totalResults: 0, maxResults: 10 } }`

- [X] T010 [US1] Create `src/server/services/food-search.service.ts` implementing full search orchestration per plan.md Service Architecture:
  - `searchLocalFoods(keyword)`: Drizzle `ilike` on `foods.name` where `source = 'fatsecret'`
  - `isFatSecretEnabled()`: `process.env.FATSECRET_ENABLED !== 'false'`
  - FatSecret search called directly via `fatSecretClient.searchFoods(keyword, page)` — no caching
  - `deduplicateAgainstLocal(fatSecretFoods, localFoods)`: compare by `sourceId`
  - `saveFatSecretFoodsAsync(searchResults)`: fire-and-forget; for **each** food in search results, saves nutrition from `food_attributes.macros` and images from `food_images.food_image` to `foods` and `food_photos` using `onConflictDoNothing()`; skips foods with no `macros.calories`; logs save failures via `console.error('[FatSecret] save error:', err)` per FR-013; **no `getFoodById` call**
  - `mergeResults(local, external, page)`: page-1 = `[localMatches, ...deduplicatedFatSecretPage0]`; page-2+ = FatSecret page N only; `totalResults` always from FatSecret `total_results` per plan.md Key Implementation Notes #4
  - Exported `foodSearchService.search(keyword, page)` returning `{ results: FoodSearchResultItem[], pagination: SearchPagination }` per data-model.md Transient Types

- [X] T011 [US1] Replace `src/app/api/foods/search/route.ts` with a GET handler using: existing helpers from `src/lib/api-validation.ts` to validate `q` (string, min 3, max 100) and `page` (int, min 1, default 1); session auth check returning 401 if unauthenticated; `foodSearchService.search()` call; response shape `{ results, pagination }` per contracts/food-search.openapi.yaml `/api/foods/search`; 400 for validation errors (structured `{ success: false, error, field? }`); 500 for unexpected errors — never expose raw messages per FR-011

- [X] T012 [P] [US1] Update `src/queries/foods.ts`: update `useFoodSearchQuery` (or equivalent TanStack Query hook) to accept `keyword` and `page` params and return new response shape `{ results: FoodSearchResultItem[], pagination: SearchPagination }`; create `src/queries/food-detail.ts` with `useFoodDetailQuery(fatSecretId: string)` calling `GET /api/foods/detail?fatSecretId=...` — both hooks are exported for use in the parent page only

- [X] T013 [US1] Identify the parent page that renders `food-search.tsx` (search `src/app/` for the page file importing or rendering the component); move `useFoodSearchQuery` call from the component into that page; pass `results`, `pagination`, `isLoading`, `error`, and `onSelectFood` as props to `food-search.tsx` — the page owns all data fetching per constitution TanStack Query rule. **Fallbacks**: if `food-search.tsx` is rendered on multiple pages, apply the props pattern to each page individually; if no parent page file exists yet, create `src/app/[route]/page.tsx` first before refactoring the component

- [X] T014 [US1] Update `src/components/food-search.tsx` to be purely presentational — accepts props: `results: FoodSearchResultItem[]`, `pagination: SearchPagination`, `isLoading: boolean`, `error: string | null`, `onSelectFood: (fatSecretId: string) => void`; renders unified results list showing name, brandName (if present), thumbnail (omit image section if null — no placeholder per spec clarification), calories; renders pagination controls; renders loading/empty/error states using existing shadcn/ui patterns per constitution §3; uses `src/lib/api-error.ts` to parse and display API error responses

- [X] T015 [US1] Create `e2e/003-food-search.spec.ts` with Playwright E2E tests: (a) create/update `.env.test.local` with `USE_MOCK_FATSECRET=true` per quickstart.md §6 before writing the spec; (b) add a `beforeAll` setup step that seeds at least one food record directly into the test DB (`source='fatsecret'`, with a known name) to enable local-first ordering assertions; then write scenarios: (1) keyword search displays paginated results with name, calories, and pagination controls; (2) the seeded local food appears before FatSecret mock results on page 1; (3) navigating to page 2 shows next results without duplicates; (4) search with no matching food shows empty-results message; (5) query shorter than 3 characters is rejected with a validation error

**Checkpoint**: US1 complete and independently testable. Search returns paginated results with local-first ordering.

---

## Phase 4: User Story 2 — View Food Nutritional Detail (Priority: P2)

**Goal**: Users select a food from search results and view its complete nutritional profile — macros, micronutrients, all serving sizes with calculated values, and food images. All data is read from local DB (saved during search). FatSecret is NOT called from the detail endpoint.

**Independent Test**: Click any food in search results and verify: (1) full nutritional detail loads with `baseServing` values; (2) all alternate serving sizes appear with proportionally calculated macros; (3) food images display when available; (4) no image section renders when food has no images; (5) 404 returned for a `fatSecretId` not in local DB

- [X] T016 [US2] Add `getDetail(fatSecretId: string)` to `src/server/services/food-search.service.ts` — **local DB only, no FatSecret call**:
  - `findLocalBySourceId(fatSecretId)`: Drizzle query `WHERE source='fatsecret' AND source_id=$1` — must also check `calories IS NOT NULL` to ensure record is complete (saved from search path's `saveFatSecretFoodsAsync`)
  - If found with complete data: load `food_alt_measures` rows; compute proportional serving nutrition per plan.md Key Implementation Notes #5 (`value = base × servingWeight / 100`); load `food_photos` row for images
  - If not found (or found with null nutrition): throw `FoodNotFoundError` — **do not call FatSecret**
  - Return `FoodDetailResponse` per data-model.md Transient Types

- [X] T017 [US2] Create `src/app/api/foods/detail/route.ts` with a GET handler: validate `fatSecretId` (required string) using `src/lib/api-validation.ts`; session auth check returning 401; `foodSearchService.getDetail(fatSecretId)` call; return `{ food: FoodDetail }` on 200; return 404 with `{ success: false, error: "Food not found." }` when `FoodNotFoundError` is thrown; 400 for missing/invalid `fatSecretId`; 500 for unexpected errors — no 503 path (FatSecret is never called from this route)

- [X] T018 [US2] Update the parent page (identified in T013) to also own the detail query: call `useFoodDetailQuery` (from `src/queries/food-detail.ts`) with the selected `fatSecretId` (local state); pass `foodDetail`, `isDetailLoading`, `detailError`, and `onCloseDetail` as props to `food-search.tsx`; manage `selectedFatSecretId` as page-level state

- [X] T019 [US2] Update `src/components/food-search.tsx` to render the detail view using props: display `baseServing` nutrients (calories, protein, carbs, fat + available micros from `fullNutrients`); render `servings` array with description, weightGrams, and calculated macro values; render `images` section only when `images` is non-null (no placeholder per spec clarification); provide a back/close control that calls `onCloseDetail`; use `src/lib/api-error.ts` to display detail errors; add loading and error states per constitution §3

- [X] T020 [US2] Add US2 and US3 E2E scenarios to `e2e/003-food-search.spec.ts`: **US2** — (1) selecting a food from results shows complete nutritional detail with baseServing values; (2) all alternate serving sizes appear with calculated macros; (3) food image displays when available in mock data; (4) no image section when mock food has no images; (5) back/close returns to search results. **US3** — (6) configure mock to throw a network error on `searchFoods`, verify foods already in local DB (seeded in beforeAll) are returned normally; (7) search for a keyword not in local DB with the erroring mock and verify a user-friendly error message is shown (no raw error codes or stack traces)

**Checkpoint**: US1 and US2 both independently testable. Detail view shows complete nutrition, all servings, and conditional images.

---

## Phase 5: User Story 3 — Reliable Food Availability Under Error Conditions (Priority: P3)

**Goal**: When FatSecret is unavailable during search, local cached foods still return normally. New searches degrade gracefully with a user-friendly message. Detail endpoint is unaffected (reads local DB only).

**Independent Test**: Configure mock to throw a network error on `searchFoods`; verify: (1) foods already in local DB are returned normally; (2) search for unknown food shows a user-friendly error; (3) rate-limit events show a clear "try again later" message; (4) no raw error codes or stack traces ever reach the client

- [X] T021 [US3] Update `src/server/services/food-search.service.ts` error handling: wrap `fatSecretClient.searchFoods()` in try/catch — on failure, log `console.error('[FatSecret] search error:', err)` per FR-013 and return `{ fatSecretFoods: [], totalResults: localFoods.length }` so local results still surface; detect HTTP 429 rate-limit responses and log separately as `console.warn('[FatSecret] rate limit event')` per FR-013; note: `getDetail` has no FatSecret call to wrap

- [X] T022 [US3] Update `src/app/api/foods/search/route.ts` to catch errors from `foodSearchService.search()`: return 500 with `{ success: false, error: "Food search is temporarily unavailable. Please try again shortly." }` for unexpected failures; never expose raw error messages, stack traces, or FatSecret-specific codes per FR-011 and SC-006; use `src/lib/api-error.ts` pattern for consistent error shape

- [X] T023 [US3] Update `src/app/api/foods/detail/route.ts` to ensure all error branches use `{ success: false, error: "..." }` shape via `src/lib/api-error.ts`; confirm no FatSecret-specific error codes reach the client; 404 message should be human-readable ("Food details not found. Try searching for the food first.")

**Checkpoint**: All three user stories work and error conditions degrade gracefully.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, lint, performance check, and documentation cleanup.

- [X] T024 Verify no Nutritionix references remain: run `grep -r "nutritionix\|NUTRITIONIX\|nix_item_id\|nf_calories" src/ --include="*.ts" --include="*.tsx"` — expected output is empty per quickstart.md §7; fix any remaining references
- [X] T025 Run `npm test && npm run lint` and fix all failures
- [X] T026 [P] Performance validation: time `GET /api/foods/search?q=apple` with `curl -w "%{time_total}"` — local-only result must be ≤2s; FatSecret query must be ≤5s (SC-002); document results
- [X] T027 [P] Validate quickstart.md end-to-end: confirm DB migration applied (`medium` column present), search endpoint returns expected shape, `FATSECRET_ENABLED=false` returns empty local-only results
- [X] T028 Update `AGENTS.md`: replace all Nutritionix references (API name, env vars, project summary) with FatSecret equivalents per constitution header TODO
- [X] T029 Update three artifacts to reflect the detail-reads-local-only decision: (a) `specs/003-fatsecret-food-retrieval/spec.md` FR-009 — change "5–15 minutes" to "10 minutes (600 seconds)"; (b) `contracts/food-search.openapi.yaml` `/api/foods/detail` responses — remove the `503` response (FatSecret is never called from the detail route); (c) `specs/003-fatsecret-food-retrieval/plan.md` Service Architecture diagram — remove the FatSecret fallback branch from `getDetail` and document that detail reads local DB only and returns `FoodNotFoundError` when record is absent or incomplete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — T002 and T003 can run in parallel with T001
- **Foundational (Phase 2)**: Depends on Phase 1; T004, T005, T009 can run in parallel; T009 → T008 (sequential); T006 → T007 (sequential)
- **User Stories (Phase 3–5)**: All depend on Phase 2 completion
  - US1 (Phase 3) is MVP — complete before starting US2 or US3
  - US2 (Phase 4) depends on Phase 3 (detail view extends search results and parent page)
  - US3 (Phase 5) depends on Phase 3 and 4 (hardens existing service and routes)
- **Polish (Phase 6)**: Depends on all user story phases being complete

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational — no story dependencies
- **US2 (P2)**: Starts after US1 — T018 extends the parent page work done in T013; T019 extends food-search.tsx from T014
- **US3 (P3)**: Starts after US1 and US2 — wraps existing service methods and route handlers

### Within Each User Story

- US1: T010 (service) → T011 (route) → T012 [P] (query hooks) → T013 (parent page) → T014 (component) → T015 (E2E)
- US2: T016 (extend service) → T017 (route) → T018 (parent page) → T019 (component) → T020 (E2E)
- US3: T021 (service errors) → T022 (search route errors) → T023 (detail route errors)

### Parallel Opportunities

- T002, T003 parallel with T001 (Phase 1)
- T004, T005, T009 parallel within Phase 2
- T012 parallel with T011 within Phase 3 (different files)
- T026, T027 parallel within Phase 6

---

## Parallel Example: User Story 1

```bash
# After T010 (service) completes, launch T011 and T012 in parallel:
Task T011: "Replace src/app/api/foods/search/route.ts"       # [P] with T012
Task T012: "Update src/queries/foods.ts + create food-detail.ts"  # [P] with T011

# Then sequentially after both T011 and T012 complete:
Task T013: "Move useFoodSearchQuery to parent page"
Task T014: "Update food-search.tsx to be presentational"
Task T015: "Create e2e/003-food-search.spec.ts (US1 scenarios)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (T009 before T008)
3. Complete Phase 3: User Story 1 including E2E
4. **STOP and VALIDATE**: Search for "apple", verify paginated results with local-first ordering and E2E green
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. User Story 1 → working search + E2E → **MVP**
3. User Story 2 → food detail view + E2E → richer experience
4. User Story 3 → error resilience → production-ready
5. Polish → fully validated feature

---

## Notes

- [P] tasks = different files, no inter-task dependencies
- [Story] label maps task to the user story it delivers
- **FatSecret is only called from the search path** — `saveFatSecretFoodsAsync` saves nutrition and images directly from v5 search results (`food_attributes.macros` + `food_images`); `getFoodById` is never called; the detail endpoint reads local DB only
- `onConflictDoNothing()` handles concurrent save race conditions silently (FR-004)
- **food-search.tsx is purely presentational** — all TanStack Query hooks live in the parent page per constitution rule
- Single-result FatSecret quirk: always normalize `food`/`serving`/`image` to array before processing (plan.md Notes #1)
- Commit after each phase or logical group; use Conventional Commits format (`feat:`, `fix:`, `chore:`, etc.) per constitution Development Workflow
