# Research: Unified Food Search Field Component

**Feature**: `004-food-search-field` | **Date**: 2026-03-19

---

## 1. Custom Foods — Data Model & Search Strategy

**Decision**: Serve custom foods from a new dedicated `/api/foods/custom/search` endpoint.

**Rationale**: The existing `food-search.service.ts` queries only `source = 'fatsecret'` foods. Custom foods (`isCustom = true`, `userId = user.id`) are user-scoped and require an authenticated server query that the existing public-facing service cannot provide. Keeping this as a separate endpoint avoids modifying the existing API contract (FR-022) while correctly enforcing auth boundaries.

**Findings from codebase**:
- `foods` table has `isCustom: boolean('is_custom').default(false)` and `userId: text('user_id').references(() => users.id)`
- Existing search service explicitly filters `eq(foods.source, 'fatsecret')` — custom foods are excluded
- No existing endpoint exposes custom food search

**Alternatives considered**:
- Extend existing `/api/foods/search` to include custom foods — rejected; would require auth on a currently-public endpoint, violating FR-022 and adding complexity
- Client-side filter from a "my foods" list — rejected; not scalable for large custom food libraries

---

## 2. Result Tab Mapping

**Decision**: Map `foodType: 'Generic'` → Common tab, `foodType: 'Brand'` → Branded tab, custom DB foods → Custom tab via a unified `UnifiedFoodSearchResultItem` type with `foodType: 'Generic' | 'Brand' | 'Custom'`.

**Rationale**: FatSecret uses `Generic`/`Brand` internally; the product uses `Common`/`Branded`/`Custom` as user-facing labels. The mapping is a display concern handled in the component, not in the API. The `FoodSearchField` component applies the label mapping at render time.

**Tab visibility rule** (from clarification Q1): Custom tab is hidden when `showCustomTab = false` (anonymous users); only Common and Branded tabs are shown.

---

## 3. Rate Limiting — Public Routes

**Decision**: In-memory sliding-window rate limiter added to the existing `src/proxy.ts`, 60 requests/minute per IP. Applies to `/foods/**` and `/api/foods/search`.

**Rationale**: No rate limiting currently exists. The constitution requires protection for public endpoints. An in-memory approach requires no new packages. Next.js 16 uses `proxy.ts` (named `proxy` export) instead of `middleware.ts` — rate limiting is added to the existing `proxy` function before the auth session check, so rejected requests avoid unnecessary auth overhead.

**Implementation pattern**:
```typescript
// src/proxy.ts — added before auth session check
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 60;
const WINDOW_MS = 60_000;

// Check if path matches /foods/** or /api/foods/search
// Read IP from x-forwarded-for or remote addr
// Check/increment counter; return 429 with Retry-After if exceeded
// Cleanup stale entries periodically
```

**Routes covered**: `/foods/**` and `/api/foods/search` — checked before auth redirect logic in `proxy.ts`

**Alternatives considered**:
- Upstash Redis rate limiting — rejected; introduces new dependency and requires external service
- Creating a new `middleware.ts` — rejected; not valid in Next.js 16 (project uses `proxy.ts`)
- No rate limiting — rejected; spec FR-023 requires it

---

## 4. Anonymous Food Details Page — URL & Data Strategy

**Decision**: `/foods/[fatSecretId]/page.tsx` — FatSecret ID is the canonical URL parameter. Server checks local DB first (`WHERE sourceId = :fatSecretId`), falls back to FatSecret API on miss.

**Rationale**: Using FatSecret ID as the canonical identifier gives stable, predictable URLs for SEO. If the food is later cached locally, the URL doesn't change. The same URL is shareable regardless of local cache state.

**SEO implementation**: `generateMetadata` returns `{ title: foodName, description: "Nutritional information for {foodName}" }`. Page uses RSC with `export const dynamic = 'force-dynamic'` only if personalization is needed; otherwise statically renderable per food.

**Error handling** (from clarification Q4): If both local DB and FatSecret API fail, render a user-friendly error page with a link back to the landing page search. No 404 — the food may be temporarily unavailable.

**Alternatives considered**:
- `/foods/db/[id]` vs `/foods/fs/[id]` namespaced routes — rejected; doubles URL surface area, poor for SEO
- Internal DB ID as URL — rejected; unstable (food may not be cached yet on first visit)

---

## 5. TanStack Query Placement & Reusability

**Decision**: `useFoodSearch(options)` hook encapsulates query calls, debouncing (300ms), and combined state. Pages and client wrappers call this hook; `FoodSearchField` receives state via props. Landing page uses a `<SearchSection>` client component as the interactive boundary.

**Rationale**: Follows the constitution rule ("Only pages may call queries directly; components receive data via props"). The `SearchSection` client component acts as the page-equivalent boundary for the landing page's search section — it owns the data-fetching responsibility for that isolated UI region.

**Existing queries reused**:
- `useFoodSearchQuery` (`src/queries/foods.ts`) — unchanged
- `useFoodDetailQuery` (`src/queries/food-detail.ts`) — unchanged, used by add-to-diary modal

**New queries**:
- `useCustomFoodSearchQuery` (`src/queries/custom-foods.ts`) — calls `/api/foods/custom/search`

---

## 6. Search History — localStorage Strategy

**Decision**: Key `fsf-search-history`, JSON array of `SearchHistoryEntry`, max 30 entries, deduplicated by lowercased term, entries expire after 30 days of inactivity.

**Implementation**:
- Read on component mount; filter expired entries immediately
- On new search: check if `normalizedTerm` exists → update `lastAccessedAt` + move to front; otherwise prepend new entry + trim to 30
- On history item click: update `lastAccessedAt` before triggering search
- Persistence: write to `localStorage` after every mutation

**No server involvement** — confirmed by clarification Q2. History is device-local for all users.
