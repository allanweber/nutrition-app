---

description: "Task list for Unified Food Search Field Component"
---

# Tasks: Unified Food Search Field Component

**Input**: Design documents from `/specs/004-food-search-field/`
**Branch**: `004-food-search-field`
**Generated**: 2026-03-19

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and delivered independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (Understand Existing Code)

**Purpose**: Read and understand the files being replaced or modified before making any changes. No code is written in this phase.

- [ ] T001 Read src/components/food-search.tsx to understand the component being replaced before deleting it
- [ ] T002 [P] Read src/app/(dashboard)/food-log/page.tsx to understand current search wiring and diary functionality
- [ ] T003 [P] Read src/queries/foods.ts and src/queries/food-detail.ts to confirm existing hooks are reused unchanged
- [ ] T004 [P] Read src/server/services/food-search.service.ts to confirm it is unchanged and filters only fatsecret foods
- [ ] T005 [P] Read src/proxy.ts to understand the existing proxy function and config.matcher before adding rate limiting

**Checkpoint**: Existing code understood — implementation can begin

---

## Phase 2: Foundational (Shared Building Blocks)

**Purpose**: Shared types and primitive sub-components that EVERY user story depends on. Must be complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Define shared TypeScript types in src/components/food-search-field/types.ts — export `UnifiedFoodSearchResultItem`, `FoodSearchState`, `FoodSearchFieldProps`, and `FoodAddModalProps` per data-model.md
- [ ] T007 [P] Create src/components/food-search-field/result-item.tsx — single food result row displaying thumbnail, name, brandName, calories, and query-term highlight; accepts `item: UnifiedFoodSearchResultItem`, `query: string`, `highlighted: boolean`, `onSelect: (item) => void`
- [ ] T008 [P] Create src/components/food-search-field/states.tsx — four named exports: `LoadingSkeleton` (shown after 500ms), `EmptyState` (no results found), `ErrorState` (with retry callback), `PromptState` ("Type at least 3 characters")

**Checkpoint**: Shared types and primitives ready — user stories can now be implemented

---

## Phase 3: User Story 1 — Food Log Search & Add to Diary (Priority: P1) 🎯 MVP

**Goal**: Authenticated users on `/food-log` can search for foods across Common, Branded, and Custom tabs, select a result, and add it to their diary via a modal.

**Independent Test**: Navigate to `/food-log` while authenticated, type "chicken", verify three tabs appear with results, click a result, confirm modal opens with meal type and serving selectors, confirm entry, verify food appears in diary. No other user story needs to be complete.

### Implementation for User Story 1

- [ ] T009 [P] [US1] Create src/queries/custom-foods.ts — export `useCustomFoodSearchQuery(query: string)` using TanStack Query v5; calls `GET /api/foods/custom/search?q={query}`; enabled only when `query.length >= 3`; 300ms debounce
- [ ] T010 [P] [US1] Create src/app/api/foods/custom/search/route.ts — `GET` handler; Zod validation (`q: z.string().min(3).max(200).transform(s => s.trim())`); BetterAuth session check (return 401 if unauthenticated); Drizzle query filtering `isCustom = true AND userId = session.user.id`; returns `{ results: [...] }` ordered by name, limited to 20; returns 400 on validation failure, 500 on DB error per contracts/api-foods-custom-search.md
- [ ] T011 [US1] Create src/components/food-search-field/tabs.tsx — tabbed result switcher with "Common", "Branded", and "Custom" tabs; each tab shows item count badge; `showCustomTab` prop hides Custom tab; renders `<ResultItem>` list for active tab using T007
- [ ] T012 [US1] Create src/components/food-search-field/dropdown.tsx — portal-positioned dropdown container; closes on outside click (`useEffect` + `mousedown` listener); renders history-list (when query=""), states (T008), or tabs (T011) based on current query and state
- [ ] T013 [US1] Create src/components/food-search-field/input.tsx — controlled text input with clear (×) button; accepts `value`, `onChange`, `onKeyDown`, `placeholder`, `className` props; shows clear button only when value is non-empty
- [ ] T014 [US1] Create src/components/food-search-field/index.tsx — `FoodSearchField` root client component; accepts `FoodSearchFieldProps`; manages `activeTab` and `highlightedIndex` state; wires `<SearchInput>` and `<Dropdown>` together; `onSelect` fires on result click; `Escape` clears input and closes dropdown (keyboard nav left minimal — full keyboard support added in US4)
- [ ] T015 [US1] Create src/components/food-log-add-modal.tsx — modal using TanStack Form v0; fields: meal type selector (using `MEAL_TYPE_LABELS` from `src/lib/nutrition-constants.ts`) and serving size selector populated from `useFoodDetailQuery`; `onAdded` callback fires after successful diary entry; uses existing shadcn/ui Dialog and Form components
- [ ] T016 [US1] Refactor src/app/(dashboard)/food-log/page.tsx — replace existing `FoodSearch` usage with `useFoodSearch({ includeCustom: true })` hook + `<FoodSearchField>` + `<FoodLogAddModal>`; existing diary display and diary entry functionality must remain unchanged (FR-016)
- [ ] T017 [US1] Delete src/components/food-search.tsx after verifying food-log/page.tsx works correctly with the new component; update any remaining imports

