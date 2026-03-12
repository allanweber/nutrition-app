# Implementation Plan: Full Product Baseline

**Branch**: `001-full-product-baseline` | **Date**: 2026-03-11 | **Spec**: `/specs/001-full-product-baseline/spec.md`
**Input**: Feature specification from `/specs/001-full-product-baseline/spec.md`

## Summary

This plan delivers baseline verification and parity, not speculative product expansion. Work will validate that implemented behavior across authentication access control, food logging, analytics, goals, and legal pages matches the feature specification. Any code edits are intentionally minimal and limited to parity gaps revealed by evidence (tests, route behavior, or documentation mismatch).

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 16.1.2, React 19.2.3)  
**Primary Dependencies**: Next.js 16 App Router, Tailwind CSS 4, shadcn/ui (Radix), TanStack Query v5, TanStack Form, BetterAuth, Drizzle ORM, Zod, Zustand (minimal), Recharts  
**Storage**: PostgreSQL via Drizzle ORM (`drizzle-orm` + `postgres`)  
**Testing**: Playwright E2E (`@playwright/test`) with deterministic harness `./scripts/run-e2e.sh`; ESLint for static checks  
**Target Platform**: Web application (server-rendered + client interactivity) on Linux/macOS development environments  
**Project Type**: Single Next.js web app (App Router)  
**Performance Goals**: Preserve current UX responsiveness; avoid adding bundle weight or extra network round trips; keep authenticated pages safe from cross-user cache leakage  
**Constraints**: No new frameworks/major deps; parity-first scope; keep server/client boundaries intact; use existing validation/error utilities; keep changes focused and reviewable  
**Scale/Scope**: Baseline verification for full current product surface in spec (5 user stories, FR-001 through FR-014, SC-001 through SC-008)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Pre-Phase 0 assessment:
- Code quality: PASS. Plan is scoped to parity checks and minimal deltas.
- Testing: PASS. Existing Playwright phases cover core flows; gaps will be filled only where measurable criteria are currently unverified.
- UX: PASS. Existing Tailwind + shadcn/ui patterns remain unchanged unless a parity fix requires a minor adjustment.
- Performance: PASS. No architecture changes; focus on verification and targeted fixes only.
- Safety: PASS. Existing server-side validation (`src/lib/api-validation.ts`) and client parsing (`src/lib/api-error.ts`) are preserved and reinforced by tests/docs.

Post-Phase 1 assessment:
- Code quality: PASS.
- Testing: PASS with explicit verification sequence in quickstart.
- UX: PASS with loading/empty/error state verification retained in acceptance checks.
- Performance: PASS; no broad refactors introduced.
- Safety: PASS; auth/session/DB boundaries remain server-side.

## Project Structure

### Documentation (this feature)

```text
specs/001-full-product-baseline/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── baseline-product.openapi.yaml
└── tasks.md  # created in speckit.tasks phase
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (dashboard)/
│   ├── (legal)/
│   └── api/
├── components/
│   ├── ui/
│   └── charts/
├── queries/
├── hooks/
├── lib/
├── server/
│   ├── db/
│   └── email/
└── stores/

e2e/
├── phase-1-auth.spec.ts
├── phase-2-food-logging.spec.ts
└── phase-3-dashboard.spec.ts

scripts/
└── run-e2e.sh
```

**Structure Decision**: Keep the existing single Next.js App Router structure. Parity work targets documentation, E2E coverage, and minimal code changes inside established modules only.

## In Scope vs Out of Scope

In scope:
- Verify and document baseline behavior for all scenarios in `spec.md`.
- Add/adjust tests where measurable success criteria are not currently asserted.
- Apply minimal fixes only for confirmed parity mismatches.
- Clarify partial/not-implemented boundaries for diet plans, professional verification, and body check-ins.

Out of scope:
- Email verification and password reset code-flow details (owned by `specs/002-email-verification-reset/`).
- Building full end-user workflows for diet plans, professional verification, or body check-ins.
- Introducing new libraries or architectural changes.
- Unrelated refactors and broad UI redesign.

## Data Flow (Baseline)

1. Auth and session flow:
  - Client forms submit via BetterAuth endpoints and auth access routes under `src/app/api/auth/**`.
  - Server validates input with Zod utilities and manages session/authenticated access boundaries.
  - Protected dashboard routes rely on server-side session checks and redirect unauthenticated users.

  Note: verification/reset code lifecycle behavior is documented in `specs/002-email-verification-reset/`.

2. Food logging flow:
  - Client pages call TanStack Query hooks in `src/queries/**`.
  - Hooks request `foods/search` or `foods/nutrients`, then create/read/delete `food-logs`.
  - On mutation success, related query keys are invalidated to refresh logs and analytics.

