---

description: "Task list for Email Verification & Password Reset Codes"

---

# Tasks: Email Verification & Password Reset Codes

**Input**: Design documents from `/specs/001-email-verification-reset/`
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/auth-code-flows.openapi.yaml`, `quickstart.md`

**Tests**: Included (spec marks “User Scenarios & Testing” as mandatory and this is a critical auth flow; repo uses Playwright).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1/US2/US3)
- Every task includes exact file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure repo has the minimal configuration and scaffolding needed to implement and validate the feature.

- [ ] T001 Confirm required env vars are documented in `.env.example` (RESEND_API_KEY, EMAIL_FROM) and `README.md` (if present)
- [ ] T002 [P] Add feature doc cross-links in `specs/001-email-verification-reset/quickstart.md` (link endpoints + pages)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before any user story work can ship.

- [ ] T003 Resolve spec/contract mismatch for reset input (`email` required in OpenAPI but not stated in FR-009) by updating `specs/001-email-verification-reset/spec.md` and `specs/001-email-verification-reset/contracts/auth-code-flows.openapi.yaml`
- [ ] T004 Resolve spec/contract mismatch for `callbackURL` (present in OpenAPI but not required in spec) by updating `specs/001-email-verification-reset/spec.md` and/or `specs/001-email-verification-reset/contracts/auth-code-flows.openapi.yaml`
- [ ] T005 Add Resend email utility and templates in `src/server/email/resend.ts` and `src/server/email/templates.ts`
- [ ] T006 Add DB tables for `email_verification_challenge` and `security_event` in `src/server/db/schema.ts`
- [ ] T007 Generate a Drizzle migration SQL for new tables under `drizzle/` (e.g., `drizzle/0002_email_verification_and_security_events.sql`)
- [ ] T008 Add server-side helpers for security event logging in `src/server/security-events.ts`
- [ ] T009 Add shared code utilities (generate code, hash, expiry calculations) in `src/lib/auth-codes.ts`
- [ ] T010 Update Better Auth configuration for session revocation on password reset (FR-014) in `src/lib/auth.ts`

**Checkpoint**: Foundation ready—route handlers and UI can be implemented.

---

## Phase 3: User Story 1 — Verify email after signup (Priority: P1) 🎯 MVP

**Goal**: New email signups are auto-signed-in but gated until they enter a valid verification code.

**Independent Test**: Sign up → receive code → verify → access dashboard routes.

### Tests (Playwright)

- [ ] T011 [P] [US1] Add E2E: signup redirects to `/verify-email` and blocks `/dashboard` in `e2e/phase-1-auth.spec.ts`
- [ ] T012 [P] [US1] Add E2E: enter wrong code shows error and stays gated in `e2e/phase-1-auth.spec.ts`
- [ ] T013 [P] [US1] Add E2E: enter correct code verifies and allows dashboard access in `e2e/phase-1-auth.spec.ts`

### API + DB

- [ ] T014 [P] [US1] Implement `POST /api/auth/request-email-verification-code` in `src/app/api/auth/request-email-verification-code/route.ts`
- [ ] T015 [P] [US1] Implement `POST /api/auth/verify-email-code` in `src/app/api/auth/verify-email-code/route.ts`
- [ ] T016 [P] [US1] Add rate-limit enforcement for resend + wrong-code attempts in `src/app/api/auth/request-email-verification-code/route.ts` and `src/app/api/auth/verify-email-code/route.ts`
- [ ] T017 [P] [US1] Add security event writes (requested, failed, verified) in `src/app/api/auth/request-email-verification-code/route.ts`, `src/app/api/auth/verify-email-code/route.ts`, and `src/server/security-events.ts`

### UI

- [ ] T018 [P] [US1] Add TanStack Query mutations for auth-code endpoints in `src/queries/auth-codes.ts`
- [ ] T019 [US1] Build verification page UI with TanStack Form + field-level validation in `src/app/verify-email/page.tsx`
- [ ] T020 [US1] Add resend UX (cooldown + hourly cap messages) in `src/app/verify-email/page.tsx`
- [ ] T021 [US1] Update signup flow to (a) call request-verification-code immediately after signup and (b) route to `/verify-email` in `src/app/signup/page.tsx`

### Gating

- [ ] T022 [US1] Add server-side gating for “new signups only” using `email_verification_challenge` presence in `src/app/(dashboard)/layout.tsx`
- [ ] T023 [US1] Ensure gated users can still log out (and are not stuck) by updating `src/components/logout-button.tsx` if needed

**Checkpoint**: US1 complete—email signups are gated until verified.

---

## Phase 4: User Story 2 — Reset password with a code (Priority: P2)

**Goal**: Users can request a reset code and set a new password; after reset, all sessions are revoked.

**Independent Test**: Request reset → submit code + new password → login works; prior sessions invalid.

### Tests (Playwright)

- [ ] T024 [P] [US2] Add E2E: request reset returns generic success for unknown email in `e2e/phase-1-auth.spec.ts`
- [ ] T025 [P] [US2] Add E2E: reset with invalid/expired code fails with friendly error in `e2e/phase-1-auth.spec.ts`
- [ ] T026 [P] [US2] Add E2E: reset with valid code changes password and allows login in `e2e/phase-1-auth.spec.ts`

### API

- [ ] T027 [P] [US2] Implement `POST /api/auth/request-password-reset-code` in `src/app/api/auth/request-password-reset-code/route.ts`
- [ ] T028 [P] [US2] Implement `POST /api/auth/reset-password-with-code` in `src/app/api/auth/reset-password-with-code/route.ts`
- [ ] T029 [P] [US2] Ensure generic success behavior (no enumeration) in `src/app/api/auth/request-password-reset-code/route.ts`
- [ ] T030 [P] [US2] Add security event writes (requested, failed, completed) in `src/app/api/auth/request-password-reset-code/route.ts`, `src/app/api/auth/reset-password-with-code/route.ts`, and `src/server/security-events.ts`

### UI

- [ ] T031 [US2] Add “Forgot password?” entry point on login page in `src/app/login/page.tsx`
- [ ] T032 [US2] Build “Forgot password” request form (TanStack Form + validation + generic success UI) in `src/app/forgot-password/page.tsx`
- [ ] T033 [US2] Build “Reset password” form (code + newPassword) with error display in `src/app/reset-password/page.tsx`
- [ ] T034 [P] [US2] Add TanStack Query mutations for reset endpoints in `src/queries/auth-codes.ts`

**Checkpoint**: US2 complete—password reset works and sessions are revoked.

---

## Phase 5: User Story 3 — Resend codes safely (Priority: P3)

**Goal**: Users can resend codes with clear guidance while abuse protections are enforced.

**Independent Test**: Resend verification and reset codes; cooldown/limits enforced; messaging is clear.

### Tests (Playwright)

- [ ] T035 [P] [US3] Add E2E: verification resend cooldown blocks rapid resends with friendly message in `e2e/phase-1-auth.spec.ts`
- [ ] T036 [P] [US3] Add E2E: reset-code request rate limits are enforced with generic UI messaging in `e2e/phase-1-auth.spec.ts`

### Implementation

- [ ] T037 [US3] Implement hourly resend cap and wrong-code attempt throttling logic for verification in `src/app/api/auth/request-email-verification-code/route.ts` and `src/app/api/auth/verify-email-code/route.ts`
- [ ] T038 [US3] Implement rate limiting for password reset requests in `src/app/api/auth/request-password-reset-code/route.ts`
- [ ] T039 [US3] Ensure “latest code only” invalidation is enforced for both flows in `src/app/api/auth/request-email-verification-code/route.ts` and `src/app/api/auth/request-password-reset-code/route.ts`
- [ ] T040 [US3] Improve UX messaging for throttles and expiry guidance in `src/app/verify-email/page.tsx` and `src/app/forgot-password/page.tsx`

**Checkpoint**: US3 complete—resends are safe and user-friendly.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T041 [P] Add doc note about “new signups only” gating mechanism in `specs/001-email-verification-reset/research.md`
- [ ] T042 Normalize structured error `field` values across endpoints and document them in `specs/001-email-verification-reset/contracts/auth-code-flows.openapi.yaml`
- [ ] T043 Run `specs/001-email-verification-reset/quickstart.md` end-to-end and update it with any missing steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational; proceed in priority order
- **Polish (Final Phase)**: Depends on all targeted stories

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 (email templates, DB schema, auth code helpers)
- **US2 (P2)**: Depends on Phase 2; independent of US1 except shared helpers
- **US3 (P3)**: Depends on Phase 2; strengthens rate-limit logic used by US1/US2

### Parallel Opportunities (examples)

- Phase 2: T005 (email), T006 (schema), T008 (events), T009 (utils) can be developed in parallel once T003/T004 are resolved.
- US1: T014/T015/T018 can be parallelized; E2E tasks T011–T013 can be done in parallel.
- US2: T027/T028/T031 can be parallelized; E2E tasks T024–T026 can be parallelized.

---

## Parallel Example: User Story 1

```bash
Task: "T011 [US1] Add E2E gating assertions in e2e/phase-1-auth.spec.ts"
Task: "T014 [US1] Implement request-email-verification-code route in src/app/api/auth/request-email-verification-code/route.ts"
Task: "T019 [US1] Build verify-email page in src/app/verify-email/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1–2
2. Implement US1 tasks T011–T023
3. Validate via E2E + quickstart

### Incremental Delivery

- Ship US1 → then US2 → then US3
- Each story remains independently testable and shippable
