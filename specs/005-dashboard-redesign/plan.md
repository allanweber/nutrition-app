# Implementation Plan: Dashboard Redesign

**Branch**: `005-dashboard-redesign` | **Date**: 2026-03-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-dashboard-redesign/spec.md`

---

## Summary

Redesign the user dashboard with a bento-grid layout supporting light and dark themes. The page is rendered server-side using Next.js App Router React Server Components with Suspense streaming, so each of the five sections (Calories, Hydration, Macronutrients, Weekly Momentum, Daily Schedule) loads independently and in parallel. A new `hydration_logs` table and four new aggregation API endpoints are introduced. All five section components, shared loading/error UI, and a reusable component library are built to serve as the foundation for future dashboard features.

---

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20
**Primary Dependencies**: Next.js 16.1.2 (App Router), React 19, Recharts 3.6, TanStack Query v5, next-themes 0.4.6, Drizzle ORM 0.45, shadcn/ui (Radix), Tailwind CSS 4
**Storage**: PostgreSQL (Drizzle ORM) — new `hydration_logs` table + migration
**Testing**: Playwright (E2E); Jest/Vitest not currently present — integration tests via existing test setup
**Target Platform**: Web (Next.js SSR, desktop + mobile viewports 375px–2560px)
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: Initial HTML with navigation and section structure in < 1.5s (SC-001)
**Constraints**: No new UI kit, no new charting library; reuse existing Recharts and shadcn/ui
**Scale/Scope**: Single dashboard page, 5 sections, ~15 new components, 5 new API routes (4 GET endpoints + 1 POST mutation), 1 new DB table

---

## Constitution Check

### Gates

| Principle | Status | Notes |
|-----------|--------|-------|
| RSC by default | ✅ Pass | Dashboard page and all 5 section components are async Server Components |
| `use client` only when required | ✅ Pass | Client only for: error boundary, add-water button, weekly chart (Recharts), theme toggle |
| API routes validate input server-side (Zod) | ✅ Pass | All 4 new endpoints use Zod + `validateApiInput` helper |
| TanStack Query for client-side requests | ✅ Pass | Add-water mutation uses a Server Action (no TanStack Query mutation needed); read endpoints are RSC |
| Loading/empty/error states for user-facing routes | ✅ Pass | Every section has Suspense skeleton + error boundary (FR-003, FR-004) |
| Existing design system (Tailwind + shadcn/ui) | ✅ Pass | No new UI kit; extending existing tokens in globals.css |
| DB logic server-side only | ✅ Pass | New data access functions in `src/server/services/` |
| No new major dependencies | ✅ Pass | No new packages needed |
| Conventional Commits | ✅ Pass | All commits follow `feat:`, `refactor:`, `chore:` convention |

### Complexity Tracking

No constitution violations. No justification table needed.

---

## Project Structure

### Documentation (this feature)

```text
specs/005-dashboard-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 entity definitions + new DB table
├── contracts/
│   └── api-dashboard.md # Phase 1 API contracts
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code Layout

