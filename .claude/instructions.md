# Claude Instructions for Nutrition App

Use this file as project-specific guidance for Claude when working in this repository.

## Project Overview

**Nutrition App** is a nutrition tracking platform for both individuals and professionals (dietitians, nutritionists).

**Core features:**

- User authentication (email, Google OAuth)
- Daily calorie and macro tracking
- Food logging via Nutritionix API integration
- Nutrition goals setting
- Weekly trend charts and analytics
- Professional verification system for dietitians
- Diet plan management for clients

## Tech Stack & Project Structure

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Data Fetching:** TanStack Query (default), React Server Components (RSC), Server Actions
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** BetterAuth
- **State Management:** Zustand
- **Testing:** Playwright for end-to-end tests

## Data Fetching & State Management

### TanStack Query (React Query) - Default Library

**All API requests must use TanStack Query.** This is the default and required library for data fetching and mutations.

#### Architecture Rules

- **Only pages can use queries directly.** Components must receive data as props from their parent pages.
- All domain-specific queries are organized in `src/queries/` with files like `goals.ts`, `analytics.ts`, `foods.ts`, `food-logs.ts`.
- Mutations automatically invalidate related queries to ensure cache consistency.
- Hooks in `src/hooks/` are maintained for backward compatibility but now use TanStack Query internally.

#### Query Configuration

- Default stale time: 5 minutes
- Default cache time: 10 minutes (formerly cacheTime)
- Devtools enabled in development mode

#### Usage Examples

**Pages (correct usage):**

```typescript
// src/app/(dashboard)/goals/page.tsx
'use client'

import { useGoalsQuery, useUpdateGoalsMutation } from '@/queries/goals'

export default function GoalsPage() {
  const { data: goals, isLoading, error } = useGoalsQuery()
  const updateMutation = useUpdateGoalsMutation()

  const handleUpdate = (newGoals) => {
    updateMutation.mutate(newGoals)
  }

  return <GoalsComponent goals={goals} onUpdate={handleUpdate} />
}
```

**Components (receive data as props - correct usage):**

```typescript
// src/components/goals-component.tsx
interface GoalsComponentProps {
  goals: NutritionGoals | undefined
  onUpdate: (goals: NutritionGoals) => void
}

export default function GoalsComponent({ goals, onUpdate }: GoalsComponentProps) {
  // No queries here - only receives data via props
  return <div>...</div>
}
```

**❌ Incorrect usage (components using queries directly):**

```typescript
// src/components/goals-component.tsx - WRONG!
export default function GoalsComponent() {
  const { data: goals } = useGoalsQuery() // ❌ Never do this
  return <div>...</div>
}
```

#### API Input Validation & Error Handling

**ALL API endpoints MUST validate inputs on the server side using Zod schemas:**

- **Server-Side Validation**: All API routes validate inputs using `src/lib/api-validation.ts`
- **Input Sanitization**: All string inputs are automatically sanitized to prevent XSS and injection attacks
- **Structured Error Responses**: Validation errors return specific field information and user-friendly messages
- **Client Error Display**: Client components use `src/lib/api-error.ts` to display detailed error messages

#### API Validation Schemas (`src/lib/api-validation.ts`)

**Uses existing Zod schemas from `src/server/db/schema.ts` where possible:**

#### API Usage Example

```typescript
// In API routes
import { validateRequestBody, dateSchema } from '@/lib/api-validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');

  if (!dateParam) {
    return NextResponse.json(
      { error: 'Date parameter is required' },
      { status: 400 },
    );
  }

  const dateValidation = validateApiInput(dateSchema, dateParam, 'date');
  if (!dateValidation.success) {
    return createValidationErrorResponse(
      dateValidation.error,
      dateValidation.field,
    );
  }

  // Use dateValidation.data (validated and sanitized)
}
```

#### Client Error Handling (`src/lib/api-error.ts`)

Client components use the error handling utilities to display detailed validation errors:

```typescript
// In client components
import { useApiError, ValidationError } from '@/lib/api-error'

export default function MyForm() {
  const { error, handleError } = useApiError()

  const handleSubmit = async (data) => {
    try {
      await myMutation.mutateAsync(data)
    } catch (err) {
      handleError(err) // Parses API validation errors
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      <ValidationError error={error} field="email" />
      {error && <ValidationError error={error} />} {/* General error */}
    </form>
  )
}
```

#### Error Response Format

API validation errors return structured responses:

```json
{
  "success": false,
  "error": "Calories must be at least 800",
  "field": "calories"
}
```

This allows client components to display field-specific error messages and provide better user experience.

#### Cache Invalidation Rules

Mutations automatically handle cache invalidation:

- Creating/updating/deleting food logs invalidates both food logs and analytics queries
- Updating goals invalidates goals queries

## Available Commands

