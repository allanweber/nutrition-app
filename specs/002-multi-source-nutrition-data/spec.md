# Feature Specification: FatSecret-First Nutrition Data (USDA Fallback)

**Feature Branch**: `002-multi-source-nutrition-data`
**Created**: 2026-01-26
**Status**: Implemented (docs aligned)

## Summary

Replace the Nutritionix-only integration with a **FatSecret-first** nutrition data system:

- **FatSecret is the primary external source** for search.
- **USDA is a fallback-only external source** (used when FatSecret is unavailable or returns empty).
- **Food details are fetched only when a user selects/logs a food** (search returns lightweight results).
- **Food images are scraped from `food_url`** using a dedicated endpoint with an **LRU cache (max 1000)**.
- **Serving selection rules**:
  - Use **100g serving** if available.
  - Otherwise use the **first available serving**.
  - Persist all other servings into `food_alt_measures`.

## Clarifications

### Session 2026-01-26/27 (Updated Direction)
- Q: Which source is primary? → **A: FatSecret.**
- Q: When is USDA used? → **A: Only when FatSecret fails or returns zero foods.**
- Q: Should we fetch FatSecret details during search? → **A: No.** Search returns IDs; details fetched on selection/logging.
- Q: Do we need pagination for FatSecret search? → **A: Yes.**
- Q: How do we get images? → **A: Scrape first `<img>` inside `<table class="generic">` from FatSecret `food_url`, cache results (LRU max 1000).**

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Search Foods (FatSecret-first) (P1)

As a user, I want to search for foods and see results quickly so I can choose an item to log.

**Independent Test**: Search for a branded item (e.g., “cheerios”) and see results returned with pagination.

**Acceptance Scenarios**:

1. Given I search for “cheerios”, when results load, then the system uses FatSecret search and returns foods within 3 seconds.
2. Given FatSecret returns 0 results or errors, when searching, then USDA is used as fallback.
3. Given I request the next page, when `page` is incremented, then results are returned for that page and `hasMore` indicates more pages.

### User Story 2 — Log a Food (Details on Selection) (P1)

As a user, I want accurate nutrition values and serving options when I select a food, so my log entry is correct.

**Independent Test**: Search, select a FatSecret food, log it; verify DB has the chosen serving + alt measures.

**Acceptance Scenarios**:

1. Given I select a FatSecret search result, when I log it, then the server fetches FatSecret food details by ID.
2. Given FatSecret details include a 100g serving, when persisting, then the base serving is stored as 100g.
3. Given FatSecret details include other servings, when persisting, then those are stored in `food_alt_measures` with gram weights.

### User Story 3 — Food Photo via `food_url` (P2)

As a user, I want foods to show an image when available to improve scanning and selection.

**Independent Test**: Log a FatSecret food with `food_url` and confirm `food_photos` is populated.

**Acceptance Scenarios**:

1. Given a FatSecret food has `food_url`, when persisting, then the system scrapes the first image under `<table class="generic">`.
2. Given the image endpoint is called repeatedly for the same `food_url`, when cached, then it returns without refetching HTML.
3. Given `food_url` is not a FatSecret-owned domain, when requesting an image, then the request is rejected.

## Requirements *(mandatory)*

### Functional Requirements

#### Data Sources

- **FR-001**: System MUST remove Nutritionix integration entirely.
- **FR-002**: System MUST use FatSecret as the primary external nutrition source for search.
- **FR-003**: System MUST use USDA FoodData Central only as a fallback when FatSecret fails or returns empty.
- **FR-004**: System MUST keep all API keys and OAuth credentials server-side.

#### Search & Pagination

- **FR-010**: System MUST expose search pagination via `page` and `pageSize`.
- **FR-011**: System MUST enforce a per-source timeout (3 seconds) and degrade gracefully.
- **FR-012**: System MUST use an in-memory LRU cache for search results (max 1000).
- **FR-013**: System MUST deduplicate combined results (DB + external) to avoid duplicates in the UI.

#### Details on Selection

- **FR-020**: System MUST NOT call FatSecret details during search.
- **FR-021**: System MUST fetch FatSecret details by ID only when a user selects/logs a food.

#### Serving Rules & Persistence

- **FR-030**: System MUST persist the base serving as 100g if available; otherwise the first serving.
- **FR-031**: System MUST persist additional servings into `food_alt_measures` in grams.

#### Food Images

- **FR-040**: System MUST provide an endpoint that accepts `food_url` and scrapes the first image under `<table class="generic">`.
- **FR-041**: The image scrape MUST be cached with an LRU cache (max 1000) and a long TTL.
- **FR-042**: The image scrape MUST restrict `food_url` to allowed hosts to mitigate SSRF.

### Key Entities

- **foods**: Stores canonical food info + macros.
- **food_photos**: Stores `thumb` and `highres` URLs (1:1 with foods).
- **food_alt_measures**: Stores alternative serving measures and gram weights (1:many with foods).

## Success Criteria *(mandatory)*

- **SC-001**: Search returns usable results within 3 seconds for typical queries.
- **SC-002**: Logging a FatSecret food persists base serving + alt measures and (when available) a photo.
- **SC-003**: Legacy nutrition source references are removed from source code and docs.
