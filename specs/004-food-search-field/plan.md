# Implementation Plan: Unified Food Search Field Component

**Branch**: `004-food-search-field` | **Date**: 2026-03-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-food-search-field/spec.md`

## Summary

Replace the monolithic `FoodSearch` component with a unified `FoodSearchField` component featuring tabbed results (Common / Branded / Custom), search history, keyboard navigation, and autocomplete suggestions. Add a food-log add-to-diary modal, a landing page `SearchSection` client wrapper, a public SSR food details page, a new custom foods search API endpoint, and rate limiting on public routes via the existing `src/proxy.ts`. DB schema is unchanged.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20
**Primary Dependencies**: Next.js 16 (App Router), TanStack Query v5, TanStack Form v0, shadcn/ui (Radix primitives), Drizzle ORM, BetterAuth, Playwright
**Storage**: PostgreSQL (Drizzle ORM) for food data; browser `localStorage` for search history (device-local, no server storage)
**Testing**: Playwright E2E only (no unit test runner)
**Target Platform**: Web (browser + server)
**Project Type**: Full-stack web application (Next.js App Router)
**Performance Goals**: Search results within 1s of query; debounce 300ms; history read synchronous
**Constraints**: No new major dependencies; DB schema unchanged; existing API contracts unchanged

## Constitution Check

*Re-checked after proxy.ts update (2026-03-19)*

| Principle | Status | Notes |
|-----------|--------|-------|
| RSC by default, `'use client'` only for interactive | ✅ | `FoodSearchField`, `SearchSection`, food-log page are client; SSR page is RSC |
| TanStack Query called only from pages/client wrappers | ✅ | `useFoodSearch()` hook called by page & `SearchSection`; component receives props |
| TanStack Form for all forms | ✅ | Add-to-diary modal uses TanStack Form |
| Zod validation on all API endpoints | ✅ | `/api/foods/custom/search` uses Zod schema |
| shadcn/ui only — no second UI kit | ✅ | All new UI uses existing shadcn/ui components |
| Drizzle for all DB access | ✅ | Custom food search queries via Drizzle |
| No new major dependencies | ✅ | In-memory rate limiting in proxy.ts; no new packages |
| FatSecret fire-and-forget persistence | ✅ | Existing service unchanged (FR-022) |
| Graceful error handling | ✅ | All error states have user-friendly fallback UI |
| Public endpoint protection | ✅ | Rate limiting added to `src/proxy.ts` for `/foods/**` and `/api/foods/search` |
| No DB schema changes | ✅ | `userId` field drives custom food scoping (`null` = shared catalog, set = user-owned) |
| Authentication via BetterAuth | ✅ | Custom food endpoint checks session; proxy.ts handles auth |

## Project Structure

### Documentation (this feature)

```text
specs/004-food-search-field/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── search-field-props.md
│   ├── api-foods-custom-search.md
│   └── page-foods-detail.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code Changes

```text
NEW files:
src/
├── components/
│   ├── food-search-field/
│   │   ├── types.ts                    # UnifiedFoodSearchResultItem, FoodSearchState, FoodSearchFieldProps
│   │   ├── index.tsx                   # FoodSearchField root (client)
│   │   ├── input.tsx                   # Search input with clear button
│   │   ├── dropdown.tsx                # Dropdown container
│   │   ├── tabs.tsx                    # Common / Branded / Custom tab switcher
│   │   ├── result-item.tsx             # Single food result row
│   │   ├── history-list.tsx            # Recent searches list
│   │   ├── suggestions.tsx             # Inline autocomplete suggestion
│   │   └── states.tsx                  # Loading, empty, error states
│   ├── landing/
│   │   └── search-section.tsx          # Client wrapper for landing page search
│   └── food-log-add-modal.tsx          # Add-to-diary modal (TanStack Form)
├── hooks/
│   └── use-search-history.ts           # localStorage hook
├── queries/
│   └── custom-foods.ts                 # useCustomFoodSearchQuery
└── app/
    ├── api/
    │   └── foods/
    │       └── custom/
    │           └── search/
    │               └── route.ts        # GET /api/foods/custom/search
    └── foods/
        └── [fatSecretId]/
            └── page.tsx                # Public SSR food details page

MODIFIED files:
src/
├── app/
│   ├── (dashboard)/
│   │   └── food-log/
│   │       └── page.tsx                # Refactored: use FoodSearchField + FoodLogAddModal
│   └── page.tsx                        # Add <SearchSection> to landing page
└── proxy.ts                            # Add rate limiting for /foods/** and /api/foods/search

DELETED files:
src/
└── components/
    └── food-search.tsx                 # Replaced by food-search-field/ directory
```

## Phase 0: Research Summary

See [research.md](research.md) for full rationale. Key decisions:

1. **Custom foods endpoint**: New `/api/foods/custom/search` — existing service excludes custom foods; separation keeps FR-022 intact
2. **Tab mapping**: `Generic` → Common, `Brand` → Branded, `userId IS NOT NULL` → Custom; mapping is a display concern in the component
3. **Rate limiting**: In-memory sliding-window added to `src/proxy.ts` (Next.js 16 uses `proxy.ts` instead of `middleware.ts`); 60 req/min per IP on `/foods/**` and `/api/foods/search`; no new packages required
4. **Food details URL**: `/foods/[fatSecretId]` — canonical, stable for SEO; DB-first then FatSecret API fallback
5. **Query placement**: `useFoodSearch()` hook owned by pages and `SearchSection` client wrapper; `FoodSearchField` is purely prop-driven
6. **Search history**: `fsf-search-history` localStorage key; dedup by lowercased term; 30-entry cap; 30-day TTL

## Phase 1: Design Summary

### Component Architecture

```
FoodSearchField (client)
├── input.tsx              — controlled text input, clear button, Escape handling
├── dropdown.tsx           — portal-positioned container, closes on outside click
│   ├── history-list.tsx   — shown when query = "" and history exists
│   ├── suggestions.tsx    — inline autocomplete when query partially matches history
│   ├── states.tsx         — loading skeleton, empty state, error+retry, "type 3 chars"
│   └── tabs.tsx           — Common / Branded / Custom tabs (showCustomTab gate)
│       └── result-item.tsx — food row with thumbnail, name, brand, calories, highlight
└── (parent manages keyboard state: highlightedIndex, activeTab)
```

### Data Flow

```
food-log/page.tsx (client)
  └─ useFoodSearch({ includeCustom: true })
       ├─ useFoodSearchQuery(query)          → /api/foods/search     (existing)
       └─ useCustomFoodSearchQuery(query)    → /api/foods/custom/search (new)
  └─ <FoodSearchField state={...} onSelect={openModal} />
  └─ <FoodLogAddModal food={selected} />
       └─ useFoodDetailQuery(food)           → /api/foods/detail     (existing)

landing page.tsx (RSC)
  └─ <SearchSection />  (client boundary)
       └─ useFoodSearch({ includeCustom: false })
       └─ <FoodSearchField showCustomTab={false} onSelect={navigateToDetail} />

/foods/[fatSecretId]/page.tsx (RSC)
  └─ DB query (Drizzle) → FatSecret API fallback → render or error page
```

### Rate Limiting in proxy.ts

Rate limiting is added within `src/proxy.ts` before the auth session check. An in-memory `Map<string, { count: number; resetAt: number }>` tracks request counts per IP. Requests to `/foods/**` or `/api/foods/search` that exceed 60/minute receive a `429 Too Many Requests` response with a `Retry-After` header. The rate limit check runs before the BetterAuth session lookup to avoid unnecessary auth overhead on rejected requests.
