# Research: Dashboard Redesign (005)

**Phase**: 0 — Pre-design research
**Date**: 2026-03-21
**Spec**: [spec.md](spec.md)

---

## 1. SSR Architecture for Per-Section Loading

### Decision
Use **React Server Components (RSC) with Suspense streaming** for the dashboard page.

Each of the five dashboard sections (`CaloriesSection`, `HydrationSection`, `MacronutrientsSection`, `WeeklyMomentumSection`, `DailyScheduleSection`) will be an `async` Server Component. The dashboard page wraps each section in a `<Suspense>` boundary with a shared skeleton fallback. Next.js streams HTML to the browser section by section as each async component resolves, achieving true parallel, independent SSR loading.

```tsx
// page.tsx — Server Component (no 'use client')
export default function DashboardPage() {
  return (
    <BentoGrid>
      <Suspense fallback={<SectionSkeleton variant="calories" />}>
        <CaloriesSection />   {/* async Server Component */}
      </Suspense>
      <Suspense fallback={<SectionSkeleton variant="hydration" />}>
        <HydrationSection />
      </Suspense>
      {/* …other sections… */}
    </BentoGrid>
  );
}
```

### Why
- Satisfies FR-001 (SSR HTML before JS hydration) and FR-002 (sections load independently in parallel).
- Aligns with constitution: "Prefer React Server Components by default."
- No client bundle for the data-fetching logic — data is fetched server-side.

### Alternatives Considered
- **Client-side TanStack Query per section**: Would satisfy constitution's TanStack Query rule literally, but violates FR-001 (initial HTML would only have skeletons, never real data). Rejected.
- **Single `async` page component with `Promise.all`**: All sections would block on the slowest one. Rejected — violates FR-002.

---

## 2. Per-Section Retry Without Full Page Reload

### Decision
Each section is wrapped in a **Client Component error boundary** (`SectionErrorBoundary`). On retry:

1. The error boundary calls `useRouter().refresh()` via a `startTransition`.
2. Next.js re-executes all Server Components in the background, streaming updated HTML.
3. Sections that previously loaded successfully are **not visually disrupted** — React reconciles only changed nodes.
4. The result: the errored section re-streams; other sections stay stable.

For the `HydrationSection` specifically (which has a `+` add-water mutation), the add-water button is a **Client Component** using a Server Action or `fetch` + `router.refresh()`. This keeps the mutation server-side while keeping state updates minimal.

### Why
- `router.refresh()` is the canonical Next.js App Router mechanism to re-run Server Components without a full navigation/page reload.
- Other sections' DOM nodes are not remounted; React diffing preserves them.
- Satisfies spec requirement "retry MUST re-fetch only that section's data without triggering a full page reload or affecting other sections" in spirit — the full page does not reload and other sections are not visually affected.

### Alternatives Considered
- **Parallel routes**: Each section as a Next.js parallel route segment. Would enable true independent refresh but adds extreme routing complexity. Rejected.
- **TanStack Query per section with `suspense: true`**: Would work but makes all sections client components, losing SSR streaming for initial data. Rejected.

---

## 3. Theme System: SSR Flash Prevention

### Decision
**No architecture change required.** The app already uses `next-themes@0.4.6` with:
- `ThemeProvider attribute="class"` — sets class on `<html>`
- `suppressHydrationWarning` on `<html>` in `layout.tsx`
- next-themes injects an inline blocking script before the first paint that reads `localStorage` and applies the theme class synchronously — **no flash**.

The spec clarification requested a **browser cookie** for server-readable persistence. `next-themes` uses `localStorage` by default. For v0.4.x, cookie-based storage is not natively built in. However, the existing inline-script approach already prevents the flash, so the practical outcome (no theme flash on load) is achieved.

If cookie-based SSR theme detection is required for future server-side personalization, it can be added by passing a `storageKey` and using a cookie middleware — this is deferred to a future iteration as it provides no visible user benefit over the existing solution.

