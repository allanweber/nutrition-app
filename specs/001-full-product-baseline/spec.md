# Feature Specification: Full Product Baseline

**Feature Branch**: `[001-full-product-baseline]`  
**Created**: 2026-03-11  
**Status**: Draft  
**Input**: User description: "Create or update a feature specification that documents this repository's current product scope and behavior end-to-end. Use the existing app as source of truth, not aspirational goals. Include: authentication (email+Google), dashboard analytics, food logging via Nutritionix, nutrition goals, legal pages, and clearly identify currently partial/not implemented areas (diet plans, professional verification, body check-ins). Produce measurable success criteria and testable acceptance scenarios. Keep requirements explicit and implementation-ready for this codebase."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Access Account and Protected Workspace (Priority: P1)

As a user, I can sign in using email/password or Google, and I am redirected to the dashboard only when authenticated.

**Why this priority**: Authentication and protected access are the entry point for every value-generating flow.

**Independent Test**: This can be fully tested by signing in and attempting protected-route access from both authenticated and unauthenticated states.

**Acceptance Scenarios**:

1. **Given** an existing account, **When** valid credentials are submitted on login, **Then** the user reaches the dashboard.
2. **Given** a user is not authenticated, **When** they open a protected dashboard page, **Then** they are redirected to login.
3. **Given** login and signup pages, **When** the page renders, **Then** a Google sign-in option is available alongside email/password.

---

### User Story 2 - Log Food and Review Daily Intake (Priority: P1)

As an authenticated user, I can search foods, add entries to my daily log, view totals by day and meal, and delete entries.

**Why this priority**: Food logging is the core product behavior that powers all downstream analytics and goal tracking.

**Independent Test**: This can be tested by adding and deleting food entries and verifying updated totals and empty-state behavior.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the food log page, **When** they search and add a food with quantity and meal type, **Then** the item appears in the selected day and daily totals update.
2. **Given** at least one logged item, **When** the user deletes an item, **Then** the item is removed and totals are recalculated.
3. **Given** no entries for a selected day, **When** the page loads, **Then** an empty-state message is shown.
4. **Given** the selected day is today, **When** the user attempts to navigate to a future day, **Then** forward navigation is blocked.

---

### User Story 3 - Monitor Progress on Dashboard and Goals (Priority: P2)

As an authenticated user, I can view daily/weekly nutrition analytics and set nutrition goals that influence progress tracking.

**Why this priority**: Analytics and goals provide the key feedback loop after food logging.

**Independent Test**: This can be tested by loading dashboard data for seeded users, updating goals, and verifying progress cards/charts.

**Acceptance Scenarios**:

1. **Given** a user with food log history, **When** the dashboard loads, **Then** daily macro cards, weekly trend charts, and recent foods are displayed.
2. **Given** a user edits nutrition goals, **When** save succeeds, **Then** the new goals are persisted and used by dashboard progress calculations.
3. **Given** a user has no active saved goals, **When** goals are requested, **Then** default targets are returned.

---

### User Story 4 - Access Public Legal Information (Priority: P3)

As any visitor, I can access Terms of Service and Privacy Policy without being signed in.

**Why this priority**: Legal content must remain publicly reachable and linkable from auth pages.

**Independent Test**: This can be tested by opening legal pages in a logged-out browser session and confirming page content renders.

**Acceptance Scenarios**:

1. **Given** a logged-out visitor, **When** they open the terms page, **Then** legal terms content is visible.
2. **Given** a logged-out visitor, **When** they open the privacy page, **Then** privacy policy content is visible.

---

### User Story 5 - Understand Baseline Gaps and Partial Areas (Priority: P2)

As a product stakeholder, I can distinguish fully working user-facing features from data-model-only or API-only areas.

**Why this priority**: Delivery planning depends on an accurate baseline of what currently works versus what is incomplete.

**Independent Test**: This can be tested by verifying that each listed partial area has explicit current-state boundaries and no implied end-user capability.

**Acceptance Scenarios**:

1. **Given** this baseline specification, **When** reading scope sections, **Then** diet plans are identified as partially implemented (limited endpoint coverage, no complete user workflow).
2. **Given** this baseline specification, **When** reading scope sections, **Then** professional verification is identified as not implemented beyond role capture and marketing copy.
3. **Given** this baseline specification, **When** reading scope sections, **Then** body check-ins are identified as data-model-only with no user-facing workflow.

---

### Edge Cases

