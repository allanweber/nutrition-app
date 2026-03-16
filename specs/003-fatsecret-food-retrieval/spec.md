# Feature Specification: Retrieve Foods from FatSecret

**Feature Branch**: `003-fatsecret-food-retrieval`
**Created**: 2026-03-16
**Status**: Draft
**Input**: User description: "Retrieve foods from FatSecret API"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search Foods by Keyword (Priority: P1)

A user types a food name or keyword into the food search input and receives a list of matching food items with their nutritional information. The system first checks its local database before reaching out to the external food provider, ensuring fast responses for previously searched foods.

**Why this priority**: This is the core user-facing interaction. Without food search, no nutritional data can be added to logs or plans.

**Independent Test**: Can be fully tested by searching for any keyword and verifying that matching food items with nutritional details appear in a paginated list.

**Acceptance Scenarios**:

1. **Given** a user is on the food search screen, **When** they enter a keyword and submit the search, **Then** a list of matching foods is displayed with name, serving sizes, and key nutritional values (calories, protein, carbohydrates, fat).
2. **Given** foods matching the keyword exist in local storage, **When** the user performs a search, **Then** local matches appear at the top of the unified results list, followed by any additional matches from the external provider.
3. **Given** a keyword with many matching foods, **When** results are returned, **Then** results are displayed in pages and the user can navigate to subsequent pages.
4. **Given** a user searches for a food with no matches, **When** the search completes, **Then** a clear message indicates no results were found.

---

### User Story 2 - View Food Nutritional Detail (Priority: P2)

A user selects a food item from search results to view its complete nutritional profile, including full macronutrient breakdown, micronutrients, all available serving sizes, and food images.

**Why this priority**: After finding a food, users need detailed nutritional data to make informed dietary decisions and accurately log portions.

**Independent Test**: Can be fully tested by selecting any food from search results and verifying that the full nutritional breakdown and all serving size options are displayed.

**Acceptance Scenarios**:

1. **Given** a user is viewing search results, **When** they select a food item, **Then** the full nutritional profile is displayed including calories, macronutrients, and micronutrients for the 100g base serving.
2. **Given** a food with multiple serving sizes, **When** the user views the food detail, **Then** all available serving sizes are listed with their respective nutritional values calculated relative to the 100g base.
3. **Given** a food that has associated images, **When** the user views the food detail, **Then** the food image is displayed alongside the nutritional information.

---

### User Story 3 - Reliable Food Availability Under Error Conditions (Priority: P3)

When the external food data provider is temporarily unavailable or rate-limited, users who have previously searched those foods still see results from local storage. Users attempting to search for new foods receive a clear, helpful error message.

**Why this priority**: Resilience is important but does not block core functionality; locally cached data provides continuity while new searches gracefully degrade.

**Independent Test**: Can be fully tested by simulating external provider unavailability and verifying that cached foods are still returned while new searches display a meaningful error.

**Acceptance Scenarios**:

1. **Given** the external food data provider is unavailable, **When** a user searches for a food already in local storage, **Then** the cached results are returned normally.
2. **Given** the external food data provider is unavailable, **When** a user searches for a new food not in local storage, **Then** a user-friendly error message is shown, explaining the issue and suggesting the user try again later.
3. **Given** the external food data provider imposes a rate limit, **When** a request is rejected due to rate limiting, **Then** the system handles the limit gracefully and informs the user without exposing technical details.

---

### Edge Cases