**Checkpoint**: US1 fully functional — authenticated users can search and add foods to diary

---

## Phase 4: User Story 2 — Anonymous Landing Page Search (Priority: P2)

**Goal**: Anonymous users on the landing page can search for foods (Common and Branded tabs only), select a result, and navigate to a publicly accessible SSR food details page.

**Independent Test**: Open incognito window, navigate to `/`, type "apple", verify only Common and Branded tabs appear, select a result, verify navigation to `/foods/[fatSecretId]`, inspect page source to confirm food name and nutritional data are present in the initial HTML.

### Implementation for User Story 2

- [ ] T018 [P] [US2] Create src/components/landing/search-section.tsx — `'use client'` component; owns `useFoodSearch({ includeCustom: false })` query state; renders `<FoodSearchField showCustomTab={false} onSelect={navigateToFoodDetail} />`; `onSelect` calls `router.push('/foods/' + item.fatSecretId)` for FatSecret foods
- [ ] T019 [US2] Update src/app/page.tsx — import and render `<SearchSection>` in the landing page body; landing page remains an RSC; `SearchSection` is the interactive client boundary
- [ ] T020 [US2] Create src/app/foods/[fatSecretId]/page.tsx — RSC page per contracts/page-foods-detail.md; `generateMetadata` export for SEO title/description/OpenGraph; data resolution: Drizzle DB query first (`WHERE sourceId = :fatSecretId`), FatSecret API fallback on miss; renders food title (`<h1>`), brand name (if present), images, calories, macros, and extended nutrients; error page with "Search for a food →" link if both sources fail
- [ ] T021 [US2] Add rate limiting to src/proxy.ts — in-memory sliding-window `Map<string, { count: number; resetAt: number }>` tracking per-IP; limit: 60 requests/minute; applies to `/foods/**` and `/api/foods/search` paths; rate limit check placed BEFORE the `auth.api.getSession()` call; returns `429 Too Many Requests` with `Retry-After: 60` header when exceeded; cleanup stale entries on each check

**Checkpoint**: US2 fully functional — anonymous users can search and view food details from landing page

---

## Phase 5: User Story 3 — Search History & Autocomplete Suggestions (Priority: P3)

**Goal**: Returning users see their recent search history on input focus and get autocomplete suggestions while typing, both sourced from `localStorage`.

**Independent Test**: Perform 3 different searches, focus the input — 3 history entries appear most-recent-first. Type a partial word matching a prior search — suggestion appears. Click a history entry — search executes immediately. Wait 31 days (or set `lastAccessedAt` to stale date in localStorage) — entry no longer appears.

### Implementation for User Story 3

- [ ] T022 [US3] Create src/hooks/use-search-history.ts — localStorage hook; key `fsf-search-history`; reads and filters expired entries (> 30 days) on mount; exposes: `history: SearchHistoryEntry[]`, `addEntry(term)`, `clearHistory()`; `addEntry` deduplicates by `normalizedTerm` (lowercase), moves existing entry to front with updated `lastAccessedAt`, or prepends new entry and trims to 30; writes to localStorage after every mutation
- [ ] T023 [P] [US3] Create src/components/food-search-field/history-list.tsx — renders up to 5 most-recent `SearchHistoryEntry` items as clickable rows with a clock icon; `onSelect(term: string)` prop fires when entry is clicked; shown by `<Dropdown>` when `query === ""` and history is non-empty
- [ ] T024 [P] [US3] Create src/components/food-search-field/suggestions.tsx — renders up to 5 autocomplete suggestions; sources: partial matches from `history` entries + current result titles that start with the query; shown inside dropdown when `query.length >= 1`; `onSelect(term: string)` prop fires on suggestion click
- [ ] T025 [US3] Update src/components/food-search-field/index.tsx — integrate `useSearchHistory` hook; pass `history` to `<Dropdown>` and `<Suggestions>`; call `addEntry(query)` when a search result is selected; pass `onSelect` from history-list and suggestions to set query and trigger search

