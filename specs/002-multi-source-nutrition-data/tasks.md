# Implementation Tasks: FatSecret-First Nutrition Data (USDA Fallback)

**Branch**: `002-multi-source-nutrition-data`
**Created**: 2026-01-26
**Plan**: [plan.md](./plan.md)

## Phase Overview

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1.1-1.2 | Types + source contract |
| 2 | 2.1-2.6 | Core implementation (FatSecret-first, USDA fallback, persistence, images) |
| 3 | 3.1-3.3 | Tests + docs |

---

## Phase 1: Types and Interfaces

### Task 1.1: Define Shared Nutrition Source Types

**Status**: [x] Completed

**Files**:
- `src/lib/nutrition-sources/types.ts`

**Acceptance Criteria**:
- [x] Shared normalized type(s) for search results
- [x] Search supports pagination options
- [x] Source status metadata is represented

---

### Task 1.2: Update FoodSource Type

**Status**: [x] Completed

**Files**:
- `src/types/food.ts`

**Acceptance Criteria**:
- [x] `FoodSource` includes `fatsecret`, `usda`, `database`, `user_custom`
- [x] Legacy/unused sources removed

---

## Phase 2: Core Implementation

### Task 2.1: FatSecret REST Search (IDs First) + Pagination

**Status**: [x] Completed

**Files**:
- `src/lib/nutrition-sources/fatsecret.ts`

**Acceptance Criteria**:
- [x] Search uses FatSecret REST search endpoint
- [x] Supports pagination (page/pageSize mapped to FatSecret fields)
- [x] Search results are lightweight (no details call)

---

### Task 2.2: FatSecret Details on Selection

**Status**: [x] Completed

**Files**:
- `src/lib/nutrition-sources/fatsecret.ts`
- `src/lib/nutrition-sources/aggregator.ts` (persistence)

**Acceptance Criteria**:
- [x] Details endpoint called only when persisting/logging a selected food
- [x] Prefer 100g serving when available; otherwise first serving
- [x] Persist remaining servings as alt measures

---

### Task 2.3: USDA Fallback Only

**Status**: [x] Completed

**Files**:
- `src/lib/nutrition-sources/aggregator.ts`
- `src/lib/nutrition-sources/usda.ts`

**Acceptance Criteria**:
- [x] USDA is queried only if FatSecret fails or returns empty

---

### Task 2.4: Search Endpoint

**Status**: [x] Completed

**Files**:
- `src/app/api/foods/search/route.ts`

**Acceptance Criteria**:
- [x] Search supports `q`, `page`, `pageSize`

---

### Task 2.5: Food Image Scrape Endpoint + LRU Cache

**Status**: [x] Completed

**Files**:
- `src/app/api/foods/image/route.ts`
- `src/lib/nutrition-sources/food-image.ts`

**Acceptance Criteria**:
- [x] Accepts `food_url` and returns scraped `imageUrl`
- [x] Scrapes first `<img>` inside `<table class="generic">`
- [x] LRU cache max 1000 entries
- [x] SSRF mitigation via host allowlist

---

### Task 2.6: Persist Photo + Alt Measures When Logging

**Status**: [x] Completed

**Files**:
- `src/lib/nutrition-sources/aggregator.ts` (persistFood)
- `src/server/db/schema.ts` (tables already exist)

**Acceptance Criteria**:
- [x] When persisting FatSecret foods, store base serving + alt measures
- [x] If `food_url` exists, scrape image and upsert into `food_photos`

---

## Phase 3: Tests + Docs

### Task 3.1: Update E2E Tests

**Status**: [x] Completed

**Files**:
- `e2e/phase-2-food-logging.spec.ts`

**Acceptance Criteria**:
- [x] Mock-mode E2E covers search and logging flow

---

### Task 3.2: Update Feature Docs (spec/plan/tasks/analysis)

**Status**: [x] Completed

**Files**:
- `specs/002-multi-source-nutrition-data/spec.md`
- `specs/002-multi-source-nutrition-data/plan.md`
- `specs/002-multi-source-nutrition-data/tasks.md`
- `specs/002-multi-source-nutrition-data/analysis.md`

**Acceptance Criteria**:
- [x] Remove legacy source references
- [x] Describe FatSecret-first + USDA fallback behavior
- [x] Describe details-on-selection + image scraping

---

### Task 3.3: Manual Verification

**Status**: [ ] Not Started

**Checklist**:
- [x] Search a common food and confirm results
- [x] Search a branded food and confirm results
- [x] Log a FatSecret food and confirm alt measures + photo
- [x] Call `/api/foods/image` with a valid FatSecret `food_url`

---

### Task 3.4: Food Search Floating Results UX

**Status**: [x] Completed

**Files**:
- `src/components/food-search/**`

**Acceptance Criteria**:
- [x] Search results appear in a floating dropdown under the input
- [x] Keyboard shortcut supported: Esc clears search/closes panel
- [x] Tabs remain available for Common/Branded/Custom
- [x] Infinite scroll triggers load-more automatically when near bottom
- [x] Full-width "Load more" button remains as a fallback at the bottom
- [x] Result rows show a compact single-row macro summary with icons

---

### Task 3.5: Food Search Self-Contained + Nutrition Facts Panel

**Status**: [x] Completed

**Files**:
- `src/components/food-search.tsx`
- `src/components/nutrition-facts.tsx`
- `src/app/(dashboard)/food-log/page.tsx`
- `src/app/api/foods/persist/route.ts`
- `src/queries/foods.ts`

**Acceptance Criteria**:
- [x] FoodSearch owns query/loading/infinite scroll and image enrichment
- [x] Selecting a food persists it and loads alt measures
- [x] Nutrition Facts rendered via dedicated component with serving select, grams input, slider, computed macros
- [x] Meal selection removed; food log defaults to breakfast

---

### Task 3.6: Food Selection Dialog UX (shadcn Dialog)

**Status**: [x] Completed

**Files**:
- `src/components/food-search.tsx`
- `src/components/nutrition-facts.tsx`
- `src/components/ui/dialog.tsx`

**Acceptance Criteria**:
- [x] Clicking a search result opens a Dialog with food details
- [x] Dialog contains a Card header with image + title + brand (if any)
- [x] Dialog body contains the Nutrition Facts table and controls
- [x] Dialog footer contains Cancel and Add buttons
- [x] Removed custom click-outside/Radix attribute heuristics from the dropdown flow
