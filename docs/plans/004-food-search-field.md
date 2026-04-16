# Unified Food Search Field Component — Implementation Plan

## Context

Replace the monolithic `FoodSearch` component with a unified `FoodSearchField` component featuring tabbed results (Common / Branded / Custom), search history, keyboard navigation, and autocomplete suggestions. Add a food-log add-to-diary modal, a landing page `SearchSection` client wrapper, a public SSR food details page, a new custom foods search API endpoint, and rate limiting on public routes.

---

## Design Decisions

### Component Architecture
```
FoodSearchField (client)
├── input.tsx           — controlled text input, clear button, Escape handling
├── dropdown.tsx        — portal-positioned container, closes on outside click
│   ├── history-list.tsx    — shown when query = "" and history exists
│   ├── suggestions.tsx     — inline autocomplete when query partially matches
│   ├── states.tsx          — loading skeleton, empty state, error+retry
│   └── tabs.tsx            — Common / Branded / Custom tabs
│       └── result-item.tsx — food row with thumbnail, name, brand, calories
└── (parent manages: highlightedIndex, activeTab, keyboard nav)
```

### Custom Foods Strategy
- New `/api/foods/custom/search` endpoint for user-scoped foods
- Existing search service queries only shared catalog (`userId IS NULL`)
- Custom foods have non-null `userId`

### Tab Mapping
- `foodType: 'Generic'` → Common tab
- `foodType: 'Brand'` → Branded tab
- `userId IS NOT NULL` → Custom tab (authenticated only)

### Rate Limiting
- In-memory sliding-window in `src/proxy.ts` (Next.js 16)
- 60 requests/minute per IP
- Applies to `/foods/**` and `/api/foods/search`
- Checked before auth session lookup

### Food Details Page
- URL: `/foods/[fatSecretId]`
- FatSecret ID is canonical for SEO stability
- DB-first, FatSecret API fallback on miss
- SSR for search engine indexing

### Search History
- localStorage key: `fsf-search-history`
- Max 30 entries, 30-day TTL
- Deduplicated by lowercased term
- Device-local only (no server sync)

### Query Placement
- `useFoodSearch()` hook owned by pages/client wrappers
- `FoodSearchField` is purely prop-driven (presentational)
- Follows constitution: "Only pages may call queries directly"

---

## Schema Changes Required

**No schema changes** - existing `userId` field on `foods` drives custom food scoping.

---

## Files to Create

### Component Directory (`src/components/food-search-field/`)

| File | Purpose |
|------|---------|
| `types.ts` | `UnifiedFoodSearchResultItem`, `FoodSearchState`, `FoodSearchFieldProps` |
| `index.tsx` | FoodSearchField root client component |
| `input.tsx` | Search input with clear button |
| `dropdown.tsx` | Portal-positioned dropdown container |
| `tabs.tsx` | Common / Branded / Custom tab switcher |
| `result-item.tsx` | Single food result row |
| `history-list.tsx` | Recent searches list |
| `suggestions.tsx` | Inline autocomplete suggestions |
| `states.tsx` | Loading, empty, error states |

### Additional Components

| File | Purpose |
|------|---------|
| `src/components/landing/search-section.tsx` | Client wrapper for landing page search |
| `src/components/food-log-add-modal.tsx` | Add-to-diary modal (TanStack Form) |

### Hooks

| File | Purpose |
|------|---------|
| `src/hooks/use-food-search.ts` | Merges useFoodSearchQuery + useCustomFoodSearchQuery |
| `src/hooks/use-search-history.ts` | localStorage search history |

### Query Hooks

| File | Purpose |
|------|---------|
| `src/queries/custom-foods.ts` | useCustomFoodSearchQuery |

### API Routes

| File | Purpose |
|------|---------|
| `src/app/api/foods/custom/search/route.ts` | Custom foods search (authenticated) |

### Pages

| File | Purpose |
|------|---------|
| `src/app/foods/[fatSecretId]/page.tsx` | Public SSR food details page |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/(dashboard)/food-log/page.tsx` | Refactor to use FoodSearchField + FoodLogAddModal |
| `src/app/page.tsx` | Add SearchSection to landing page |
| `src/proxy.ts` | Add rate limiting for /foods/** and /api/foods/search |
| `src/components/food-search.tsx` | DELETE (replaced by food-search-field/) |

---

## Key Data Shapes

### FoodSearchState (hook return)
```typescript
interface FoodSearchState {
  query: string;                      // Current raw query string
  results: UnifiedFoodSearchResultItem[];  // All loaded results
  isLoading: boolean;                  // True while any request in-flight
  error: string | null;                // User-friendly error message
  hasMore: boolean;                    // True when more results can be loaded
  page: number;                        // Current pagination page
}

interface UnifiedFoodSearchResultItem {
  id: string | null;                  // local DB UUID; null if not yet cached
  fatSecretId: string | null;          // FatSecret food_id; null for custom
  name: string;
  brandName: string | null;
  foodType: 'Generic' | 'Brand' | 'Custom';
  thumbnail: string | null;
  calories: number | null;
}
```

### SearchHistoryEntry (localStorage)
```typescript
interface SearchHistoryEntry {
  term: string;              // Original search term
  normalizedTerm: string;    // Lowercased for dedup
  lastAccessedAt: number;   // Unix timestamp (ms)
}
```

### GET /api/foods/custom/search
```typescript
// Response
{
  results: Array<{
    id: string;
    name: string;
    brandName: string | null;
    thumbnail: string | null;
    calories: number | null;
  }>;
  total: number;
}
```

---

## Implementation Order

1. **Setup**: Read existing code to understand current implementation
2. **Foundational**: Create shared types, result-item, states, use-food-search hook
3. **User Story 1** (P1 - MVP): Food Log Search & Add to Diary
   - Create custom-foods query + API route
   - Create tabs, dropdown, input, FoodSearchField
   - Create FoodLogAddModal
   - Refactor food-log page
4. **User Story 2** (P2): Anonymous Landing Page Search
   - Create SearchSection for landing page
   - Create food details page (SSR)
   - Add rate limiting to proxy.ts
5. **User Story 3** (P3): Search History & Autocomplete
   - Create use-search-history hook
   - Create history-list, suggestions components
   - Integrate into FoodSearchField
6. **User Story 4** (P4): Keyboard Navigation
   - Add ArrowDown/ArrowUp/Enter/Escape handling
   - Update result-item with highlight state
7. **Polish**: E2E tests, lint, responsive validation

---

## Verification Checklist

- [ ] Food log: search displays tabbed results (Common/Branded/Custom)
- [ ] Food log: click food opens modal with meal type + serving selectors
- [ ] Food log: add to diary persists entry correctly
- [ ] Landing page: anonymous user can search and see Common/Branded tabs only
- [ ] Landing page: selecting food navigates to food details page
- [ ] Food details page: SSR renders with full nutritional info
- [ ] Search history: focus shows recent searches (up to 5)
- [ ] Search history: typing shows autocomplete suggestions
- [ ] Keyboard nav: arrows highlight, Enter selects, Escape clears
- [ ] Rate limiting: 60 req/min enforced on public endpoints
- [ ] npm run lint passes
