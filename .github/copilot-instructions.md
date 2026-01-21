# Copilot Instructions for Next.js 16 Project

Use this file as project-specific guidance for GitHub Copilot when working in this repository.

## Tech Stack & Project Structure

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Data Fetching:** React Server Components (RSC), Server Actions
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** BetterAuth
- **State Management:** Zustand
- **Testing:** Playwright for end-to-end tests

## Coding Guidelines

- Prefer **React Server Components** by default; add `'use client'` only when necessary.
- Follow App Router conventions: `layout.tsx`, `page.tsx`, `error.tsx`, `loading.tsx`.
- Use TypeScript strictly; avoid `any` and keep types close to the data.
- Prefer Server Actions for mutations; validate inputs on the server.
- Keep DB + auth logic server-side (`src/server/**`, `src/lib/**`).
- Add proper loading + error UI for async boundaries.

## Development Standards

### Architecture

- Group routes by domain/feature using route groups like `src/app/(dashboard)/**`.
- Keep UI components in `src/components/**` and reusable utilities in `src/lib/**`.
- Keep client-only state scoped; use Zustand for cross-page client state only.
- Default to Server Components; use Client Components only for interactivity/hooks.

### Code Style

- Functional components with TypeScript.
- Custom hooks for complex client logic (`src/hooks/**`).
- Proper error boundaries and `loading.tsx` where appropriate.
- Avoid `any`; keep types narrow and explicit.

### Testing Requirements

- Unit tests for utilities (when present/appropriate).
- Integration tests for API routes.
- E2E tests for critical user flows (Playwright).

## Documentation & Tools

- When making Next.js 16-specific decisions, prefer official docs and match existing patterns in the repo.
- Use `next-devtools` for debugging when requested.

## Boundaries

- Never commit API keys or secrets.
- Do not use `page.js` or `layout.js` (use `.tsx`).
- Do not introduce new frameworks or major dependencies without asking.