| Command                   | Description                                |
| ------------------------- | ------------------------------------------ |
| `npm run dev`             | Start development server                   |
| `npm run dev:mock`        | Start dev server with mock Nutritionix API |
| `npm run build`           | Build for production                       |
| `npm run start`           | Start production server                    |
| `npm run lint`            | Run ESLint                                 |
| `npm run test:e2e`        | Run E2E tests with isolated Docker DB      |
| `npm run test:e2e:ui`     | Run E2E tests with Playwright UI           |
| `npm run test:e2e:headed` | Run E2E tests in headed browser            |
| `npm run db:push`         | Push schema changes to database            |
| `npm run db:studio`       | Open Drizzle Studio                        |
| `npm run db:seed`         | Seed database with sample data             |

## Database Setup

### Migrations

```bash
npx drizzle-kit generate  # Generate migration files
npx drizzle-kit migrate   # Apply migrations
npm run db:push           # Push schema directly (dev shortcut)
npm run db:studio         # Visual database management
```

### Schema Location

- Schema: `src/server/db/schema.ts`
- Migrations: `drizzle/`
- Config: `drizzle.config.ts`

### Seed Data

Run `npm run db:seed` to populate the database with sample data. **Important:** The dev server must be running (`npm run dev`) for seeding to work, as it uses the Better Auth API to create users with properly hashed passwords.

```bash
# In one terminal
npm run dev

# In another terminal
npm run db:seed
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable                   | Description                                              |
| -------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`             | PostgreSQL connection string                             |
| `NUTRITIONIX_APP_ID`       | Nutritionix API app ID                                   |
| `NUTRITIONIX_API_KEY`      | Nutritionix API key                                      |
| `BETTER_AUTH_SECRET`       | Secret for BetterAuth (use strong random string in prod) |
| `BETTER_AUTH_URL`          | Base URL for auth (e.g., `http://localhost:3000`)        |
| `GOOGLE_CLIENT_ID`         | Google OAuth client ID                                   |
| `GOOGLE_CLIENT_SECRET`     | Google OAuth client secret                               |
| `NODE_ENV`                 | `development` or `production`                            |
| `PLAYWRIGHT_TEST_BASE_URL` | Base URL for E2E tests                                   |
| `USE_MOCK_NUTRITIONIX`     | Set to `true` to use mock API in tests                   |

## Coding Guidelines

### React & Next.js

- Prefer **React Server Components** by default; use `'use client'` only when necessary.
- Follow App Router conventions: `layout.tsx`, `page.tsx`, `error.tsx`, `loading.tsx`.
- Use Server Actions for mutations; validate inputs on the server.
- Keep DB + auth logic server-side (`src/server/**`, `src/lib/**`).
- Add proper loading + error UI for async boundaries.

### File Naming Conventions

- **All files:** Use `kebab-case` (e.g., `food-search.tsx`, `use-daily-nutrition.ts`)
- **Components:** `kebab-case.tsx` (e.g., `hero.tsx`, `navbar.tsx`)
- **Hooks:** `use-` prefix with kebab-case (e.g., `use-daily-nutrition.ts`)
- **Utilities:** `kebab-case.ts` (e.g., `auth-client.ts`, `utils.ts`)

### Architecture

- Group routes by domain/feature using route groups like `src/app/(dashboard)/**`.
- Keep UI components in `src/components/**` and reusable utilities in `src/lib/**`.
- Prefer composition over prop-drilling; use Zustand for cross-page client state only.

### Code Style

- Functional components with TypeScript.
- Custom hooks for complex client logic (`src/hooks/**`).
- Avoid `any`; keep types close to the data.

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

### Error Boundaries

**TODO:** Add `error.tsx` files for route error boundaries and `loading.tsx` for loading states.

## Testing Requirements

- Unit tests for utilities (when present/appropriate).
- Integration tests for API routes.
- E2E tests for critical user flows (Playwright).

### E2E Test Infrastructure

E2E tests run with an **isolated Docker database** that is created fresh for each test run:

```bash
npm run test:e2e          # Full run with Docker DB lifecycle
npm run test:e2e:ui       # With Playwright UI
npm run test:e2e:headed   # In headed browser mode
```

The test runner script (`scripts/run-e2e.sh`):

1. Starts a fresh PostgreSQL container on port 5433
2. Runs database migrations
3. Seeds the database with test accounts
4. Runs Playwright tests
5. Tears down the container on exit

Tests use seeded accounts (see test accounts in Database Setup section) rather than creating new users, ensuring predictable test data.

## Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
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

**Examples:**

```
feat(auth): add Google OAuth login
fix(dashboard): correct calorie calculation rounding
docs: update README with setup instructions
refactor(api): extract validation logic to utility
```

## Boundaries

- Never commit API keys or secrets.
- Do not use `page.js` or `layout.js` (use `.tsx`).
- Do not introduce new frameworks or major dependencies without asking.

## Documentation & Tools

- When making Next.js 16-specific decisions, prefer official docs and match existing patterns in the repo.
- See `.github/copilot-instructions.md` for additional coding guidelines.
