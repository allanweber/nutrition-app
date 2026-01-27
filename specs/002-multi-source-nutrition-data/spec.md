# Feature Specification: Multi-Source Nutrition Data Aggregation

**Feature Branch**: `002-multi-source-nutrition-data`
**Created**: 2026-01-26
**Status**: Draft
**Input**: User description: "Replace expensive Nutritionix-only integration with a multi-source nutrition data aggregation system that queries free/affordable APIs in parallel (USDA FoodData Central, OpenFoodFacts, FatSecret, Spoonacular, Edamam, etc.) to provide accurate, comprehensive nutrition information"

## Clarifications

### Session 2026-01-26

- Q: Should we completely remove Nutritionix integration, or keep it as an optional/fallback source? → **A: Remove Nutritionix entirely.**
- Q: What is the acceptable latency for food search results? → **A: Progressive loading - show cached/local results instantly, stream API results as they arrive, hard timeout at 3 seconds.**
- Q: Should we cache all external API results in the database, or only when a user logs the food? → **A: Cache all search results for maximum API cost savings and faster repeat searches.**
- Q: What is the budget for paid APIs? → **A: Free only ($0) - use USDA + OpenFoodFacts + FatSecret free tier.**
- Q: Should conflicting nutrition data from multiple sources be averaged, prioritized by source quality, or shown to users for selection? → **A: Prioritize by source quality (USDA > OpenFoodFacts > FatSecret).**
- Q: Do you need barcode scanning support? → **A: Yes, include barcode scanning in phase 1.**
- Q: Should recipe parsing (Zestful) be included in phase 1? → **A: No, defer recipe parsing to a later phase.**
- Q: When should foods from external APIs be saved to database? → **A: Immediately when retrieved from external source (not waiting for user to log).**
- Q: What is the search order/hierarchy? → **A: 1) In-memory cache (limited size), 2) Database, 3) External APIs (in parallel). Memory cache + DB are checked first, then APIs queried in parallel.**
- Q: Should source transparency be user-facing? → **A: No, source attribution is for database logging purposes only, not displayed to the user in the UI.**
- Q: Should Zestful, Edamam, and Spoonacular be considered for future phases? → **A: No, discard these sources entirely - they are out of scope for this feature.**
- Q: How should USDA API rate limits be handled? → **A: Execute USDA searches server-side to avoid exposing API key in client bundle. Rate limits (1,000/hr/IP) apply to the server IP.**
- Q: Should barcode scanning use camera or manual entry? → **A: Manual UPC entry for phase 1. Camera integration deferred to future phase.**
- Q: What database search strategy should be used? → **A: ILIKE with lowercase index for prefix optimization. Simple and sufficient for initial scale.**
- Q: Should users be able to browse foods by category (e.g., Fruits, Vegetables)? → **A: No, foods are searched by name only. Category browsing removed from scope.**

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search and Log Food with Multi-Source Data (Priority: P1)

As a user tracking my nutrition, I want to search for foods and get accurate nutritional data aggregated from multiple trusted sources so I can log my meals with confidence in the data quality.

**Why this priority**: Core value proposition - replaces the expensive single-source (Nutritionix) dependency with free/cheaper alternatives while improving data accuracy through multi-source validation.

**Independent Test**: User searches for "apple", receives results from multiple sources (USDA, OpenFoodFacts), selects one, and logs it. The food is saved to the database with source attribution.

**Acceptance Scenarios**:

1. **Given** I am on the food logging page, **When** I search for "chicken breast", **Then** I see results within 3 seconds aggregated from multiple sources.
2. **Given** search results are returned from external APIs, **When** results are received, **Then** all foods are immediately saved to the database (before user selection).
3. **Given** search results are displayed, **When** I select a food item, **Then** I see comprehensive nutrition data (calories, protein, carbs, fat, fiber, sugar, sodium, and micronutrients if available).
4. **Given** I select a food item, **When** I log it to my meal, **Then** the food log references the already-persisted food record in the database.
5. **Given** a food exists in multiple sources with different nutrition values, **When** I view the food details, **Then** I see the prioritized data (USDA > OpenFoodFacts > FatSecret).

