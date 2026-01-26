# Implementation Plan: Email Verification & Password Reset Codes

**Branch**: `001-email-verification-reset` | **Date**: 2026-01-23 | **Spec**: `/specs/001-email-verification-reset/spec.md`
**Input**: Feature specification from `spec.md`

## Summary

Deliver two code-based auth flows with Resend email delivery:

- **Email verification** for new email/password signups: auto-sign-in, then redirect/gate authenticated routes behind a “Verify Email” page until the user enters a valid code.
- **Forgot password**: request a reset code, then submit code + new password; revoke all sessions after reset.

All endpoints validate inputs server-side with Zod and return the repo’s structured error shape.

## Technical Context

**Language/Version**: TypeScript + Next.js 16 (App Router)
**Primary Dependencies**: Better Auth, Drizzle ORM (Postgres), Zod, TanStack Query/Form, Tailwind + shadcn/ui
**Storage**: PostgreSQL
**Testing**: Playwright E2E (`e2e/**`)
**Target Platform**: Web
**Project Type**: Single Next.js application
**Performance Goals**: Keep gating checks lightweight; avoid extra client bundle cost
**Constraints**:

- No new major infra deps (rate limits via DB)
- Keep auth/DB/email logic server-side (`src/lib/**`, `src/server/**`)
- Avoid cross-user caching on authenticated pages
**Scale/Scope**: Auth-critical flows (signup gating + password reset)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Code quality: changes are scoped, typed, and maintainable.
- Testing: changes are verifiable; critical flows remain covered.
- UX: UI follows existing patterns; states (loading/error/empty) handled.
- Performance: no obvious regressions (bundle bloat, N+1 queries, accidental cross-user caching).
- Safety: server/client boundaries respected; server-side validation used.

## Project Structure

### Documentation (this feature)

```text
specs/001-email-verification-reset/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-code-flows.openapi.yaml
└── checklists/
```

### Source Code (repository root)

```text
src/
 app/
  (dashboard)/
   layout.tsx                      # add gating here (server component)
  api/
   auth/
    [...all]/route.ts             # Better Auth handler
    request-email-verification-code/route.ts
    verify-email-code/route.ts
    request-password-reset-code/route.ts
    reset-password-with-code/route.ts
  verify-email/page.tsx             # code entry UI
  forgot-password/page.tsx          # request reset code UI
  reset-password/page.tsx           # submit code + new password UI

 lib/
  auth.ts                           # Better Auth config
  session.ts                        # session helper used for gating

 server/
  db/
   schema.ts                       # add verification marker/rate-limit tables

e2e/
 phase-1-auth.spec.ts                # extend for new flows

```

**Structure Decision**: Keep changes inside the existing Next.js App Router structure; implement custom code flows as route handlers under `src/app/api/auth/*` and UI pages under `src/app/*`, with server-only logic in `src/lib/**` and `src/server/**`.

## Complexity Tracking

No constitution violations anticipated; no special complexity justification required.

## Design Notes

### Email verification (code-based)

- Trigger: after successful email signup (FR-015), user is signed in but `user.emailVerified` is false.
- UX: redirect user to `/verify-email` and block other authenticated routes (FR-004).
- “New signups only” gating (FR-017): do not gate purely on `emailVerified === false`; instead gate only when the user is unverified **and** has an explicit verification-required marker created at signup time.
- Resends + throttling (FR-016): enforce cooldown + hourly resend cap + wrong-code attempts via DB counters/timestamps.

### Password reset (code-based)

- Request: public endpoint must not reveal whether the email exists (FR-007).
- Store reset codes in Better Auth’s `verification` table using identifier convention `reset-password:${code}`.
- Reset: submit code + new password; revoke all sessions after success (FR-014).

## Phase 0 — Research (complete)

- Decisions recorded in `research.md` (Resend, Better Auth as auth authority, DB-based throttles, custom code-based email verification).

## Phase 1 — Design & Contracts (complete)

- Data model documented in `data-model.md`.
- API contracts documented in `contracts/auth-code-flows.openapi.yaml`.
- Manual validation steps documented in `quickstart.md`.

## Phase 2 — Implementation Plan (next)

1) Add server-side Resend email sender utility + templates.
2) Add DB schema + migrations for verification-required marker + rate limits + security events.
3) Add route handlers under `src/app/api/auth/*` using existing Zod validation helpers.
4) Add pages for `/verify-email`, `/forgot-password`, `/reset-password` using TanStack Form + consistent error display.
5) Add gating logic in authenticated layouts (server-side) with redirect to `/verify-email`.
6) Extend Playwright E2E coverage for signup verification + password reset flows.