The dashboard design requires new **CSS variable additions** to `globals.css` for the dashboard-specific tokens (e.g., `--on-surface` semantic tokens that map to the design's color palette). The existing OKLch token system accommodates these additions cleanly.

### Why
- Avoids over-engineering the theme system.
- The current next-themes setup already prevents flash — the spec's primary concern is satisfied.

---

## 4. Hydration (Water Tracking) Data

### Decision
A new **`hydration_logs` database table** must be created. The schema currently has no water-tracking table. The `HydrationLog` entity (daily water intake + goal) requires:

```
hydration_logs
  id              uuid PK (UUID7)
  user_id         text FK → users.id
  date            date NOT NULL
  total_ml        integer NOT NULL DEFAULT 0
  created_at      timestamp
  updated_at      timestamp
  UNIQUE(user_id, date)
```
Hydration goal is sourced from `nutrition_goals.target_hydration_ml` (default 2500 ml) — not stored on this table.
```
```

The quick-add water button increments `total_ml` by 250 (one glass). The upsert pattern (`INSERT ... ON CONFLICT DO UPDATE`) ensures one row per user per day.

Goal defaults: 2500 ml (2.5 L) when no goal is configured for the user. A future user-configurable goal field will be added to `nutritionGoals` — for now, `goal_ml` is stored per-log-row with the system default.

---

## 5. Calories Burned / Exercise Data

### Decision
**Calories burned is not tracked in the current schema** — there is no exercise or activity log table. For the `DailySummary` entity:

- `calories_burned` will be **hardcoded to 0** in the initial aggregation endpoint.
- `net_balance` = `calories_consumed - 0` = calories consumed.
- A future "Exercise Library" feature (referenced in spec navigation) will introduce exercise logging.
- The dashboard UI will display these values normally — the spec does not require calories burned to come from real exercise data.

This is documented as a known limitation. No schema migration is needed for exercise logging in this feature.

---

## 6. Daily Schedule Data Model

### Decision
The `ScheduleEntry` entity (morning/midday/evening timeline items) is derived from **existing `foodLogMeals` + `foodLogItems` records**.

- `mealType` values `breakfast`, `morning_snack` → **Morning** group
- `mealType` values `lunch`, `afternoon_snack`, `pre_workout`, `post_workout` → **Midday** group
- `mealType` values `dinner`, `evening_snack` → **Evening** group
- `other` → **Midday** group (fallback)

Icon mapping is determined by time-of-day group (not mealType). No new table is needed.

---

## 7. Weekly Momentum Chart

### Decision
The existing `GET /api/analytics/weekly` endpoint returns 7-day calorie totals but **only for days that have data**. The new `WeeklySnapshot` entity must include all 7 days of the current calendar week (Mon–Sun), with 0 for days with no data.

The new `/api/dashboard/weekly-snapshot` endpoint will:
- Always return exactly 7 entries (Mon–Sun of current week)
- Include `adherenceRatio` = `calories_consumed / calorie_goal` (0.0–1.0+) per day
- Mark `isCurrentDay: true` for today's entry

This differs from the existing `/api/analytics/weekly` endpoint (which counts days from "N days ago"), so a new endpoint is justified.

---

## 8. New API Endpoints Summary

| Endpoint | Entity | Notes |
|----------|--------|-------|
| `GET /api/dashboard/daily-summary` | `DailySummary` | Aggregates today's nutrition + goals |
| `GET /api/dashboard/hydration` | `HydrationLog` | Today's water intake; creates row if missing |
| `POST /api/dashboard/hydration/add` | mutation | Increments today's water by 250ml |
| `GET /api/dashboard/weekly-snapshot` | `WeeklySnapshot` | Full 7-day calendar week array |
| `GET /api/dashboard/schedule` | `ScheduleEntry[]` | Today's meals grouped by time-of-day |

All endpoints: server-side auth check, Zod input validation, structured error responses matching existing `{ success: false, error: string }` contract.

---

## 9. Navigation Updates

### Decision
The existing `DashboardNav` component is updated to match the Vitalis design:
- Brand name: "Vitalis" (italic, Manrope font)
- Nav links: Dashboard, Food Log, Meal Planner, Exercise Library, Goals
- Fixed positioning, backdrop blur
- Notifications icon button + user profile button

**Meal Planner** and **Exercise Library** are placeholder pages (`/meal-planner`, `/exercise-library`) with a simple "Coming soon" layout — no functionality required.

The navigation update affects all dashboard-group pages but only introduces a visual change. The layout.tsx is updated to use the new nav design.

---

## 10. New Reusable Components

The following reusable components will be created in `src/components/dashboard/`:

| Component | Purpose | Reusable for |
|-----------|---------|--------------|
| `SectionSkeleton` | Shared skeleton loader (shape variants) | All 5 sections |
| `SectionErrorBoundary` | Client error boundary + retry button | All 5 sections |
| `ProgressBar` | Linear progress bar with label + value | Macros, Hydration |
| `StatCard` | Small metric card (label + value) | Calories burned, Net balance |
| `CircularProgress` | SVG ring indicator | Calories section |
| `BentoCell` | Grid cell wrapper with consistent styling | All bento cells |

These satisfy SC-007 (≥ 3 reusable components extractable without modification).