---

### User Story 2 - View Cached Foods Without API Calls (Priority: P1)

As a user, I want previously searched foods to be available instantly from the local cache and database so I can quickly log frequently eaten foods without waiting for external API calls.

**Why this priority**: Improves user experience (instant results) and reduces API costs by caching food data locally.

**Independent Test**: User searches for "banana" (first time - fetches from APIs and saves to DB), then searches again later and gets instant results from cache/DB before API results arrive.

**Acceptance Scenarios**:

1. **Given** I search for any food, **When** the search executes, **Then** the system checks in order: 1) in-memory cache, 2) database, 3) external APIs (in parallel).
2. **Given** I previously searched for "banana", **When** I search for "banana" again, **Then** I see cached/database results immediately (< 100ms) while external APIs are queried in parallel.
3. **Given** external APIs return new results, **When** results arrive, **Then** they are merged with cached/database results and new foods are saved to the database.
4. **Given** the in-memory cache grows large, **When** the cache limit is reached (e.g., 1000 items), **Then** older entries are evicted (LRU strategy) to prevent memory issues.
5. **Given** I want fresh data for a cached food, **When** I tap a "refresh" action, **Then** the system re-fetches from external sources and updates both cache and database.

---

### User Story 3 - Lookup Food by Barcode (Priority: P2)

As a user logging packaged foods, I want to enter a barcode/UPC to quickly find the exact product with accurate nutrition data from barcode-enabled sources (OpenFoodFacts, FatSecret).

**Why this priority**: Barcode lookup is a common use case for packaged foods and provides exact product matching.

**Independent Test**: User enters a UPC (e.g., for Cheerios), receives matching product with nutrition data from OpenFoodFacts or FatSecret.

**Acceptance Scenarios**:

1. **Given** I am on the food logging page, **When** I enter a valid UPC in the barcode field and submit, **Then** I see the matching product with full nutrition details within 2 seconds.
2. **Given** a barcode is not found in any source, **When** I submit it, **Then** I see a "Product not found" message with an option to search by name instead.
3. **Given** a barcode matches multiple sources, **When** I submit it, **Then** I see the best match (prioritized by data completeness).

*Note: Camera-based barcode scanning is deferred to a future phase.*

---

### User Story 4 - Track Data Sources for Database Logging (Priority: P3)

*Note: Category browsing removed from scope. All foods are searched by name only.*

As a system administrator/developer, I want all food records to track their data source for auditing, debugging, and data quality purposes.

**Why this priority**: Source tracking enables data quality monitoring, debugging, and future improvements to source prioritization.

**Independent Test**: Query the database and verify all food records have a valid `source` field populated.

**Acceptance Scenarios**:

1. **Given** a food is retrieved from an external API, **When** it is saved to the database, **Then** the `source` field is set to the API name (usda, openfoodfacts, fatsecret).
2. **Given** a food exists in multiple sources, **When** it is saved, **Then** the highest-priority source's data is used and that source is recorded.
3. **Given** I am viewing food details in the UI, **When** I look at the food, **Then** the source is NOT displayed (internal tracking only).
4. **Given** a user creates a custom food, **When** it is saved, **Then** the `source` field is set to "user_custom".

---

### User Story 6 - Fallback Gracefully When APIs Fail (Priority: P3)

As a user, I want the app to continue working even when external nutrition APIs are unavailable, using cached data and remaining sources.

**Why this priority**: Reliability is critical for daily tracking; users should not be blocked by API outages.

**Independent Test**: Simulate API failure for USDA, verify OpenFoodFacts and cached data still work, and user sees appropriate messaging.

**Acceptance Scenarios**:

1. **Given** one nutrition API is down, **When** I search for food, **Then** I still see results from other available sources and cached data.
2. **Given** all external APIs are down, **When** I search for food, **Then** I see cached results (if available) with a notice about limited connectivity.
3. **Given** an API call fails, **When** results load, **Then** I see a subtle indicator showing which sources were unavailable.

---

### Edge Cases

