# Tasks: Full Product Baseline Parity Verification

**Input**: Design documents from /specs/001-full-product-baseline/
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/baseline-product.openapi.yaml, quickstart.md

## De-duplication Rule
This baseline task set intentionally excludes email verification and password reset code-flow implementation details. Those belong to specs/002-email-verification-reset.

## Phase 1: Baseline Setup

- [x] T001 Confirm baseline scope excludes auth code-flow internals and references specs/002-email-verification-reset for those requirements.
- [x] T002 Verify parity-only plan constraints in specs/001-full-product-baseline/plan.md.
- [x] T003 Verify baseline API contract coverage in specs/001-full-product-baseline/contracts/baseline-product.openapi.yaml against implemented routes.
- [x] T004 Verify baseline entity inventory in specs/001-full-product-baseline/data-model.md against src/server/db/schema.ts.

## Phase 2: Foundational Verification

- [x] T005 Run static checks: npm run lint.
- [x] T006 Verify protected route auth/session behavior in src/app/(dashboard)/layout.tsx and src/lib/session.ts.
- [x] T007 Verify validation utility usage across baseline APIs via src/lib/api-validation.ts and src/app/api/**.
- [x] T008 Verify client error parsing baseline via src/lib/api-error.ts and consumers under src/app/**.

## Phase 3: Authentication Access (No Code-Flow Internals)

- [x] T009 Verify email/password sign-in and Google sign-in surfaces in src/app/login/page.tsx and src/app/signup/page.tsx.
- [x] T010 Verify unauthenticated access redirects to /login using src/app/(dashboard)/layout.tsx and e2e/phase-1-auth.spec.ts.
- [x] T011 Verify logout/session persistence behavior via src/components/logout-button.tsx, src/lib/auth-client.ts, and e2e/phase-1-auth.spec.ts.

## Phase 4: Food Logging

- [x] T012 Verify food search and nutrient resolution APIs via src/app/api/foods/search/route.ts and src/app/api/foods/nutrients/route.ts.
- [x] T013 Verify food-log creation path and Nutritionix snapshot persistence via src/app/api/food-logs/route.ts and src/queries/food-logs.ts.
- [x] T014 Verify totals/meal grouping and empty-state behavior via src/components/food-log-client.tsx and e2e/phase-2-food-logging.spec.ts.
- [x] T015 Verify deletion and invalidation behavior via src/app/api/food-logs/[id]/route.ts and src/queries/food-logs.ts.

## Phase 5: Dashboard and Goals

- [x] T016 Verify daily/weekly analytics endpoints in src/app/api/analytics/daily/route.ts and src/app/api/analytics/weekly/route.ts.
- [x] T017 Verify dashboard data binding in src/app/(dashboard)/dashboard/page.tsx, src/hooks/use-daily-nutrition.ts, and src/hooks/use-weekly-nutrition.ts.
- [x] T018 Verify goals read/update/default fallback in src/app/api/goals/route.ts and src/queries/goals.ts.
- [ ] T019 Verify goals update visibly impacts dashboard progress in an explicit E2E assertion (currently missing dedicated assertion in e2e/phase-3-dashboard.spec.ts).

## Phase 6: Legal and Boundary Classification

- [x] T020 Verify public terms route and rendering in src/app/(legal)/terms/page.tsx.
- [x] T021 Verify public privacy route and rendering in src/app/(legal)/privacy/page.tsx.
- [ ] T022 Verify legal links appear from both auth surfaces; currently missing on src/app/login/page.tsx (present on signup).
- [x] T023 Verify partial/not-implemented boundaries for diet plans, professional verification, and body check-ins remain explicit in specs/001-full-product-baseline/spec.md.

## Runtime Evidence Snapshot

- npm run lint: passed.
- bash ./scripts/run-e2e.sh: executed; 40 passed, 1 flaky (signup gating test under auth-code-flow area).

## Follow-up Delta Tasks

- [ ] D001 Add E2E assertion for goals-update-to-dashboard-progress linkage in e2e/phase-3-dashboard.spec.ts.
- [ ] D002 Add /terms and /privacy links to src/app/login/page.tsx for parity with signup.
- [ ] D003 Keep auth-code-flow flaky test stabilization in specs/002-email-verification-reset task set, not baseline.
