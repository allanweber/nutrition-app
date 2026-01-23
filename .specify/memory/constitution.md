<!--
Sync Impact Report

- Version change: 1.0.0 → 1.1.0
- Modified principles: Expanded to incorporate repo conventions from AGENTS.md (Next.js, Query/Form, validation contract, DB, UI, workflow)

- Templates requiring updates:

  - ✅ .specify/templates/plan-template.md (Constitution Check gates)
  - ✅ .specify/templates/spec-template.md (no changes required)
  - ✅ .specify/templates/tasks-template.md (no changes required)
  - ✅ .specify/templates/checklist-template.md (no changes required)
  - ⚠️ TODO: If you later require tests for *all* changes (TDD-only), update tasks-template.md wording
-->

# Nutrition App Constitution

This document defines the non-negotiable engineering principles and repository rules for Nutrition App.
It is intended to prevent quality regressions, UX inconsistency, and architectural drift.

## Core Principles

### 0) Requirements

All tech stack and project summary can be found in [AGENTS.md](../AGENTS.md).

### 1) Code Quality & Maintainability

Code MUST be readable, type-safe, and easy to change.

- Prefer small, composable modules and components; avoid “god files”.
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
- Forms MUST follow the repo’s form/validation/error-display patterns.
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

### UI System

- Prefer existing components under `src/components/ui/**` and existing styling patterns.
- Do not introduce a second UI kit.

### Database (Drizzle + Postgres)

- Schema changes belong in `src/server/db/schema.ts`.
- Generate migrations via the repo’s Drizzle flow and keep migrations focused.
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
- Follow the repo workflow: do work locally, wait for Allan’s review before committing, then commit/push and open a PR referencing the issue (e.g., `Closes #123`).

## Governance

This constitution supersedes all other development guidance.

- Amendments require: rationale, scope, and explicit description of what changes in expected
  behavior or workflow.
- Versioning:
  - MAJOR for backward-incompatible governance changes.
  - MINOR for adding a new principle or materially expanding guidance.
  - PATCH for clarifications/wording that do not change meaning.
- Reviews SHOULD explicitly check changes against these principles.

**Version**: 1.1.0 | **Ratified**: 2026-01-23 | **Last Amended**: 2026-01-23
