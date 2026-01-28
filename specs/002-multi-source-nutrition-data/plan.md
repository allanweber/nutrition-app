# Implementation Plan: FatSecret-First Nutrition Data (USDA Fallback)

**Branch**: `002-multi-source-nutrition-data` | **Date**: 2026-01-26 | **Spec**: `/specs/002-multi-source-nutrition-data/spec.md`

## Summary

Implement a nutrition data integration that:

- Uses **FatSecret as the primary source** for search.
- Uses **USDA FoodData Central as fallback only** when FatSecret fails/returns empty.
- **Fetches FatSecret details only on selection/logging** (search returns lightweight results).
- Scrapes and stores food images from `food_url` via a dedicated endpoint with an **LRU cache (max 1000)**.
- Persists a base serving (prefer **100g**) and stores remaining servings as `food_alt_measures`.

## Technical Context

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **DB**: Postgres (Drizzle ORM)
- **Validation**: Zod + `src/lib/api-validation.ts`
- **Client Data Fetching**: TanStack Query
- **Testing**: Playwright E2E

## Project Structure (Key Files)

```text
src/
  lib/
    nutrition-sources/
      types.ts              # normalized source interfaces
      cache.ts              # LRU caches (search + image)
      fatsecret.ts          # FatSecret REST search + details
      usda.ts               # USDA search (fallback)
      aggregator.ts         # DB → FatSecret → USDA fallback orchestration
      food-image.ts         # food_url -> image scrape + LRU cache + SSRF allowlist
      mock-sources.ts       # E2E mock sources
  app/
    api/
      foods/
        search/route.ts     # search endpoint (pagination)
        image/route.ts      # scrape image from food_url
      food-logs/route.ts    # logs; persists foods on selection
```

## Design Notes

### Source Priority & Execution Model

- **Database**: always checked first (fast)
- **FatSecret**: primary external source
- **USDA**: fallback-only external source (only if FatSecret errors/empty)

### Search Flow

`GET /api/foods/search?q=...&page=...&pageSize=...`

1. Query DB first (ILIKE/lowercase index).
2. Query FatSecret search using `page`/`pageSize`.
3. If FatSecret fails or returns empty, query USDA search.
4. Merge + dedupe + return a stable paginated slice, with `hasMore`.
5. Cache results in-memory (LRU) keyed by query.

### Details & Persistence Flow (on selection/logging)

When the user selects a food from search and logs it:

1. If the food is from FatSecret, call FatSecret **details endpoint** by food ID.
2. Choose serving:
   - Prefer a **100g** serving if present.
   - Otherwise use the **first** serving.
3. Persist base food to `foods`.
4. Persist remaining servings into `food_alt_measures`.
5. If `food_url` exists, scrape image URL (in parallel) and upsert into `food_photos`.

### Food Image Scrape Endpoint

`GET /api/foods/image?food_url=...`

- Scrapes the **first `<img>`** after `<table class="generic">` from the HTML.
- Uses an **LRU cache (max 1000)** with long TTL (30 days) for `food_url → imageUrl`.
- Restricts allowed hosts to FatSecret-owned domains to mitigate SSRF.

## Testing

- E2E tests must validate:
  - Search works (mock mode)
  - Logging a food persists base + alt measures
  - Image endpoint rejects unsupported hosts

## Implementation Order

1. Update source adapters and types (remove any legacy source references).
2. Implement FatSecret REST search + pagination.
3. Implement details-on-selection persistence (serving rules + alt measures).
4. Implement USDA fallback-only behavior.
5. Implement `food_url` scrape endpoint and caching.
6. Update queries/UI + E2E tests.
7. Update docs/README/Postman.