- What happens when a food item exists in the external database but has no 100g serving size defined?
- ~~How does the system handle a food that was previously saved but whose nutritional data has since changed in the external database?~~ Resolved: local food data is permanent once saved; no automatic refresh occurs.
- ~~What happens when a food item exists in the external database but has no 100g serving size defined?~~ Resolved: the first available serving is used as the base reference instead.
- ~~What happens if a food search keyword returns duplicate entries (same food ID appearing more than once in results)?~~ Resolved: duplicate saves are silently discarded; last writer wins with no user-visible error.
- How does the system behave when a food has no images available?
- What happens when pagination is requested beyond the total available results?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to search for foods by entering one or more keywords, returning a paginated list of matching food items.
- **FR-002**: System MUST retrieve food data from local storage first; the external food provider is only queried when the food is not found locally.
- **FR-003**: System MUST store each food item's nutritional data normalized to a 100g base serving (identified by a metric serving amount of 100.000 or serving description of "100 g"). When no 100g serving is present, the first available serving in the response is used as the base reference. All other serving sizes are stored separately linked to the base food record.
- **FR-004**: System MUST prevent duplicate food records by verifying whether a food (identified by its external provider ID) already exists before storing it. If a concurrent save results in a duplicate, the conflict is silently discarded with no error surfaced to the user.
- **FR-005**: System MUST store all available serving sizes for each food item, including their description, weight, and full nutritional values calculated from the 100g base.
- **FR-006**: System MUST store all three food image sizes provided by the external source: high-resolution (1024×1024), medium (400×400), and thumbnail (72×72). The food image data model must be extended to accommodate all three sizes, as the existing schema only stores two.
- **FR-007**: System MUST save new food data asynchronously in the background so that the user experience is not blocked while data is being persisted.
- **FR-008**: System MUST display paginated search results as a unified list, with locally stored matches appearing first followed by external provider results, allowing users to browse through the combined set page by page.
- **FR-009**: System MUST implement caching for frequently accessed food data to reduce repeated external lookups and improve response times.
- **FR-010**: System MUST securely authenticate with the external food data provider to access its database.
- **FR-011**: System MUST handle external provider errors (connectivity issues, rate limits, timeouts) gracefully, displaying user-friendly messages and avoiding application crashes.
- **FR-012**: System MUST store the complete nutritional profile for each food item, including: calories, carbohydrates, protein, fat, saturated fat, fiber, sugar, sodium, potassium, vitamins, and minerals as provided by the external source.
- **FR-013**: System MUST log all external food provider interactions, including successful queries, errors, and rate limit events, to support operational monitoring and troubleshooting.

### Key Entities

- **Food**: Represents a single food item. Key attributes: external provider ID (used for deduplication), name, food type, provider reference URL, and full nutritional values based on a 100g serving. This is the central entity.
- **Serving Size**: Represents an alternative portion for a food item. Linked to a Food record. Key attributes: description (e.g., "1 medium apple"), weight in grams, and nutritional values derived from the 100g base. Multiple serving sizes can belong to one food.
- **Food Image**: Represents the set of photos associated with a food item. Linked to a Food record. Stores three URL fields: high-resolution (1024×1024), medium (400×400), and thumbnail (72×72). The existing schema (thumb + highres only) must be extended to add the medium-resolution field. One Food Image record per food item.
- **Food Search Result**: A transient representation of a paginated query response, containing a list of matching Food records, the current page number, and the total result count.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users receive food search results within 2 seconds for previously cached or locally stored foods.
- **SC-002**: Users receive food search results within 5 seconds when the external provider must be queried.
- **SC-003**: 100% of food items retrieved from the external provider are stored without duplicates across multiple searches for the same food.
- **SC-004**: Users can browse paginated food search results without losing their search context or receiving duplicate entries across pages.
- **SC-005**: Food search returns cached results even when the external provider is temporarily unreachable.
- **SC-006**: Users never see raw error codes or technical messages; all failure states are communicated through human-readable messages.
- **SC-007**: Nutritional values for all serving sizes are accurately derived from the 100g base, with no rounding errors greater than 0.1g per nutrient.

## Clarifications

### Session 2026-03-16

- Q: When food data is found locally, should the system ever refresh it from the external provider? → A: Store once, never refresh — local data is permanent once saved.
- Q: Should API usage monitoring and error logging be included as formal functional requirements? → A: Yes — log external API calls, errors, and rate limit events as a formal requirement.
- Q: If the external provider returns a food with no 100g serving, what should the system do? → A: Store the food using the first available serving as the base reference. A 100g serving is identified by a metric serving amount of 100.000 or a serving description of "100 g".
- Q: How should pagination work when local results and external results are combined? → A: Unified list — local results appear first, then external results fill remaining pages.
- Q: How should the system handle a duplicate save race condition when two concurrent requests attempt to store the same new food? → A: Silently discard the duplicate — last writer wins, no error surfaced to the user.
- Clarification (user-supplied): The external provider returns 3 image sizes per food — high-resolution (1024×1024), medium (400×400), and thumbnail (72×72). The existing schema stores only 2 (thumb and highres). All 3 must be stored, requiring the Food Image schema to be extended to include a medium-resolution field.

## Assumptions

- The external food data provider always includes at least one serving size per food item in its response.
- A 100g serving size is identified by a metric serving amount of 100.000 or a serving description of "100 g". When no such serving exists in the external data, the first available serving in the response is used as the base reference instead.
- Food items in the external database are uniquely identified by a stable provider-assigned ID that does not change over time.
- Once a food record is saved locally, its nutritional data is never overwritten or refreshed from the external provider. Local data is considered permanent.
- Users are authenticated in the application before accessing food search functionality; user authentication is handled by a separate feature.
- Performance targets assume a standard broadband internet connection for external provider calls.
- The external provider's nutritional data is considered authoritative; the system stores it as-is without modification.
- All alternate serving sizes and images provided by the external source are stored as received.
