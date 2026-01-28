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
- [ ] Search a common food and confirm results
- [ ] Search a branded food and confirm results
- [ ] Log a FatSecret food and confirm alt measures + photo
- [ ] Call `/api/foods/image` with a valid FatSecret `food_url`
