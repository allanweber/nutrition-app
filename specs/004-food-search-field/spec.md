# Feature Specification: Unified Food Search Field Component

**Feature Branch**: `004-food-search-field`
**Created**: 2026-03-18
**Status**: Draft
**Input**: User description: "Unified Food Search Field Component"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Food Log Search & Add to Diary (Priority: P1)

An authenticated user on the food log page wants to quickly find a food and add it to their diary. They type in the search field, browse categorized results, select a food item, and a modal appears where they choose the meal type and serving size before confirming the addition to their diary.

**Why this priority**: This is the primary daily use case for both nutrition professionals and individuals tracking intake. Fast, accurate food logging is the core value of the application.

**Independent Test**: Can be fully tested by navigating to the food log page, searching for a food, and adding it to the diary via the modal. Delivers the core food logging functionality without any other story being complete.

**Acceptance Scenarios**:

1. **Given** a user is on the food log page, **When** they type at least 3 characters in the search field, **Then** search results appear organized into Common, Branded, and Custom food tabs showing up to 10 items per tab
2. **Given** search results are displayed, **When** the user clicks a food item, **Then** a modal opens allowing them to select a meal type and serving size before adding to the diary
3. **Given** the modal is open, **When** the user confirms the selection, **Then** the food is added to the diary and the search field remains available for further additions
4. **Given** a user clicks the food title link or a details button within a search result, **Then** they are navigated to the food details page without adding to the diary

---

### User Story 2 - Anonymous Landing Page Search (Priority: P2)

An anonymous (non-logged-in) user visits the landing page and wants to look up nutritional information for a specific food. They use the search field to find the food, select a result, and are taken to a publicly accessible food details page showing the food's title, images, and nutritional information.

**Why this priority**: Enables search engine discoverability and serves as an acquisition channel, letting prospective users experience food lookup before registering.

**Independent Test**: Can be fully tested by visiting the landing page without logging in, searching for a food, selecting a result, and verifying the food details page loads with full nutritional information.

**Acceptance Scenarios**:

1. **Given** an anonymous user is on the landing page, **When** they type at least 3 characters in the search field, **Then** food search results are displayed with only the Common and Branded tabs (the Custom tab is not shown to anonymous users)
2. **Given** an anonymous user selects a food from the search results, **Then** they are navigated to a publicly accessible food details page
3. **Given** the food details page loads, **Then** it displays the food's title, images, and nutritional information and is indexable by search engines
4. **Given** the food exists in the local database, **When** the page is loaded, **Then** the internal identifier is used; otherwise the external food source identifier is used as the fallback

---

### User Story 3 - Search History & Autocomplete Suggestions (Priority: P3)

A returning user opens the search field and immediately sees their recent search history listed below the input. As they begin typing, suggestions matching their history and current results appear, allowing them to select a food without typing the full name.

**Why this priority**: Reduces friction for the most common daily pattern — logging the same or similar foods repeatedly across sessions.

**Independent Test**: Can be tested by performing several searches, closing the component, reopening it, and verifying history appears. Typing partial terms should surface suggestions from prior searches.

**Acceptance Scenarios**:

1. **Given** a user has previously searched for foods, **When** they focus the search field, **Then** up to 5 recent search history entries are displayed, most recent first
2. **Given** a user clicks a search history entry, **Then** the search executes immediately using that term
3. **Given** a user types in the search field, **When** their input partially matches history entries or result titles, **Then** up to 5 autocomplete suggestions are displayed in real time
4. **Given** a search history entry has not been accessed in 30 days, **Then** it is automatically removed from history
5. **Given** the history list has reached 30 items, **When** a new search is performed, **Then** the oldest entry is removed to accommodate the new one

---

### User Story 4 - Keyboard Navigation (Priority: P4)

A power user navigates through search results entirely with the keyboard — arrowing through items, selecting with Enter, and dismissing with Escape — without ever touching the mouse.

**Why this priority**: Increases efficiency for nutrition professionals who manage high volumes of client food logs daily and prefer keyboard-driven workflows.

**Independent Test**: Can be fully tested by searching for a food and completing the entire selection flow using only keyboard input.

**Acceptance Scenarios**:

1. **Given** search results are visible, **When** the user presses the down arrow key, **Then** the next result is highlighted
2. **Given** the user presses the up arrow key, **Then** the previous result is highlighted; if at the top, focus returns to the input
3. **Given** a result is highlighted, **When** the user presses Enter, **Then** the same action triggers as clicking that result
4. **Given** the user presses Escape at any point, **Then** the search input is cleared and the dropdown closes

---

### Edge Cases

