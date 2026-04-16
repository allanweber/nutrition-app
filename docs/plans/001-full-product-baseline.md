# Full Product Baseline — Implementation Plan

## Context

Document and verify the current product baseline scope and behavior end-to-end. Use the existing app as source of truth, not aspirational goals. Include: authentication (email+Google), dashboard analytics, food logging via FatSecret, nutrition goals, legal pages, and clearly identify currently partial/not implemented areas (diet plans, professional verification, body check-ins).

---

## Design Decisions

### Authentication Approach
- Email/password sign-in and Google sign-in via BetterAuth
- Session management with protected dashboard routes
- Auth pages: `/login`, `/signup`
- Unauthenticated access redirects to `/login`

### Food Logging Strategy
- Search foods via FatSecret API (OAuth 2.0 Client Credentials)
- Local DB-first: check local storage before querying external provider
- Store food snapshots with each logged entry
- Daily food log view with per-day totals and meal-grouped entries

### Dashboard & Analytics
- Daily/weekly nutrition analytics endpoints
- Nutrition goals with default fallback values
- Dashboard shows daily totals, weekly trends, recent logged foods

### Baseline Gaps (Partial/Not Implemented)
- **Diet Plans**: Partially implemented - restricted meal-group operations tied to existing user-owned plan, no complete end-user creation/management workflow
- **Professional Verification**: Role selection exists at signup and marketing content exists, but no credential submission/review/approval workflow
- **Body Check-ins**: Data structures exist, no user-facing create/view/update flow

### Tech Stack Decisions
- Use existing implementation as baseline; verify parity to spec
- Keep current stack: Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, TanStack Form, Drizzle/Postgres, BetterAuth
- No new frameworks or major dependencies

---

## Schema Changes Required

**No schema changes** - this is a verification/parity task.

Existing entities verified:
- `UserAccount` - id, email, name, image, role, emailVerified, createdAt, updatedAt
- `Session` - id, userId, token, expiresAt, ipAddress, userAgent, timestamps
- `FoodCatalogItem` - food identity, nutrient, serving fields
- `FoodLogMeal` - id, userId, mealType, consumedAt, sourceDietPlanMealGroupId
- `FoodLogItem` - id, mealId, foodId, quantity, servingUnit, nutrient snapshots
- `NutritionGoal` - id, userId, goalType, targets, activityLevel, isActive

---

## Files to Create

No new files - this is a verification/documentation task.

**Files to verify against spec**:
- `src/app/(dashboard)/layout.tsx` - auth check, session handling
- `src/app/(dashboard)/dashboard/page.tsx` - main dashboard
- `src/app/api/analytics/daily/route.ts` - daily analytics
- `src/app/api/analytics/weekly/route.ts` - weekly analytics
- `src/app/api/goals/route.ts` - nutrition goals CRUD
- `src/app/api/food-logs/route.ts` - food log creation
- `src/app/api/food-logs/[id]/route.ts` - food log read/delete
- `src/app/(legal)/terms/page.tsx` - public terms page
- `src/app/(legal)/privacy/page.tsx` - public privacy page

---

## User Stories & Testing

### User Story 1 - Access Account and Protected Workspace (Priority: P1)
As a user, I can sign in using email/password or Google, and I am redirected to the dashboard only when authenticated.

**Acceptance Scenarios**:
1. Given an existing account, When valid credentials are submitted on login, Then the user reaches the dashboard
2. Given a user is not authenticated, When they open a protected dashboard page, Then they are redirected to login
3. Given login and signup pages, When the page renders, Then a Google sign-in option is available alongside email/password

### User Story 2 - Log Food and Review Daily Intake (Priority: P1)
As an authenticated user, I can search foods, add entries to my daily log, view totals by day and meal, and delete entries.

**Acceptance Scenarios**:
1. Given an authenticated user on the food log page, When they search and add a food with quantity and meal type, Then the item appears in the selected day and daily totals update
2. Given at least one logged item, When the user deletes an item, Then the item is removed and totals are recalculated
3. Given no entries for a selected day, When the page loads, Then an empty-state message is shown
4. Given the selected day is today, When the user attempts to navigate to a future day, Then forward navigation is blocked

### User Story 3 - Monitor Progress on Dashboard and Goals (Priority: P2)
As an authenticated user, I can view daily/weekly nutrition analytics and set nutrition goals that influence progress tracking.

**Acceptance Scenarios**:
1. Given a user with food log history, When the dashboard loads, Then daily macro cards, weekly trend charts, and recent foods are displayed
2. Given a user edits nutrition goals, When save succeeds, Then the new goals are persisted and used by dashboard progress calculations
3. Given a user has no active saved goals, When goals are requested, Then default targets are returned

### User Story 4 - Access Public Legal Information (Priority: P3)
As any visitor, I can access Terms of Service and Privacy Policy without being signed in.

**Acceptance Scenarios**:
1. Given a logged-out visitor, When they open the terms page, Then legal terms content is visible
2. Given a logged-out visitor, When they open the privacy page, Then privacy policy content is visible

### User Story 5 - Understand Baseline Gaps (Priority: P2)
As a product stakeholder, I can distinguish fully working user-facing features from data-model-only or API-only areas.

**Acceptance Scenarios**:
1. Given this baseline specification, When reading scope sections, Then diet plans are identified as partially implemented
2. Given this baseline specification, When reading scope sections, Then professional verification is identified as not implemented beyond role capture
3. Given this baseline specification, When reading scope sections, Then body check-ins are identified as data-model-only

---

## Key Functional Requirements

- **FR-001**: The product MUST support account authentication via email/password and Google sign-in
- **FR-002**: The product MUST require authentication for dashboard area pages and redirect unauthenticated users to login
- **FR-003**: The food logging workflow MUST allow searching foods, selecting quantity and meal type, and creating a log entry
- **FR-004**: Food logging MUST retrieve nutrition data from FatSecret and cache/store food snapshots with each logged item
- **FR-005**: The daily food log view MUST provide per-day totals and meal-grouped entries, including empty-state behavior
- **FR-006**: Users MUST be able to delete an existing food log entry; totals and grouped display MUST update after deletion
- **FR-007**: The dashboard MUST show daily nutrition totals, weekly trend data, and recent logged foods
- **FR-008**: The goals workflow MUST allow users to read current goals, update goals with validation
- **FR-009**: If a user has no active saved goals, the product MUST return default nutrition targets
- **FR-010**: Privacy Policy and Terms of Service pages MUST be publicly accessible without authentication
- **FR-011–FR-013**: Diet plans, professional verification, and body check-ins classified as partially/not implemented
- **FR-014**: Email verification and password reset code requirements are out of scope here

---

## Verification Checklist

- [ ] npm run lint passes
- [ ] `./scripts/run-e2e.sh` passes for chromium baseline
- [ ] Auth parity: protected routes redirect to login for unauthenticated users
- [ ] Food log parity: add entry, verify totals update, delete entry, verify removal
- [ ] Dashboard parity: verify daily/weekly data displays with seeded data
- [ ] Goals parity: verify goals update persists and dashboard reflects changes
- [ ] Legal parity: terms/privacy accessible while logged out
- [ ] Documentation parity: explicit status labels for partial/not-implemented areas
