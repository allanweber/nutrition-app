# Analysis: FatSecret-First Nutrition Data (USDA Fallback)

**Created**: 2026-01-26
**Status**: Post-implementation doc alignment

## Executive Summary

The implementation is aligned to the updated direction:

- **FatSecret is primary** for search.
- **USDA is fallback-only**.
- **Details are fetched only on selection/logging** (reduces FatSecret calls).
- **Image scraping** from `food_url` is supported via a dedicated endpoint with **LRU(1000)** cache and host allowlist.

## Key Design Checks

### 1) Rate-limit strategy (FatSecret-first)

- Search uses the **FatSecret search endpoint** (cheap, returns IDs).
- Details calls are deferred until selection/logging, reducing request volume.
- Search caching (LRU) further reduces repeat requests.

### 2) Data correctness (servings)

- The persistence path prefers a **100g serving** when present.
- Other servings are stored in `food_alt_measures` as gram weights to support unit conversions.

### 3) Security (SSRF on image scraping)

Image scraping is inherently SSRF-sensitive.

Mitigations required:
- Reject non-URL values.
- Restrict hosts to FatSecret-owned domains.
- Do not follow redirects to untrusted hosts.

The current approach uses a host allowlist and caches failures to reduce repeated fetches.

## Remaining Risks / Follow-ups

1. **FatSecret HTML changes**: image scraping depends on FatSecret page structure (`<table class="generic">`). If FatSecret changes HTML, scraping may break.
2. **Image cache size**: LRU(1000) is correct per requirements, but consider memory impact in long-lived server processes.
3. **USDA as fallback**: fallback behavior should be validated with real credentials (non-mock mode).
4. **Manual verification**: confirm that logging a FatSecret item writes `food_photos` and `food_alt_measures` as expected.

## Recommended Smoke Tests

- `GET /api/foods/search?q=cheerios&page=0&pageSize=25`
- `GET /api/foods/image?food_url=<fatsecret-food-url>`