- What happens when fewer than 3 characters are entered? The search does not execute; an inline message prompts the user to type more characters.
- What happens when the search returns no results? An empty state appears with a message indicating no matches were found and suggestions for refining the query.
- What happens when the search fails due to a network or service error? An error state is shown with a retry option.
- What happens when the user types quickly? The search is debounced — a query fires only after the user pauses typing. The loading indicator appears only after 500ms have elapsed since the search started, preventing flickering for fast responses.
- What happens when there are no results in the active tab but results exist in another? The other tabs remain accessible and display their item counts; the empty tab shows a "no items in this category" message.
- What happens when the user clears the search field? All results, suggestions, and history are hidden and the field resets to its initial focused state.
- What happens when a food on the anonymous details page does not exist in the local database? The page falls back to the food's external source identifier to retrieve and display nutritional data.
- What happens when both the local database and the external food source fail to return data on the food details page? A user-friendly error page is displayed indicating the food could not be loaded, with an option to search again.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a single, reusable search field component that can be embedded on multiple pages with context-specific selection actions configured per placement
- **FR-002**: Search MUST require a minimum of 3 characters before executing, displaying a prompt to type more when the threshold is not met
- **FR-003**: Search results MUST be organized into tabs — Common, Branded, and Custom — each showing the count of items in that category; the Custom tab MUST only be shown to authenticated users and MUST be hidden for anonymous users
- **FR-004**: Each tab MUST display up to 10 results initially; a "Load more" control MUST allow users to retrieve additional results in increments of 10
- **FR-005**: System MUST display a loading indicator only after 500 milliseconds have elapsed since the search began, to avoid flickering for fast responses
- **FR-006**: System MUST display a clear empty state with guidance when no results match the query
- **FR-007**: System MUST display an error state with a retry option when the search cannot be completed due to a connectivity or service issue
- **FR-008**: Matching query terms MUST be visually highlighted within result titles and descriptions
- **FR-009**: Each search result MUST display the food's thumbnail image (when available), title, description, and food category
- **FR-010**: System MUST support full keyboard navigation: arrow keys to move through results, Enter to select, Escape to clear and close
- **FR-011**: System MUST store search history locally on the user's device for all users (authenticated and anonymous); history is never synced to the server or shared across devices; history entries are deduplicated by search term (case-insensitive) — repeating a search moves the existing entry to the top with an updated timestamp rather than creating a duplicate; up to 30 unique entries are retained and entries not accessed within 30 days are automatically expired
- **FR-012**: When the search field is focused before typing, up to 5 of the most recent history entries MUST be displayed, ordered most-recent-first
- **FR-013**: As the user types, up to 5 autocomplete suggestions MUST appear, sourced from partial matches in search history and current result titles
- **FR-014**: Each search history entry MUST be clickable to immediately trigger a search using that term
- **FR-015**: On the food log page, selecting a food item MUST open a modal where the user can choose meal type and serving size before adding to the diary; a link to the full food details page MUST also be accessible from each result item
- **FR-016**: The food log page's existing diary display and entry functionality MUST remain unchanged; only the search entry point is updated
- **FR-017**: On the landing page, the search field MUST be fully usable by anonymous (non-authenticated) users
- **FR-018**: Selecting a food from the landing page search MUST navigate the user to a publicly accessible food details page
- **FR-019**: The anonymous food details page MUST display the food's title, images, and nutritional information
- **FR-020**: The anonymous food details page MUST be rendered in a way that allows search engines to index its content
- **FR-021**: The anonymous food details page MUST resolve food data using the internal database identifier when the food is stored locally, or the external food source identifier as a fallback; if both sources fail to return data, the page MUST display a user-friendly error message with an option to search again
- **FR-022**: Existing backend search endpoints and database schemas MUST remain unchanged
- **FR-023**: The public landing page search and anonymous food details page MUST enforce per-IP rate limiting to prevent abuse and protect performance for legitimate users

### Key Entities

- **Search Result**: A food item returned by a query, categorized as Common, Branded, or Custom, containing a title, description, thumbnail, and unique identifier
- **Search History Entry**: A previously searched term stored on the user's device with a timestamp, used for ordering, expiry, and suggestion matching
- **Food Detail**: Comprehensive nutritional information for a food item, including title, images, macronutrients, and serving size options
- **Diary Entry**: A food item recorded in a user's food log with an associated meal type, serving size, and date

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can locate and add a food to their diary in under 30 seconds from initiating the search
- **SC-002**: The search component is implemented once and used without modification on all specified pages (food log, landing page)
- **SC-003**: 95% of searches for foods known to exist in the catalog return at least one relevant result in the first page
- **SC-004**: Users can complete a full food search and selection using only keyboard input with zero mouse interaction
- **SC-005**: Anonymous users can access food nutritional details from the landing page search without creating an account
- **SC-006**: The anonymous food details page is publicly accessible and returns content in its initial server response, verifiable by inspecting raw page source
- **SC-007**: Search results appear within 1 second of the user finishing their query under normal network conditions
- **SC-008**: Returning users with search history see relevant autocomplete suggestions on 80% of repeat searches

## Assumptions

- The application already has an existing food search backend; this feature replaces the frontend search component and refactors existing pages to use the new shared component
- "Custom" foods refer to foods created or saved by the user, distinct from the common or branded food catalog entries
- Search history is stored locally on the user's device for all users (authenticated and anonymous alike) — no server-side storage or cross-device sync is performed
- The landing page search does not support adding foods to a diary; only authenticated users can log foods
- The search debounce delay (pause between typing and query execution) follows the 300ms industry standard
- "Load more" loads the next batch of results globally across all categories, with the active tab filter applied to what has been loaded
- The food details page for anonymous users displays a consistent set of nutritional fields (calories, macronutrients, serving information) across all food types

## Dependencies

- The existing food search backend must support filtering results by food category (Common, Branded, Custom) and pagination
- Each food item in search results must include at minimum: title, category, thumbnail URL, and a unique identifier
- The external food data source must provide nutritional details retrievable by food external identifier for the anonymous details page fallback

## Clarifications

### Session 2026-03-19

- Q: Should the Custom foods tab be shown to anonymous users on the landing page? → A: No — the Custom tab is hidden for anonymous users; only Common and Branded tabs are shown.
- Q: Should search history sync across devices for authenticated users? → A: No — history is always device-local only; no server-side sync for any user type.
- Q: How should search history handle duplicate search terms? → A: Deduplicate by term (case-insensitive); repeating a search moves the existing entry to the top with an updated timestamp.
- Q: What should users see when both local and external sources fail on the anonymous food details page? → A: A user-friendly error page indicating the food could not be loaded, with an option to search again.
- Q: Should the public search and food details pages have abuse protection? → A: Yes — rate limit requests per IP address on both public endpoints.