- User searches for a food that exists only in one source (e.g., a niche brand in OpenFoodFacts only).
- User searches for a non-food item (e.g., "Nike shoes") - should return empty results gracefully.
- API rate limits are hit mid-search - gracefully degrade to available sources.
- Barcode scan returns multiple products (same UPC in different regions).
- User is offline - show only cached results with offline indicator.
- Nutrition data has missing fields (e.g., fiber not reported by source) - display "N/A" or omit.
- Very long food names or brand names from external APIs - truncate appropriately.
- Duplicate results across sources for the same food - deduplicate intelligently.
- User searches with special characters or non-English text.

## Requirements *(mandatory)*

### Functional Requirements

#### Data Sources & Integration

- **FR-001**: System MUST integrate with USDA FoodData Central API as the primary free, authoritative source for whole foods and branded products. USDA searches MUST be executed server-side to protect the API key.
- **FR-002**: System MUST integrate with OpenFoodFacts API as a secondary free source for branded/packaged foods with barcode support.
- **FR-003**: System MUST integrate with FatSecret Platform API (free tier: 5,000 calls/day) for additional branded food coverage and barcode support.
- **FR-004**: System MUST remove the existing Nutritionix integration entirely.
- **FR-005**: System MUST support adding new data sources via a pluggable adapter pattern.

#### Search & Aggregation

- **FR-006**: System MUST implement a tiered search hierarchy: 1) in-memory cache, 2) database, 3) external APIs (in parallel).
- **FR-007**: System MUST check in-memory cache first and return results instantly (< 10ms) if found.
- **FR-008**: System MUST query database second and return results quickly (< 100ms) if found.
- **FR-009**: System MUST query external APIs in parallel while cache/database results are being displayed.
- **FR-010**: System MUST progressively render API results as each source responds (streaming UX).
- **FR-011**: System MUST enforce a hard timeout of 3 seconds - display whatever results are available.
- **FR-012**: System MUST deduplicate results when the same food appears in multiple sources (using name + brand matching).
- **FR-013**: System MUST prioritize data from more authoritative sources (USDA > OpenFoodFacts > FatSecret).
- **FR-014**: System MUST NOT display source attribution in the UI (source is for internal database tracking only).

#### Data Normalization

- **FR-015**: System MUST normalize nutrition data to a standard schema: name, brand, serving_size, calories, protein, carbs, fat, fiber, sugar, sodium, full_nutrients (JSON).
- **FR-016**: System MUST store the `isRaw` flag for unprocessed/whole foods (available from USDA Foundation Foods).
- **FR-017**: System MUST support alternative serving measures when provided by the source.
- **FR-018**: System MUST store the original source and source_id for each food record (for internal tracking, not user display).

#### Caching & Persistence

- **FR-019**: System MUST save ALL foods returned from external APIs to the database IMMEDIATELY upon receipt (before user selection).
- **FR-020**: System MUST maintain an in-memory cache with a configurable size limit (e.g., 1000 items) using LRU eviction.
- **FR-021**: System MUST cache search queries and their result mappings in memory for instant repeat searches.
- **FR-022**: System MUST display cached/database foods first in search results, before external API results.
- **FR-023**: System MUST allow users to refresh cached food data from external sources on demand.
- **FR-024**: System SHOULD implement cache expiration (e.g., 30 days) to refresh stale database data.

#### Barcode Lookup

- **FR-025**: System MUST support UPC/EAN barcode lookup via OpenFoodFacts API.
- **FR-026**: System MUST support barcode lookup via FatSecret API as a fallback.
- **FR-027**: System MUST gracefully handle barcodes not found in any source.
- **FR-036**: System MUST provide manual UPC/barcode entry input field. Camera-based scanning is deferred to a future phase.

#### Error Handling & Resilience

- **FR-028**: System MUST gracefully degrade when one or more data sources are unavailable.
- **FR-029**: System MUST implement retry logic with exponential backoff for transient API failures.
- **FR-030**: System MUST respect API rate limits and queue/defer requests when limits are approached.
- **FR-031**: System MUST log API errors and latency metrics for monitoring.

#### Configuration

