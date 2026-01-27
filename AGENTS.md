# AGENTS.md — Nutrition App Agent Instructions (Single Source of Truth)

This document is the single source of truth for AI agents (Copilot, Claude, Gemini, etc.) working in this repository.

If your tool supports “custom instructions”, point it at this file.

Other agent instruction files may exist only as **pointers** to this file. Do not duplicate rules in multiple places.

## Project Summary

**Nutrition App** is a nutrition tracking platform for individuals and professionals (dietitians/nutritionists).

Core product areas:

- Authentication (email + Google OAuth)
- Daily calorie + macro tracking
- Food logging via Nutritionix API integration
- Nutrition goals
- Weekly trends + analytics charts
- Professional verification
- Diet plan management

## Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- UI components: shadcn/ui (Radix primitives)
- Data fetching: TanStack Query (React Query)
- Forms: TanStack Form (`@tanstack/react-form`)
- Database: PostgreSQL + Drizzle ORM
- Auth: BetterAuth
- Client state: Zustand (only when needed)
- E2E tests: Playwright

## Repository Conventions

- Default to React Server Components (RSC). Add `'use client'` only when required.
- File naming: kebab-case (components, hooks, utilities).
- Keep DB/auth logic server-side under `src/server/**` and `src/lib/**`.
- Don’t introduce new frameworks/major deps without asking.

Key paths:

- DB schema: `src/server/db/schema.ts`
- API validation: `src/lib/api-validation.ts`
- Client API error parsing: `src/lib/api-error.ts`
- Query modules: `src/queries/**`
- Back-compat hooks: `src/hooks/**`
- App routes: `src/app/**`
- Shared UI: `src/components/ui/**`

## External Authoritative References (Read When Needed)

These are authoritative guides; prefer linking to them rather than copying large sections into this repo:

- Next.js LLM reference: <https://nextjs.org/docs/llms-full.txt>
- shadcn/ui LLM reference: <https://ui.shadcn.com/llms.txt>
- Drizzle ORM LLM reference: <https://orm.drizzle.team/llms-full.txt>
- Resend LLM reference: <https://resend.com/docs/llms-full.txt>

## Data Fetching Rules (TanStack Query)

- All API requests must use TanStack Query.
- Only **pages** may call queries directly.
- Components must receive data via props from their parent pages.
- Mutations must invalidate/refresh related queries to keep cache consistent.

## Forms Rules (TanStack Form)

- All forms must use `@tanstack/react-form`.
- Provide field-level validation + error display (red border + message).
- Provide form-level submission error display.
- Provide loading/disabled states while submitting.

## API Validation + Error Handling

- All API endpoints must validate input server-side using Zod (prefer the helpers in `src/lib/api-validation.ts`).
- Strings must be sanitized via the existing validation utilities.
- Validation errors must return structured responses:
  - `{ success: false, error: string, field?: string }`
- Client code should parse/display these via `src/lib/api-error.ts`.

## Next.js Guidance (App Router)

Follow official Next.js guidance as the authoritative reference.

### Conventions

- Prefer App Router structure: `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`.
- Default to Server Components; add `'use client'` only when needed (forms, interactive charts, client state).
- Route handlers live under `src/app/api/**` and must validate input.

### Server vs Client boundaries

- Keep DB/auth/session logic server-side (`src/server/**`, `src/lib/**`).
- Don’t import server-only modules into client components.

### Caching/dynamic behavior

- Be explicit about dynamic requirements for authenticated/user-specific pages.
- Avoid accidentally making sensitive data static/cached across users.

### Navigation + mutations

- Use Server Actions where appropriate (still validate inputs server-side).
- When mutating via APIs, ensure client cache invalidation (TanStack Query) and/or Next.js revalidation as needed.

### App Router do/don’t (repo pitfalls)

#### Do

- Keep DB/auth/session logic server-side (`src/server/**`, `src/lib/**`).
- Be explicit for user-specific pages to avoid cross-user caching.
- Prefer server components for data access; move interactivity into small client components.

#### Don’t

- Don’t import server-only modules into client components (if you need a client component, pass data in via props or call an API route).
- Don’t accidentally make authenticated pages static/cached across users.
- Don’t store secrets in client code or expose sensitive env vars.

## UI Guidance (shadcn/ui)