```text
src/
├── app/
│   ├── globals.css                         # Add dashboard color tokens
│   ├── layout.tsx                          # No changes needed — next-themes inline script already prevents theme flash (see research.md §3)
│   ├── (dashboard)/
│   │   ├── layout.tsx                      # Update: new DashboardNav + full-width layout
│   │   ├── dashboard/
│   │   │   └── page.tsx                    # REPLACE: async RSC bento-grid layout
│   │   ├── meal-planner/
│   │   │   └── page.tsx                    # NEW: placeholder page
│   │   └── exercise-library/
│   │       └── page.tsx                    # NEW: placeholder page
│   └── api/
│       └── dashboard/
│           ├── daily-summary/
│           │   └── route.ts                # NEW: DailySummary endpoint
│           ├── hydration/
│           │   ├── route.ts                # NEW: HydrationLog GET endpoint
│           │   └── add/
│           │       └── route.ts            # NEW: add-water POST endpoint
│           ├── weekly-snapshot/
│           │   └── route.ts                # NEW: WeeklySnapshot endpoint
│           └── schedule/
│               └── route.ts                # NEW: ScheduleEntry[] endpoint
│
├── server/
│   ├── db/
│   │   └── schema.ts                       # Add: hydrationLogs table + zod schemas
│   └── services/
│       └── dashboard.service.ts            # NEW: server-side data fetching functions
│
├── components/
│   ├── dashboard-nav.tsx                   # UPDATE: Vitalis design header
│   └── dashboard/
│       ├── index.ts                        # barrel export
│       ├── shared/
│       │   ├── section-skeleton.tsx        # Shared skeleton loader (shape variants)
│       │   ├── section-error-boundary.tsx  # Client error boundary + retry button
│       │   ├── progress-bar.tsx            # Linear progress bar (macros, hydration)
│       │   ├── stat-card.tsx               # Small metric card (burned, net balance)
│       │   ├── bento-cell.tsx              # Grid cell wrapper
│       │   └── section-nudge.tsx           # "Set your goals" nudge banner
│       ├── calories/
│       │   ├── calories-section.tsx        # Async RSC wrapper
│       │   ├── calories-content.tsx        # Visual content (receives data via props)
│       │   └── circular-progress.tsx       # SVG ring indicator
│       ├── hydration/
│       │   ├── hydration-section.tsx       # Async RSC wrapper
│       │   ├── hydration-content.tsx       # Visual content
│       │   └── add-water-button.tsx        # 'use client' — Server Action mutation
│       ├── macronutrients/
│       │   ├── macronutrients-section.tsx  # Async RSC wrapper
│       │   └── macronutrients-content.tsx  # Visual content
│       ├── weekly-momentum/
│       │   ├── weekly-momentum-section.tsx # Async RSC wrapper
│       │   └── weekly-momentum-chart.tsx   # 'use client' — Recharts bar chart
│       └── daily-schedule/
│           ├── daily-schedule-section.tsx  # Async RSC wrapper
│           └── daily-schedule-content.tsx  # Visual content (3-column grid)
│
# Note: src/queries/dashboard.ts deferred — dashboard sections use RSC direct service calls.
# TanStack Query hooks will be added if client-side dashboard widgets are introduced.
```

**Structure Decision**: Single Next.js project (Option 1). Dashboard components are co-located under `src/components/dashboard/` with a shared sub-folder for reusable primitives. Server-side data functions live in `src/server/services/dashboard.service.ts`, following the existing `food-search.service.ts` pattern.

---

## Implementation Phases

### Phase A: Foundation (DB + API)

**Goal**: Establish the data layer. No UI changes yet.

#### A1 — DB Schema: Add `hydration_logs` table

**File**: `src/server/db/schema.ts`
- Add `hydrationLogs` Drizzle table definition (see [data-model.md](data-model.md))
- Add Zod insert/select schemas: `insertHydrationLogSchema`, `selectHydrationLogSchema`
- Export type aliases: `HydrationLog`, `NewHydrationLog`
- Add relation to `users` in `usersRelations`

**Migration**: Run `drizzle-kit generate` to create the migration file. Add migration to repo.

#### A2 — Dashboard Service

**File**: `src/server/services/dashboard.service.ts`

Server-side data fetching functions (no TanStack Query — called from async RSC):

```typescript
getDailySummary(userId: string, date: string): Promise<DailySummaryDTO>
getHydrationLog(userId: string, date: string): Promise<HydrationLogDTO>
addWater(userId: string, date: string): Promise<HydrationLogDTO>
getWeeklySnapshot(userId: string): Promise<WeeklySnapshotDTO>
getDailySchedule(userId: string, date: string): Promise<DailyScheduleDTO>
```

Each function:
- Accepts `userId` (already authenticated, auth not re-checked here)
- Returns typed DTOs matching the API contract shapes
- Applies default goal values when user has no active goal (`hasGoal: false`)
- Groups schedule entries into `{ morning, midday, evening }` — always all three keys

#### A3 — API Route Handlers

**Files**: `src/app/api/dashboard/*/route.ts` (4 routes + 1 action)

Each route handler:
1. `getCurrentUser()` → 401 if not found
2. Parse + Zod-validate query params
3. Call the corresponding dashboard service function
4. Return `NextResponse.json({ ... })`

All routes use `export const dynamic = 'force-dynamic'` to prevent accidental static caching.

Routes:
- `GET /api/dashboard/daily-summary` — query: `date?`
- `GET /api/dashboard/hydration` — no params
- `POST /api/dashboard/hydration/add` — no body
- `GET /api/dashboard/weekly-snapshot` — no params
- `GET /api/dashboard/schedule` — query: `date?`

---

### Phase B: Global Styles + CSS Tokens

**Goal**: Update `globals.css` to include all design tokens required by the dashboard design.

**File**: `src/app/globals.css`

Add missing semantic tokens that the dashboard design references but are not yet in the file:

```css
/* Design tokens for dashboard (light) */
:root {
  --on-surface: var(--foreground);             /* maps to on-surface semantic */
  --on-surface-variant: oklch(0.45 0.03 160);  /* secondary text */
  --secondary: oklch(0.50 0.02 220);           /* muted label color */
  --tertiary: oklch(0.65 0.22 355);            /* rose-toned accent token — NOT for macro bars; macro bars use MACRO_COLORS from nutrition-constants.ts */
}

/* Dark theme overrides */
.dark {
  --on-surface: var(--foreground);
  --on-surface-variant: oklch(0.65 0.025 255);
  --secondary: oklch(0.60 0.025 255);
  --tertiary: oklch(0.72 0.22 355);
}
```

Also add the `editorial-gradient` pattern as a CSS class:
```css
.editorial-gradient {
  background: linear-gradient(135deg, var(--primary), oklch(0.35 0.14 160));
}
```

**Note**: The design's color tokens already substantially overlap with the existing OKLch token system. The goal is to ensure all design-referenced tokens resolve correctly in both light and dark modes.

---

### Phase C: Navigation + Layout

**Goal**: Update the dashboard navigation to match the Vitalis design.

#### C1 — Update `DashboardNav`

**File**: `src/components/dashboard-nav.tsx`

Changes:
- Brand: "Vitalis" (italic, `font-headline`, `text-primary`)
- Nav links: Dashboard, Food Log, Meal Planner, Exercise Library, Goals
- Fixed top positioning (`fixed top-0 z-50`)
- Backdrop blur (`bg-background/80 backdrop-blur-md`)
- Active link: bottom border indicator (`border-b-2 border-primary`)
- Right side: Notifications icon button + profile button (replaces current ThemeSwitcher + UserNav)
- Theme toggle: moved into a dropdown from the profile button, or retained as icon button

#### C2 — Update Dashboard Layout

**File**: `src/app/(dashboard)/layout.tsx`

Changes:
- Remove `max-w-6xl mx-auto` constraint from main (dashboard uses `max-w-screen-2xl`)
- Add `pt-16` top padding to account for the new fixed header
- Keep auth check and user session logic unchanged

#### C3 — Placeholder Pages

**Files**:
- `src/app/(dashboard)/meal-planner/page.tsx`
- `src/app/(dashboard)/exercise-library/page.tsx`

Each: Simple RSC with heading and "Coming soon" message. No data fetching.

---

### Phase D: Reusable Components

**Goal**: Build the shared dashboard component primitives before implementing sections.

#### D1 — `SectionSkeleton`

**File**: `src/components/dashboard/shared/section-skeleton.tsx`

Props: `variant: 'calories' | 'hydration' | 'macros' | 'weekly' | 'schedule'`

Renders an `animate-pulse` skeleton that matches the target section's visual footprint (same height, same approximate shape). Used as the `<Suspense fallback>` for each section.

#### D2 — `SectionErrorBoundary`

**File**: `src/components/dashboard/shared/section-error-boundary.tsx`

Client Component (`'use client'`).
- Extends React's `ErrorBoundary` pattern
- Shows error icon + "Something went wrong" message + "Retry" button
- Retry: calls `useRouter().refresh()` wrapped in `startTransition`
- Consistent visual shape across all sections (same height as skeleton)

#### D3 — `ProgressBar`

**File**: `src/components/dashboard/shared/progress-bar.tsx`

Props: `label`, `value`, `goal`, `unit`, `color` (Tailwind bg class), `percentage`

Renders a labeled progress bar matching the macro/hydration design. Zero-safe (empty bar when value=0). Over-goal: bar fills completely.

#### D4 — `StatCard`

**File**: `src/components/dashboard/shared/stat-card.tsx`

Props: `label`, `value`, `unit?`

Small metric card matching the "Burned" and "Net Balance" cards in the calories section.

#### D5 — `CircularProgress`

**File**: `src/components/dashboard/calories/circular-progress.tsx`

Props: `percentage` (0–100+), `label`, `value`, `size?`

SVG-based ring indicator. Uses `stroke-dashoffset` calculation. Over-100% = full ring. No external library needed.

#### D6 — `BentoCell`

**File**: `src/components/dashboard/shared/bento-cell.tsx`

Props: `children`, `className?`

Wrapper div with consistent bento cell styling: `rounded-[24px] bg-surface-container-low border border-outline-variant shadow-sm p-8`.

#### D7 — `SectionNudge`

**File**: `src/components/dashboard/shared/section-nudge.tsx`