- Nutrition search or nutrient lookup failure returns a user-safe error and does not create partial food log entries.
- Unauthorized requests to private analytics, goals, and food-log endpoints return unauthorized responses.
- Deleting the last item in a meal removes the empty meal container for that timestamp.
- Dashboard and food log pages must still render meaningful empty/default states when no data exists.
- Email verification and password reset code edge cases are defined in `specs/002-email-verification-reset/spec.md`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST support account authentication via email/password and Google sign-in.
- **FR-002**: The product MUST require authentication for dashboard area pages and redirect unauthenticated users to login.
- **FR-003**: The food logging workflow MUST allow searching foods, selecting quantity and meal type, and creating a log entry for a date/time.
- **FR-004**: Food logging MUST retrieve nutrition data from the configured external food data provider and cache/store food snapshots with each logged item.
- **FR-005**: The daily food log view MUST provide per-day totals and meal-grouped entries, including empty-state behavior when no entries exist.
- **FR-006**: Users MUST be able to delete an existing food log entry; totals and grouped display MUST update after deletion.
- **FR-007**: The dashboard MUST show daily nutrition totals, weekly trend data, and recent logged foods for the authenticated user.
- **FR-008**: The goals workflow MUST allow users to read current goals, update goals with validation, and have updated goals reflected in dashboard progress.
- **FR-009**: If a user has no active saved goals, the product MUST return default nutrition targets.
- **FR-010**: Privacy Policy and Terms of Service pages MUST be publicly accessible without authentication.
- **FR-011**: The baseline MUST classify diet plans as partially implemented: currently available only as restricted meal-group operations tied to an existing user-owned plan, without a complete end-user creation/management journey.
- **FR-012**: The baseline MUST classify professional verification as not implemented for end users: role selection exists at signup and professional marketing content exists, but no credential submission/review/approval workflow is available.
- **FR-013**: The baseline MUST classify body check-ins as not implemented for end users: data structures exist but no user-facing create/view/update flow is currently available.
- **FR-014**: Email verification and password reset code requirements are out of scope here and are fully specified in `specs/002-email-verification-reset/spec.md`.

### Key Entities *(include if feature involves data)*

- **User Account**: Identity record with email, display name, role, and email verification state.
- **Session**: Active authenticated session with expiry and client metadata.
- **Food Catalog Item**: Cached food data record with nutrients, serving information, source identifier, and optional image/alternate measures.
- **Food Log Meal**: User/date/meal grouping container for logged items.
- **Food Log Item**: Individual consumed food entry with quantity plus nutrient snapshot at time of logging.
- **Nutrition Goal**: User target profile including calorie/macro targets, goal type, activity level, active flag, and effective period.
- **Diet Plan**: Structured plan entity for owner/client and target macros (currently lacks a complete user-facing workflow).
- **Diet Plan Meal Group/Item**: Grouped planned meal entities with item snapshots (currently partial exposure).
- **Body Check-in**: Goal-linked progress measurement record (currently data-model only for product scope).

### Assumptions

- “Current product scope” is defined by implemented pages, active API behavior, and existing automated tests in this repository.
- This specification captures present behavior and gaps; it does not commit to future roadmap delivery.
- Google sign-in availability depends on valid environment configuration.
- External food data and email delivery depend on third-party service configuration and availability.

### Dependencies

- Configured external food database provider credentials for live search and nutrient retrieval.
- Persistent data storage for users, logs, goals, and auth challenge records.
- Email verification and password reset flow dependencies are documented in `specs/002-email-verification-reset/spec.md`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of protected dashboard pages redirect unauthenticated visitors to login in acceptance testing.
- **SC-002**: In baseline acceptance tests, users can add a food entry and observe updated daily totals within the same interaction flow for at least one valid search result.
- **SC-003**: In baseline acceptance tests, deleting a logged food entry results in a reduced entry count and recalculated totals.
- **SC-004**: In baseline acceptance tests, dashboard view exposes daily totals, weekly trends, and recent foods for users with seeded nutrition history.
- **SC-005**: 100% of goals updates with valid inputs persist and are reflected in subsequent dashboard progress calculations.
- **SC-006**: Public legal pages are reachable while logged out with no authentication prompt in 100% of acceptance test runs.
- **SC-007**: Baseline documentation explicitly classifies all requested partial areas (diet plans, professional verification, body check-ins) with no ambiguous implementation status.
- **SC-008**: Email verification and password reset success criteria are tracked only in `specs/002-email-verification-reset/spec.md`.