Follow shadcn/ui principles:

- Open Code + Composition: prefer composing existing primitives/components.
- When adding UI components, prefer installing through the shadcn CLI (and keep consistent styling).
- Use existing components under `src/components/ui/**` rather than adding a second UI kit.

Notes:

- Prefer existing project styling patterns (Tailwind + shadcn primitives).
- For dialogs/drawers, use shadcn `Dialog`/`Sheet` patterns.
- For charts, use the existing Recharts usage in `src/components/charts/**` and keep charts as client components.

## Database Guidance (Drizzle + Postgres)

- Schema changes belong in `src/server/db/schema.ts`.
- Generate migrations with `drizzle-kit generate` (or the repo’s preferred flow).
- Apply locally with `npm run db:push` in development.
- Keep relations and type exports up to date.

Guidelines:

- Prefer Drizzle ORM for all queries; avoid raw SQL unless necessary.
- Keep schema changes focused; don’t mix unrelated schema tweaks.
- Ensure new tables/columns have appropriate indexes and `onDelete` behavior.

## Planning Workflow (Required)

When starting new work:

1. **Plan**: write a short, implementation-ready plan with assumptions and acceptance criteria.
2. **Create tasks**: turn the plan into a checklist that is easy to execute and verify.
3. **Create GitHub issues**: create one issue per logical chunk (with acceptance criteria) and link tasks to issues.

## Coding Workflow (Branching + Review + PR)

For each GitHub issue:

- Create a branch named: `{issue-id}-{lowercasetitle}`
  - Use only a short title fragment.
  - Do **not** include “phase” or numbering in the title.
- Implement all work for that issue on that branch.
- **Wait for Allan’s review before committing anything.** (Keep work local/uncommitted.)
- After approval: commit, push, and create a PR referencing the issue (e.g., `Closes #123`).

Notes:

- Keep changes focused to the issue scope; don’t fix unrelated lint/test issues.
- Prefer root-cause fixes over superficial patches.

## Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, or tooling

## Boundaries

- Never commit API keys or secrets.
- Do not use `page.js` or `layout.js` (use `.tsx`).
- Do not introduce new frameworks or major dependencies without asking.
- Avoid editing generated artifacts (`.next/`, `playwright-report/`, `test-results/`) unless explicitly asked.

## Commands

Common scripts (see `package.json` for the full list):

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run db:push`
- `npm run db:seed`
- `npm run test:e2e`

E2E runner convention:

- Always run Playwright E2E through `./scripts/run-e2e.sh` (it provisions the Docker test DB, runs migrations + seed, and starts the dev server on the test port). Pass any Playwright args through, e.g. `./scripts/run-e2e.sh e2e/phase-1-auth.spec.ts -g "cooldown"`.

Notes:

- For local env setup, follow `README.md` and copy `.env.example` to `.env.local`.
- DB schema lives at `src/server/db/schema.ts` and migrations live under `drizzle/`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable                   | Description                                              |
| -------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`             | PostgreSQL connection string                             |
| `USDA_API_KEY`             | USDA FoodData Central API key (server-side)              |
| `FATSECRET_CLIENT_ID`      | FatSecret client id (server-side)                        |
| `FATSECRET_CLIENT_SECRET`  | FatSecret client secret (server-side)                    |
| `BETTER_AUTH_SECRET`       | Secret for BetterAuth (use strong random string in prod) |
| `BETTER_AUTH_URL`          | Base URL for auth (e.g., `http://localhost:3000`)        |
| `GOOGLE_CLIENT_ID`         | Google OAuth client ID                                   |
| `GOOGLE_CLIENT_SECRET`     | Google OAuth client secret                               |
| `NODE_ENV`                 | `development` or `production`                            |
| `PLAYWRIGHT_TEST_BASE_URL` | Base URL for E2E tests                                   |
| `USE_MOCK_NUTRITION_SOURCES` | Set to `true` to use mock nutrition sources (tests)    |

## Error Handling

### API Routes

Use try/catch with structured JSON responses:

```typescript
try {
  // ... logic
} catch (error) {
  console.error('Error description:', error);
  return NextResponse.json({ error: 'User-friendly message' }, { status: 500 });
}
```

### Client Hooks

Use state-based error handling:

```typescript
const [error, setError] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);
```