- **FR-032**: System MUST allow enabling/disabling individual data sources via environment configuration.
- **FR-033**: System MUST support API key configuration per source (where required).
- **FR-034**: System SHOULD allow configuring source priority order.
- **FR-035**: System SHOULD allow configuring in-memory cache size limit.

### Key Entities

- **Food**: Represents a food item with nutritional data. Extended with `source` (enum: usda, openfoodfacts, fatsecret, user_custom) and `sourceId` (original ID from external API).
- **FoodSource**: Configuration entity tracking which external APIs are enabled, their API keys, rate limits, and priority order.
- **FoodSearchCache**: Optional entity for caching search results (queries and result IDs) to reduce API calls for repeated searches.
- **NutrientMapping**: Lookup table mapping external API nutrient IDs to our standard nutrient schema (e.g., USDA attr_id 203 = protein).

### Assumptions

- USDA FoodData Central will remain free and publicly accessible.
- OpenFoodFacts API will remain free with current rate limits (100 req/min for reads).
- FatSecret free tier (5,000 calls/day) is sufficient for initial usage.
- Spoonacular, Edamam, and Zestful are discarded from scope entirely.
- Internet connectivity is required for fresh searches; offline mode uses cached data only.
- Nutritionix integration will be completely removed (not deprecated or kept as fallback).
- Barcode scanning is included in phase 1; recipe parsing is deferred to a later phase.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Food search returns results from at least 2 sources within 3 seconds for 95% of queries.
- **SC-002**: 90% of commonly searched foods have matches in the free sources (USDA + OpenFoodFacts).
- **SC-003**: API costs reduced by 80% or more compared to Nutritionix-only approach.
- **SC-004**: User food logging completion rate remains at or above current levels.
- **SC-005**: System handles 100 concurrent search requests without degradation.
- **SC-006**: Barcode scan success rate of 70%+ for packaged food products.
- **SC-007**: Cache hit rate of 50%+ for food searches after 30 days of usage.

---

## Data Source Summary (Phase 1 - Free Only)

| Source | Type | Free Tier | Rate Limits | Barcode | Macros | Micros | Quality | Status |
|--------|------|-----------|-------------|---------|--------|--------|---------|--------|
| **USDA FoodData Central** | Government | Unlimited | 1,000/hr/IP (server) | Yes (branded) | Yes | Excellent | Authoritative | **In Scope** |
| **OpenFoodFacts** | Community | Unlimited | 100/min (read) | Yes | Yes | Partial | Good (crowdsourced) | **In Scope** |
| **FatSecret** | Commercial | 5,000/day | Per tier | Yes | Yes | Partial | Good | **In Scope** |

*Note: Spoonacular, Edamam, and Zestful have been discarded from scope.*
*Note: All sources are queried server-side. Camera-based barcode scanning is deferred to a future phase.*

## Technical Notes

### Existing Infrastructure
- Current schema already supports `source` and `sourceId` fields on the `foods` table.
- `FoodSource` type currently includes: `nutritionix`, `user_custom`, `usda`, `manual`, `database`.
- Need to update `FoodSource` enum: remove `nutritionix`, add `openfoodfacts`, `fatsecret`.
- Existing Nutritionix files to remove: `src/lib/nutritionix.ts`, `src/types/nutritionix.ts`, `src/lib/__tests__/mock-nutritionix.ts`.

### API Authentication & Architecture
- **USDA**: API key (free from data.gov) - executed server-side to protect API key. Rate limits (1,000/hr) apply per server IP.
- **OpenFoodFacts**: None required (open API) - executed server-side.
- **FatSecret**: OAuth 2.0 (Client Credentials) - executed server-side (credentials cannot be exposed to client).

### Implementation Order (Phase 1)
1. USDA FoodData Central (free, authoritative, comprehensive) - server-side
2. OpenFoodFacts (free, good branded coverage, barcode support) - server-side
3. FatSecret (free tier, additional coverage, barcode fallback) - server-side
4. Remove Nutritionix integration entirely
5. Implement manual barcode entry UI (camera scanning deferred)

### Future Phases (Out of Scope)
- Recipe nutrition calculation
- Additional data sources (if needed)