Props: `message?`

Small inline nudge banner: "Set your goals →" with a link to `/goals`. Shown when `hasGoal: false` in any section.

---

### Phase E: Dashboard Page + Sections

**Goal**: Implement the full dashboard page using the RSC streaming architecture.

#### E1 — Dashboard Page

**File**: `src/app/(dashboard)/dashboard/page.tsx`

Replace the current client component with an async Server Component:

```tsx
export default function DashboardPage() {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {/* Header: title + Log Activity button */}
      <DashboardPageHeader />

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Row 1: Calories (8/12) + Hydration (4/12) */}
        <div className="md:col-span-8">
          <SectionErrorBoundary>
            <Suspense fallback={<SectionSkeleton variant="calories" />}>
              <CaloriesSection date={today} />
            </Suspense>
          </SectionErrorBoundary>
        </div>

        <div className="md:col-span-4">
          <SectionErrorBoundary>
            <Suspense fallback={<SectionSkeleton variant="hydration" />}>
              <HydrationSection />
            </Suspense>
          </SectionErrorBoundary>
        </div>

        {/* Row 2: Macros (5/12) + Weekly (7/12) */}
        <div className="md:col-span-5">
          <SectionErrorBoundary>
            <Suspense fallback={<SectionSkeleton variant="macros" />}>
              <MacronutrientsSection date={today} />
            </Suspense>
          </SectionErrorBoundary>
        </div>

        <div className="md:col-span-7">
          <SectionErrorBoundary>
            <Suspense fallback={<SectionSkeleton variant="weekly" />}>
              <WeeklyMomentumSection />
            </Suspense>
          </SectionErrorBoundary>
        </div>

        {/* Row 3: Daily Schedule (full width) */}
        <div className="md:col-span-12">
          <SectionErrorBoundary>
            <Suspense fallback={<SectionSkeleton variant="schedule" />}>
              <DailyScheduleSection date={today} />
            </Suspense>
          </SectionErrorBoundary>
        </div>
      </div>
    </div>
  );
}
```

#### E2 — Calories Section

**Files**: `calories-section.tsx` + `calories-content.tsx` + `circular-progress.tsx`

`CaloriesSection` (async RSC):
- Calls `getDailySummary(userId, date)` from dashboard service
- Passes result as props to `CaloriesContent`
- `CaloriesContent` renders: tag line + title, large calorie number + goal denominator, description text, Burned + Net Balance stat cards, SVG circular progress ring

Shows `SectionNudge` when `hasGoal: false`.

#### E3 — Hydration Section

**Files**: `hydration-section.tsx` + `hydration-content.tsx` + `add-water-button.tsx`

`HydrationSection` (async RSC):
- Calls `getHydrationLog(userId, today)` from dashboard service
- Passes result as props to `HydrationContent`
- `HydrationContent` renders: liters number, progress bar, add-water button

`AddWaterButton` (`'use client'`):
- Calls `POST /api/dashboard/hydration/add` via `fetch`
- On success, calls `router.refresh()` to re-stream the hydration section with updated value
- Shows loading spinner during request

#### E4 — Macronutrients Section

**Files**: `macronutrients-section.tsx` + `macronutrients-content.tsx`

`MacronutrientsSection` (async RSC):
- Calls `getDailySummary(userId, date)` from dashboard service (reuses same data as CaloriesSection — both fetch independently, or can be cached via Next.js `cache()`)
- Renders 3 `ProgressBar` components: Protein (primary color), Carbs (tertiary/pink), Fat (amber)

**Note**: Macro colors must come from `MACRO_COLORS` in `nutrition-constants.ts` per CLAUDE.md requirement.

Shows `SectionNudge` when `hasGoal: false`.

#### E5 — Weekly Momentum Section

**Files**: `weekly-momentum-section.tsx` + `weekly-momentum-chart.tsx`

`WeeklyMomentumSection` (async RSC):
- Calls `getWeeklySnapshot(userId)` from dashboard service
- Passes `days[]` as props to `WeeklyMomentumChart`