**Checkpoint**: US3 fully functional — history appears on focus, suggestions appear on typing

---

## Phase 6: User Story 4 — Keyboard Navigation (Priority: P4)

**Goal**: Power users can navigate search results entirely with ↓/↑/Enter/Escape, without mouse interaction.

**Independent Test**: Type "egg" in the food log search field, press ↓ twice (3rd result highlighted), press ↑ once (2nd result highlighted), press Enter (modal opens for highlighted food), press Escape (search field cleared and dropdown closed).

### Implementation for User Story 4

- [ ] T026 [US4] Update src/components/food-search-field/index.tsx — add `highlightedIndex` state (default: -1); add `handleKeyDown` that maps ArrowDown (+1, wrap), ArrowUp (-1, return to -1 at top), Enter (fire `onSelect` with highlighted item), Escape (clear query, set highlightedIndex to -1, close dropdown); pass `highlightedIndex` down to `<Dropdown>` → `<Tabs>` → `<ResultItem>`
- [ ] T027 [US4] Update src/components/food-search-field/input.tsx — add `onKeyDown` prop; pass `handleKeyDown` from parent; ensure ArrowDown/ArrowUp do not move browser cursor in the text input (`event.preventDefault()` for those keys)
- [ ] T028 [US4] Update src/components/food-search-field/result-item.tsx — add `highlighted: boolean` prop; apply visual highlight style (e.g. shadcn/ui `bg-accent`) when `highlighted === true`
- [ ] T029 [US4] Update src/components/food-search-field/tabs.tsx — accept `highlightedIndex` and pass it to each `<ResultItem>` with the correct per-tab offset so the global index maps to the correct item in the active tab

**Checkpoint**: US4 fully functional — full keyboard navigation works without mouse

---

## Final Phase: Polish & Validation

**Purpose**: Verify the whole feature works end-to-end and no regressions exist.

- [ ] T030 Write Playwright E2E tests in e2e/004-food-search-field.spec.ts covering all 4 user stories per the scenarios in quickstart.md: P1 food log search + add to diary, P2 anonymous landing page search + food detail page, P3 search history (focus shows history, typing shows suggestion, click executes), P4 keyboard navigation (arrows highlight, Enter selects, Escape clears)
- [ ] T031 Run `npm test && npm run lint` and fix any type errors or lint violations introduced by this feature
- [ ] T032 Verify `npm run test:e2e -- --grep "004"` passes for all 4 user story flows

---

## Dependencies

```
Phase 2 (Foundation)
  └─ Phase 3 (US1) — requires T006 (types), T007 (result-item), T008 (states)
       └─ Phase 4 (US2) — requires T014 (FoodSearchField), T015 (modal) complete
       └─ Phase 5 (US3) — requires T014 (FoodSearchField index) to integrate history into
       └─ Phase 6 (US4) — requires T013 (input), T014 (index), T007 (result-item), T011 (tabs)
  └─ Final Phase — requires all US1–US4 phases complete
```

**Cross-story parallel opportunities**:
- T009 (custom-foods query) and T010 (custom search API route) can run in parallel — different files
- T018 (SearchSection) can begin as soon as T014 (FoodSearchField) is complete — different file
- T023 (history-list) and T024 (suggestions) can run in parallel — different files
- T027 (input keyboard), T028 (result-item highlight) can run in parallel — different files

---

## Implementation Strategy

**MVP (Phase 3 only)**: Deliver US1 first — authenticated food log search and add-to-diary is the core daily-use case and can be shipped independently before US2–US4.

**Increment 2**: US2 (landing page + food details page + rate limiting) — enables search engine discoverability.

**Increment 3**: US3 (search history) — reduces friction for repeat users; purely additive to the existing component.

**Increment 4**: US4 (keyboard navigation) — additive polish pass on the already-working component.

**Total tasks**: 32
**Tasks per user story**: US1 = 12 (T006–T017), US2 = 4 (T018–T021), US3 = 4 (T022–T025), US4 = 4 (T026–T029)
**Setup/Foundation**: 8 (T001–T008)
**Polish**: 3 (T030–T032)