3. Dashboard/goals flow:
  - Dashboard pulls daily and weekly analytics endpoints.
  - Goals read/update through `/api/goals`; updates affect subsequent dashboard progress computation.

4. Public legal flow:
  - Terms and privacy routes in `(legal)` remain unauthenticated and directly reachable.

## Validation and Error-Handling Strategy

- Server input validation:
  - All route handlers in scope continue using Zod-based schemas and helpers from `src/lib/api-validation.ts`.
  - Validation failures return structured responses: `{ success: false, error: string, field?: string }`.

- Client error parsing:
  - UI flows parse response errors via `src/lib/api-error.ts` to display field-level and form-level messages.

- Auth access behavior:
  - Authenticated routes remain protected and redirect unauthenticated users.
  - Verification/reset code behavior remains owned by `specs/002-email-verification-reset/`.

- Parity fix rule:
  - If behavior and spec disagree, prefer minimal targeted fix plus regression test.

## Risks and Mitigations

1. Risk: False parity confidence from only happy-path tests.
  - Mitigation: Keep edge-case assertions (cooldowns, invalid/expired codes, unauthorized access) as required checks.

2. Risk: Flaky E2E results due to environment drift.
  - Mitigation: Use `./scripts/run-e2e.sh` for deterministic DB + seed + server orchestration.

3. Risk: Scope creep into unfinished product areas.
  - Mitigation: Treat diet plans/professional verification/body check-ins as boundary documentation unless a spec mismatch is proven.

4. Risk: Accidental cross-user cache/data leaks.
  - Mitigation: Re-verify authenticated route behavior and keep user-specific data handling server-side.

## Assumptions

1. Current route and UI behavior in this repository is the baseline implementation target.
2. Required environment variables and third-party integrations (Google OAuth, email, Nutritionix or mock) are configured for verification runs.
3. Existing E2E suites represent the canonical end-to-end baseline and can be incrementally extended.
4. Parity work can ship with zero functional expansion beyond minimal mismatch fixes.

## Implementation Plan

### Phase A: Baseline Inventory and Traceability

1. Build requirement traceability matrix from FR-001..FR-014 and SC-001..SC-008 to:
  - Implemented route handlers (`src/app/api/**`).
  - UI routes/components (`src/app/**`, `src/components/**`).
  - Existing E2E specs (`e2e/phase-*.spec.ts`).
2. Mark each requirement as `covered`, `partially covered`, or `missing assertion`.
3. Confirm explicit scope status for partial/not-implemented areas.

Exit criteria:
- Every FR/SC has a mapped implementation and verification status.

### Phase B: Documentation and Contract Parity

1. Finalize baseline docs (`plan.md`, `research.md`, `data-model.md`, `quickstart.md`).
2. Maintain API contract snapshot under `contracts/` for implemented endpoints only.
3. Ensure terminology consistency across spec and artifacts.

Exit criteria:
- Docs unambiguously communicate what is implemented now vs intentionally incomplete.

### Phase C: Test Gap Fill (Minimal)

1. Add or refine Playwright assertions only where SC coverage is missing.
2. Keep tests deterministic via seeded data and existing helpers.
3. Re-run affected suites through `./scripts/run-e2e.sh`.

Exit criteria:
- All success criteria are measurably asserted in automated or explicitly documented manual checks.

### Phase D: Minimal Parity Fixes (Only If Needed)

1. Apply smallest code changes required to resolve proven mismatches.
2. Preserve architecture and existing patterns (TanStack Query/Form, validation utilities, shadcn/ui).
3. Add regression tests for each fixed mismatch.

Exit criteria:
- Spec and implementation are aligned for baseline scope without speculative feature additions.

## Measurable Verification Steps

1. Static checks: `npm run lint` passes.
2. Environment-integrated parity: `./scripts/run-e2e.sh` passes for chromium baseline.
3. Auth parity: `./scripts/run-e2e.sh e2e/phase-1-auth.spec.ts` verifies SC-001 and protected-route access.
4. Food log parity: `./scripts/run-e2e.sh e2e/phase-2-food-logging.spec.ts` verifies SC-002 and SC-003.
5. Dashboard parity: `./scripts/run-e2e.sh e2e/phase-3-dashboard.spec.ts` verifies SC-004 and mobile visibility checks.
6. Goals parity: confirm goals update persistence and dashboard reflection via existing API + dashboard assertions (SC-005).
7. Legal parity: verify logged-out access to terms/privacy routes (SC-006).
8. Documentation parity: confirm explicit status labels for partial/not-implemented areas in spec artifacts (SC-007).
9. Verify ownership split: confirm email verification/password reset requirements are covered only in `specs/002-email-verification-reset/` (SC-008).

## Complexity Tracking

No constitution violations identified. Complexity exceptions are not required for this plan.
