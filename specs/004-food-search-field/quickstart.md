# Quickstart: Unified Food Search Field Component

**Feature**: `004-food-search-field` | **Date**: 2026-03-19

---

## Environment Setup

No new environment variables required. Existing variables are sufficient:

```env
DATABASE_URL=...         # already set
FATSECRET_CLIENT_ID=...  # already set
FATSECRET_CLIENT_SECRET=... # already set
```

## Local Development

```bash
# Start dev server (existing workflow)
npm run dev

# Run E2E tests for this feature
npm run test:e2e -- --grep "004"

# Or run the full E2E suite
npm run test:e2e
```

## Key Files to Understand First

Before implementing, read these files to understand the existing patterns:

1. **`src/components/food-search.tsx`** — the component being replaced; understand what it does before deleting it
2. **`src/app/(dashboard)/food-log/page.tsx`** — the page being refactored; understand how it currently wires search state
3. **`src/queries/foods.ts`** — existing TanStack Query hook for food search (reused unchanged)
4. **`src/queries/food-detail.ts`** — existing TanStack Query hook for food detail (reused in modal)
5. **`src/server/services/food-search.service.ts`** — existing search orchestration (unchanged)
6. **`src/server/db/schema.ts`** — `foods` table schema (look at `userId` field — `null` for shared catalog foods, set for custom user foods)

## Implementation Order

Follow this order to keep the app functional at each step:

1. **`src/components/food-search-field/types.ts`** — define shared types first
2. **`src/hooks/use-search-history.ts`** — isolated localStorage hook, no dependencies
3. **`src/queries/custom-foods.ts`** — new TanStack Query hook
4. **`src/app/api/foods/custom/search/route.ts`** — new API endpoint
5. **`src/components/food-search-field/`** — build sub-components bottom-up (result-item → states → tabs → history-list → suggestions → dropdown → input → index)
6. **`src/components/food-log-add-modal.tsx`** — modal using existing form patterns
7. **`src/app/(dashboard)/food-log/page.tsx`** — refactor to use new component (test that existing diary functionality is unchanged)
8. **`src/components/landing/search-section.tsx`** — client wrapper for landing page
9. **`src/app/page.tsx`** — add `<SearchSection>` to landing page
10. **`src/app/foods/[fatSecretId]/page.tsx`** — public food details SSR page
11. **`src/proxy.ts`** — add rate limiting logic (add last to avoid interfering with development)
12. **`e2e/004-food-search-field.spec.ts`** — E2E tests covering all 4 user stories

## Testing the Key Flows

### P1 — Food log search and add to diary
1. Log in, navigate to `/food-log`
2. Type "chicken" in the search field — results appear in tabs
3. Click a result — modal opens with meal type and serving selectors
4. Confirm — food appears in diary for selected meal

### P2 — Anonymous landing page search
1. Open an incognito window, navigate to `/`
2. Type "apple" in the landing page search field — Common and Branded tabs appear (no Custom tab)
3. Select a result — navigate to `/foods/[fatSecretId]`
4. Verify page source contains food name and nutritional info

### P3 — Search history
1. Perform 3 different searches, then clear the input
2. Focus the input — 3 history entries appear, most recent first
3. Click a history entry — search executes immediately
4. Type a partial word matching a previous search — suggestion appears

### P4 — Keyboard navigation
1. Type "egg" in the food log search field
2. Press ↓ twice — 3rd result highlighted
3. Press ↑ once — 2nd result highlighted
4. Press Enter — modal opens for the highlighted food
5. Press Escape — search field cleared, dropdown closed

## Deleting the Old Component

After verifying the food log page works correctly with the new component:

```bash
rm src/components/food-search.tsx
# Update any remaining imports (should only be in food-log/page.tsx, which is already refactored)
```

Run lint and E2E to confirm no regressions before committing.
