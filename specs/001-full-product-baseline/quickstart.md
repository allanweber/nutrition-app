# Quickstart: Baseline Verification & Parity

## Purpose
Run deterministic checks that confirm current implementation behavior matches `spec.md`, then apply only minimal fixes needed for parity.

## Prerequisites
- `.env.local` and `.env.test` configured.
- Docker running (required by E2E harness).
- PostgreSQL test container ports free.

## 1. Install and static checks
```bash
npm install
npm run lint
```

## 2. DB schema sanity (dev)
```bash
npm run db:push
```

## 3. Baseline E2E parity run (canonical)
```bash
./scripts/run-e2e.sh
```

## 4. Focused parity suites
```bash
./scripts/run-e2e.sh e2e/phase-1-auth.spec.ts
./scripts/run-e2e.sh e2e/phase-2-food-logging.spec.ts
./scripts/run-e2e.sh e2e/phase-3-dashboard.spec.ts
```

## 5. Acceptance evidence checklist
- SC-001: Protected route gating passes in auth suite.
- SC-002/SC-003: Add/delete food log updates counts and totals.
- SC-004: Dashboard cards/charts/recent foods visible for seeded user.
- SC-005: Goals update persists and is reflected in subsequent dashboard fetch.
- SC-006: Public legal pages reachable while logged out.
- SC-007: Baseline docs classify partial/not-implemented areas unambiguously.
- SC-008: Verification/reset code-flow evidence is tracked only in `specs/002-email-verification-reset/`.

## 6. Minimal-change policy during parity fixes
- Prefer test/doc updates first when behavior already satisfies requirement.
- If behavior diverges, make smallest scoped code change in existing modules.
- Re-run impacted E2E suite(s) and collect pass/fail evidence before merging.
