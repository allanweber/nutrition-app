<!--
Sync Impact Report

- Version change: 1.1.0 → 1.2.0
- Modified principles: None renamed or removed.
- Added sections:
  - Repository Rules: "External API Integration" (new, driven by 003-fatsecret-food-retrieval feature)
  - Development Workflow: Conventional Commits convention added
  - Next.js rules: Server Actions guidance added
- Removed sections: None
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check gates — External API gate added implicitly via rule text; no structural change needed)
  - ✅ .specify/templates/spec-template.md (no changes required)
  - ✅ .specify/templates/tasks-template.md (no changes required)
  - ✅ .specify/templates/checklist-template.md (no changes required)
- Follow-up TODOs:
  - AGENTS.md still references Nutritionix API in the project summary and env vars; update it once migration to FatSecret is confirmed complete.
-->

# Vitalis Constitution

This document defines the non-negotiable engineering principles and repository rules for Vitalis.
It is intended to prevent quality regressions, UX inconsistency, and architectural drift.

## Core Principles

### 0) Requirements

All tech stack and project summary can be found in [AGENTS.md](../AGENTS.md).

### 0a) SpecKit Prompt Archive

Before running `/speckit.specify`, the author saves the input prompt to `.specify/prompts/<id>-<slug>.md`.
This is the authoritative record of the original intent for each feature and enables auditing or re-running the SpecKit flow later.

### 1) Code Quality & Maintainability

Code MUST be readable, type-safe, and easy to change.

- Prefer small, composable modules and components; avoid "god files".
- Keep types accurate and close to the data. Avoid `any` and unclear implicit types.
- Avoid duplication; introduce shared utilities when patterns repeat.
- Changes MUST be focused to the task scope; do not mix unrelated refactors.
- File naming MUST follow repository conventions (kebab-case for components/hooks/utilities).

### 2) Testing Standards & Reliability

Changes MUST be verifiable and tests MUST be trustworthy.

- Behavior changes MUST be covered by appropriate tests (unit/integration/e2e) at a level that
  would catch regressions for the affected user flow.
- Bug fixes MUST include a test that would have failed before the fix when practical.
- Fix flaky tests instead of increasing timeouts or adding sleeps.
- Critical user journeys MUST remain covered by Playwright E2E tests.

### 3) User Experience Consistency

UI MUST be consistent, accessible, and predictable.

- Use the existing design system and patterns (Tailwind + shadcn/ui) rather than introducing
  new UI kits.
- Forms MUST follow the repo's form/validation/error-display patterns.
- Loading, empty, and error states MUST be handled for user-facing routes.
- Accessibility SHOULD be preserved (labels, focus management, keyboard navigation) when using
  interactive components.

### 4) Performance & Responsiveness

Features MUST be built with performance in mind and avoid accidental slowdowns.

- Prefer React Server Components by default; use client components only when necessary.
- Avoid unnecessary client-side bundles and heavy dependencies.
- Avoid N+1 database queries; add indexes and efficient queries when needed.
- Avoid cross-user caching risks for authenticated pages and user-specific data.

### 5) Correctness, Safety, and Data Boundaries

User data MUST be handled safely and logic MUST live in the right place.

- Validate input on the server (Zod) and return structured, user-friendly errors.
- Keep auth/session/DB logic server-side; do not import server-only modules into client code.
- Do not leak secrets or sensitive environment variables to the client.

## Repository Rules (Non-Negotiable)

These rules are derived from repository conventions and are required for new work.

### Next.js (App Router)

- Default to React Server Components; add `'use client'` only when required (forms, interactive charts, client state).
- Route handlers live under `src/app/api/**` and MUST validate input server-side.
- Use Server Actions where appropriate; inputs MUST still be validated server-side.
- Be explicit about dynamic requirements for authenticated/user-specific pages to avoid accidental static/cross-user caching.
- Keep DB/auth/session logic server-side under `src/server/**` and `src/lib/**`.
- Do not use `page.js` or `layout.js` (use `.tsx`).

### Data Fetching (TanStack Query)

- All API requests MUST use TanStack Query.
- Only **pages** may call queries directly.
- Components MUST receive data via props from their parent pages.
- Mutations MUST invalidate/refresh related queries to keep cache consistent.

### Forms (TanStack Form)

- All forms MUST use `@tanstack/react-form`.
- Forms MUST provide:
  - Field-level validation + error display (red border + message).
  - Form-level submission error display.
  - Loading/disabled states while submitting.

### API Validation & Error Contract

- All API endpoints MUST validate input server-side using Zod.
- Prefer the existing helpers in `src/lib/api-validation.ts` and existing string sanitization utilities.
- Validation errors MUST return structured responses:
  - `{ success: false, error: string, field?: string }`
- Client code MUST parse/display these via `src/lib/api-error.ts`.

### External API Integration

Features that integrate external data providers MUST follow these rules:

- External provider persistence MUST be performed asynchronously in the background so the user
  experience is never blocked by write operations.
- Frequently accessed external data MUST be cached locally to reduce repeated outbound calls
  and improve response times.
- All external provider interactions (successful queries, errors, rate-limit events) MUST be
  logged to support operational monitoring and troubleshooting.
- External provider errors (connectivity failures, rate limits, timeouts) MUST be handled
  gracefully: surface user-friendly messages only; never expose raw error codes or provider
  internals to the user.
- Duplicate records from external providers MUST be prevented; concurrent save conflicts are
  silently discarded (last writer wins) with no error surfaced to the user.

### UI System

- Prefer existing components under `src/components/ui/**` and existing styling patterns.
- Do not introduce a second UI kit.

### Database (Drizzle + Postgres)

- Schema changes belong in `src/server/db/schema.ts`.
- Generate migrations via the repo's Drizzle flow and keep migrations focused.
- Prefer Drizzle ORM over raw SQL unless there is a clear reason.

### Dependencies & Boundaries

- Do not introduce new frameworks/major dependencies without explicit approval.
- Use Zustand only when needed; prefer server state (Query) and local state first.
- Avoid editing generated artifacts (`.next/`, `playwright-report/`, `test-results/`) unless explicitly asked.
- Never commit API keys or secrets.

## Quality & Performance Standards

- API endpoints MUST validate inputs server-side using the existing validation utilities.
- Mutations MUST invalidate/refresh relevant TanStack Query caches to keep UI consistent.
- Authenticated/user-specific views MUST not be accidentally static/cached across users.
- Performance regressions MUST be treated as bugs (investigate bundle size, waterfalls, DB query efficiency, and caching).

## Development Workflow

- Start with a short plan and acceptance criteria, then create a task checklist.
- Track work in GitHub issues; implement one issue per branch.
- Follow the repo workflow: do work locally, wait for Allan's review before committing, then commit/push and open a PR referencing the issue (e.g., `Closes #123`).
- Commit messages MUST follow [Conventional Commits](https://www.conventionalcommits.org/):
  `<type>[optional scope]: <description>` — valid types: `feat`, `fix`, `docs`, `style`,
  `refactor`, `perf`, `test`, `chore`.

## Governance

This constitution supersedes all other development guidance.

- Amendments require: rationale, scope, and explicit description of what changes in expected
  behavior or workflow.
- Versioning:
  - MAJOR for backward-incompatible governance changes.
  - MINOR for adding a new principle or materially expanding guidance.
  - PATCH for clarifications/wording that do not change meaning.
- Reviews SHOULD explicitly check changes against these principles.

**Version**: 1.2.0 | **Ratified**: 2026-01-23 | **Last Amended**: 2026-03-16