`WeeklyMomentumChart` (`'use client'`):
- Uses Recharts `BarChart` (already in project)
- Bar height = `adherenceRatio × 100%` (clamped at 100% for display)
- Current day bar: filled with `var(--primary)`; other days: `var(--surface-container)`
- Day labels below bars: `MON`–`SUN`, current day label uses `text-primary`
- No axes needed (matches the design's minimal bar chart aesthetic)

#### E6 — Daily Schedule Section

**Files**: `daily-schedule-section.tsx` + `daily-schedule-content.tsx`

`DailyScheduleSection` (async RSC):
- Calls `getDailySchedule(userId, date)` from dashboard service
- Passes `{ morning, midday, evening }` as props to `DailyScheduleContent`

`DailyScheduleContent`:
- Always renders all three time group cards
- Empty group: renders a subtle "Nothing logged yet" placeholder inside the card
- "View All" link → `/food-log`
- Icon background colors per group: Morning (primary/10), Midday (amber-100), Evening (pink-100)

---

### Phase F: Footer

**Goal**: Add a footer matching the Vitalis design to the dashboard layout.

The current dashboard layout has no footer. The design specifies a footer with: brand name, copyright text, and Privacy Policy / Terms / Support links.

**File**: `src/app/(dashboard)/layout.tsx` — add `DashboardFooter` below `<main>`.

Or create `src/components/dashboard-footer.tsx` if reuse is anticipated.

---

### Phase G: Responsive + Accessibility Polish

**Goal**: Ensure the dashboard is fully usable from 375px to 2560px.

- Bento grid: `grid-cols-1` on mobile, `grid-cols-12` on md+; all cells stack to full-width.
- Navigation: hamburger menu already exists — ensure new nav links are included.
- Circular progress: `aria-label` with percentage value.
- Progress bars: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- `SectionSkeleton`: `aria-busy="true"`, `aria-label="Loading [section name]"`.
- Color contrast: OKLch token values already tuned for WCAG AA in both themes.

---

## Key Design Decisions

### RSC Streaming vs. Client-Side TanStack Query

The spec requires true SSR with sections visible in the initial HTML. React Server Components with `<Suspense>` streaming is the correct Next.js App Router pattern. The initial HTML includes skeleton fallbacks immediately; each section's real content streams in as data resolves server-side.

TanStack Query is used only for the add-water mutation response (client update after write), consistent with the constitution's intent.

### `getDailySummary` Shared Between Calories and Macros

Both `CaloriesSection` and `MacronutrientsSection` need the same `DailySummary` data. Rather than making two server DB calls:
- Use Next.js `cache()` (React's unstable_cache or Next.js fetch cache) to deduplicate the call within a single render.
- If `getDailySummary` is a plain async function in a service file, wrap it with `React.cache()` to memoize within a single RSC render tree.

This ensures parallel streaming still works (neither section blocks the other) while avoiding redundant DB queries.

### Macro Colors Stay in `nutrition-constants.ts`

Per CLAUDE.md: "macro and meal-type colors always come from `nutrition-constants.ts`. Never redeclare inline." The dashboard macronutrients section uses `MACRO_COLORS` directly. The design's use of `bg-tertiary` (pink) for carbs diverges from the project's existing carbs color (`amber-500`). **Resolution**: retain `amber-500` for carbs to stay consistent with the existing system and CLAUDE.md rule — the design is a reference, not a rigid constraint on internal tokens.

### No New Packages

The design references Material Symbols icons (Google font). The project uses Lucide React for icons. **Decision**: Use Lucide icons (already installed, tree-shakeable) for the schedule time-group icons and nav buttons. This avoids adding a Google font dependency and stays consistent with the existing codebase.

---

## Constitution Check (Post-Design)

Re-evaluated after Phase 1 design artifacts:

| Check | Status | Notes |
|-------|--------|-------|
| No duplicate UI kit | ✅ Pass | Recharts (existing) + shadcn/ui only |
| DB schema in `schema.ts` | ✅ Pass | `hydrationLogs` added to the single schema file |
| Migrations via Drizzle flow | ✅ Pass | `drizzle-kit generate` produces migration |
| No N+1 queries | ✅ Pass | Service functions use single aggregate queries |
| No cross-user caching | ✅ Pass | All routes have `dynamic = 'force-dynamic'`; RSC sections include user ID in cache key |
| Accessibility preserved | ✅ Pass | ARIA attributes on progress bars and skeletons; keyboard-navigable retry button |
| Server Actions or API for mutations | ✅ Pass | Add-water uses a REST route (POST); consistent with project pattern |

---

## Out of Scope

- Exercise/activity logging (calories burned will be 0)
- User-configurable hydration goal (uses system default 2500ml)
- Meal Planner and Exercise Library page functionality (placeholder pages only)
- Authentication flow changes
- Other dashboard pages (Food Log, Goals, Settings) — visual changes not required
- E2E tests for new dashboard sections (can be added in a follow-up task)
