# Research: Full Product Baseline Verification

## Decision 1: Treat existing implementation as the baseline and verify parity to spec
- Decision: Use `specs/001-full-product-baseline/spec.md` as the requirement baseline, then map each requirement to existing routes, pages, DB entities, and E2E tests before proposing any code change.
- Rationale: The feature request is parity/verification work, not net-new feature implementation.
- Alternatives considered: Build missing product workflows now. Rejected because this would exceed baseline scope and blur verification outcomes.

## Decision 2: Use current stack exactly; avoid introducing new frameworks or major dependencies
- Decision: Keep Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, TanStack Form, Drizzle/Postgres, BetterAuth, minimal Zustand, and Playwright as-is.
- Rationale: This is repository policy and matches installed dependencies and current architecture.
- Alternatives considered: Introduce additional test/documentation tooling. Rejected to reduce risk and keep changes minimal.

## Decision 3: Verify behavior primarily through existing E2E runner and targeted test additions
- Decision: Use `./scripts/run-e2e.sh` as the canonical baseline verification path, then fill only missing acceptance coverage with focused Playwright tests.
- Rationale: The script provisions test DB, migrations, seed data, and dev server consistently.
- Alternatives considered: Ad-hoc local runs (`npm run dev` + manual testing). Rejected because it is less reproducible.

## Decision 4: Document partial/not-implemented areas as explicit parity boundaries
- Decision: Keep diet plans as partial API/data capability, and professional verification/body check-ins as explicitly not implemented for end-user workflows.
- Rationale: The spec requires transparent status classification, and current routes/UI support this boundary.
- Alternatives considered: Reclassify these as in-progress features. Rejected because current user journeys are incomplete.

## Decision 5: Keep API contracts as baseline snapshots of current route behavior
- Decision: Generate OpenAPI contract docs for currently implemented baseline endpoints used by auth, food logs, analytics, goals, foods, and limited diet-plan operations.
- Rationale: Contract snapshots create measurable parity checks without forcing implementation expansion.
- Alternatives considered: Delay contracts until after feature development. Rejected because this work is parity/documentation-first.
