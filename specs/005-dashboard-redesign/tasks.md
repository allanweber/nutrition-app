# Tasks: Dashboard Redesign

**Input**: Design documents from `/specs/005-dashboard-redesign/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, research.md ✅, contracts/api-dashboard.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.
**Tests**: No test tasks included — E2E test coverage is explicitly out of scope in plan.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US8)
- Exact file paths included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the new component directory structure and stub barrel export.

- [x] T001 Create component subdirectories: `src/components/dashboard/shared/`, `src/components/dashboard/calories/`, `src/components/dashboard/hydration/`, `src/components/dashboard/macronutrients/`, `src/components/dashboard/weekly-momentum/`, `src/components/dashboard/daily-schedule/`
- [x] T002 Create stub barrel export file `src/components/dashboard/index.ts` (will be updated as components are added in later phases)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Full data layer — DB schema, dashboard service, and all 5 API routes. No visual work begins until this phase is complete.

**⚠️ CRITICAL**: No user story phase can begin until this phase is complete.

- [x] T003 Add `hydrationLogs` Drizzle table definition, Zod schemas (`insertHydrationLogSchema`, `selectHydrationLogSchema`), and type aliases (`HydrationLog`, `NewHydrationLog`) to `src/server/db/schema.ts` per `specs/005-dashboard-redesign/data-model.md`
- [x] T004 Run `npx drizzle-kit generate` to produce the `hydration_logs` migration file and commit it to the repo (depends on T003)
- [x] T005 Create `src/server/services/dashboard.service.ts` with all 5 server-side data functions: `getDailySummary`, `getHydrationLog`, `addWater`, `getWeeklySnapshot`, `getDailySchedule` — each returning typed DTOs matching `specs/005-dashboard-redesign/contracts/api-dashboard.md`, with default goal fallbacks when `hasGoal: false` (depends on T003)
- [x] T006 [P] Create `src/app/api/dashboard/daily-summary/route.ts` — `GET` handler with optional `date` Zod-validated query param, `getCurrentUser()` auth check → 401 if missing, calls `getDailySummary`, returns `DailySummary` DTO; `export const dynamic = 'force-dynamic'` (depends on T005)
- [x] T007 [P] Create `src/app/api/dashboard/hydration/route.ts` — `GET` handler, auth check, calls `getHydrationLog` (upserts zero-row if none exists for today), returns `HydrationLog` DTO; `export const dynamic = 'force-dynamic'` (depends on T005)
- [x] T008 [P] Create `src/app/api/dashboard/hydration/add/route.ts` — `POST` handler, no request body, auth check, calls `addWater` incrementing `total_ml` by 250 ml, returns updated `HydrationLog` DTO; `export const dynamic = 'force-dynamic'` (depends on T005)
- [x] T009 [P] Create `src/app/api/dashboard/weekly-snapshot/route.ts` — `GET` handler, auth check, calls `getWeeklySnapshot` returning all 7 entries for current Mon–Sun calendar week (future days: `hasData: false`); `export const dynamic = 'force-dynamic'` (depends on T005)
- [x] T010 [P] Create `src/app/api/dashboard/schedule/route.ts` — `GET` handler with optional Zod-validated `date` param, auth check, calls `getDailySchedule` returning `{ morning, midday, evening }` groups (always all three keys); `export const dynamic = 'force-dynamic'` (depends on T005)

**Checkpoint**: All 5 API routes respond correctly with typed data. `dashboard.service.ts` functions tested via API calls.

---

## Phase 3: User Story 1 — Core Dashboard Layout (Priority: P1) 🎯 MVP

**Goal**: Deliver the full bento-grid page structure with navigation updates and placeholder section slots. The dashboard is navigable and responsive; individual section content is filled in subsequent phases.

**Independent Test**: Navigate to `/dashboard` — verify 12-column bento grid at `md+` breakpoints stacks to single column on mobile; navigation shows "Vitalis" brand with 5 links; `/meal-planner` and `/exercise-library` routes return "Coming soon" pages.

- [x] T011 [US1] Update `src/components/dashboard-nav.tsx`: brand name → "Vitalis" (italic, `font-headline`, `text-primary`), nav links → Dashboard / Food Log / Meal Planner / Exercise Library / Goals, `fixed top-0 z-50` positioning, `bg-background/80 backdrop-blur-md`, active-link bottom border (`border-b-2 border-primary`), notifications Lucide icon button + profile button on the right
- [x] T012 [P] [US1] Create `src/app/(dashboard)/meal-planner/page.tsx` — async RSC with heading "Meal Planner" and "Coming soon" message; no data fetching
- [x] T013 [P] [US1] Create `src/app/(dashboard)/exercise-library/page.tsx` — async RSC with heading "Exercise Library" and "Coming soon" message; no data fetching
- [x] T014 [US1] Update `src/app/(dashboard)/layout.tsx`: replace `max-w-6xl mx-auto` with `max-w-screen-2xl mx-auto`, add `pt-16` top padding on `<main>` for the fixed nav; keep existing auth check and session logic unchanged
- [x] T015 [US1] Create `src/components/dashboard/shared/bento-cell.tsx` — wrapper `<div>` with `rounded-[24px] bg-surface-container-low border border-outline-variant shadow-sm p-8`; props: `children: React.ReactNode`, `className?: string`
- [x] T016 [US1] Replace `src/app/(dashboard)/dashboard/page.tsx` with an async Server Component: compute `today` date string; render inline page header (`<h1>Today</h1>` + `<Link href="/food-log">` primary button "Log Activity" — no separate component file); render 12-column bento grid (`grid grid-cols-1 md:grid-cols-12 gap-6`) with 5 `<BentoCell>` placeholder slots — Calories (`md:col-span-8`), Hydration (`md:col-span-4`), Macros (`md:col-span-5`), Weekly (`md:col-span-7`), Schedule (`md:col-span-12`)

**Checkpoint**: Dashboard page renders bento grid with 5 placeholder cells. Nav has correct links. Mobile view stacks to single column.

---

## Phase 4: User Story 2 — Light and Dark Theme Support (Priority: P2)

**Goal**: All color tokens required by the dashboard design are present in both light and dark CSS blocks. Theme persists with no flash on reload.

**Independent Test**: Toggle the existing theme control. Verify all dashboard layout elements adopt correct surface, text, and primary colors in both light and dark modes. Reload the page — active theme is preserved with no visible flash.

- [x] T017 [US2] Update `src/app/globals.css`: add `--on-surface`, `--on-surface-variant`, `--secondary`, `--tertiary` CSS variables (OKLch values) to both `:root` (light) and `.dark` blocks; add `.editorial-gradient` utility class (`background: linear-gradient(135deg, var(--primary), oklch(0.35 0.14 160))`); reference `specs/005-dashboard-redesign/plan.md` Phase B for exact OKLch values

**Checkpoint**: Both themes render correct colors across the dashboard layout with no flash on reload (next-themes inline script handles this — no layout.tsx changes needed).

---

## Phase 5: User Story 4 — Calorie Focus Section (Priority: P2)

**Goal**: Render the Calories bento cell with live data — large calorie headline, circular progress ring, burned/net-balance stat cards, and "Set your goals" nudge when no goal is configured.

**Independent Test**: Navigate to dashboard and verify Calories cell: circular ring fills proportionally to `percentConsumed`; ring is empty at 0 calories; ring is full when over goal; StatCards show burned and net balance values; SectionNudge link appears when `hasGoal: false`.

- [x] T018 [P] [US4] Create `src/components/dashboard/shared/stat-card.tsx` — props: `label: string`, `value: string | number`, `unit?: string`; renders a small labeled metric card matching the "Burned" and "Net Balance" design in the Calories cell
- [x] T019 [P] [US4] Create `src/components/dashboard/shared/section-nudge.tsx` — props: `message?: string`; renders "Set your goals →" text with a link to `/goals`; displayed inline adjacent to sections where `hasGoal: false`
- [x] T020 [P] [US4] Create `src/components/dashboard/calories/circular-progress.tsx` — SVG ring indicator using `stroke-dashoffset`; props: `percentage: number`, `label: string`, `value: string | number`, `size?: number`; ring fills proportionally to percentage; fills completely when percentage ≥ 100
- [x] T021 [US4] Create `src/components/dashboard/calories/calories-content.tsx` — renders: tag line, large calorie number + `/ {calorieGoal}` denominator, `<StatCard>` for Burned, `<StatCard>` for Net Balance, `<CircularProgress>` with percentage; `<SectionNudge>` when `hasGoal: false`; receives `DailySummary` DTO as props (depends on T018, T019, T020)
- [x] T022 [US4] Create `src/components/dashboard/calories/calories-section.tsx` — async RSC; `getCurrentUser()` for userId; calls `getDailySummary(userId, date)` from `src/server/services/dashboard.service.ts`; renders `<BentoCell><CaloriesContent ... /></BentoCell>`; update `src/app/(dashboard)/dashboard/page.tsx` to replace Calories `<BentoCell>` placeholder with `<CaloriesSection date={today} />` (depends on T021)

**Checkpoint**: Calories bento cell renders with real data from `/api/dashboard/daily-summary`.

---

## Phase 6: User Story 5 — Macronutrients Section (Priority: P2)

**Goal**: Render the Macronutrients bento cell with three labeled progress bars (Protein, Carbs, Fat) using colors from `nutrition-constants.ts`.

**Independent Test**: Navigate to dashboard and verify Macros cell: three bars render with correct color coding (rose/amber/sky); bars fill proportionally to goal percentage; empty bars show label and target; over-goal bars fill completely; macro colors match `MACRO_COLORS` from `nutrition-constants.ts`.

- [x] T023 [US5] Create `src/components/dashboard/shared/progress-bar.tsx` — props: `label: string`, `value: number`, `goal: number`, `unit: string`, `color: string` (Tailwind bg class from `MACRO_COLORS`), `percentage?: number`; renders label, `{value}/{goal}{unit}` text, filled bar; bar fills completely when over goal; zero-safe (empty bar, label still shows)
- [x] T024 [US5] Create `src/components/dashboard/macronutrients/macronutrients-content.tsx` — renders three `<ProgressBar>` components using `MACRO_COLORS` from `src/lib/nutrition-constants.ts` (Protein: `rose-500`, Carbs: `amber-500`, Fat: `sky-500`). Do NOT use the `--tertiary` CSS token for macro bars — that token is for other accents only. `<SectionNudge>` when `hasGoal: false`; receives `DailySummary` DTO as props (depends on T023)
- [x] T025 [US5] Create `src/components/dashboard/macronutrients/macronutrients-section.tsx` — async RSC; calls `getDailySummary(userId, date)`; renders `<BentoCell><MacronutrientsContent ... /></BentoCell>`; update `src/app/(dashboard)/dashboard/page.tsx` to replace Macros placeholder with `<MacronutrientsSection date={today} />` (depends on T024)

**Checkpoint**: Macronutrients bento cell renders with real data and correct color coding from `nutrition-constants.ts`.

---

## Phase 7: User Story 3 — Per-Section Loading and Error States (Priority: P3)

**Goal**: Wrap all dashboard sections with shared skeleton and error boundary components so each section independently shows a shape-matching skeleton while loading and a consistent retry-enabled error state on failure.

**Independent Test**: Simulate a delayed response for one section — its skeleton appears while others load normally. Simulate a fetch failure — error state with retry button appears for that section only; clicking retry calls `router.refresh()` and re-streams only that section; other sections are unaffected.

- [x] T026 [US3] Create `src/components/dashboard/shared/section-skeleton.tsx` — props: `variant: 'calories' | 'hydration' | 'macros' | 'weekly' | 'schedule'`; `animate-pulse` skeleton per variant matching the target section's height and approximate shape; `aria-busy="true"`, `aria-label="Loading [section name]"`
- [x] T027 [US3] Create `src/components/dashboard/shared/section-error-boundary.tsx` — `'use client'` React class `ErrorBoundary`; renders error icon (Lucide) + "Something went wrong" message + "Retry" button; retry calls `useRouter().refresh()` wrapped in `startTransition`; visual height matches skeleton so layout does not shift
- [x] T028 [US3] Update `src/app/(dashboard)/dashboard/page.tsx` to wrap each of the 5 section slots with `<SectionErrorBoundary>` (outer) + `<Suspense fallback={<SectionSkeleton variant="..." />}>` (inner). `<CaloriesSection />` (from T022) and `<MacronutrientsSection />` (from T025) are already in place — wrap them in ErrorBoundary+Suspense without replacing their content. Hydration, Weekly, Schedule slots still contain placeholder divs — wrap those too; their real sections will be inserted in Phases 8–10. (depends on T022, T025)

**Checkpoint**: All 5 section slots have skeleton fallbacks and error boundaries. Retry button re-streams failed section without affecting others.

---

## Phase 8: User Story 8 — Hydration Tracker (Priority: P3)

**Goal**: Render the Hydration bento cell with liters consumed, progress bar toward goal, and a working quick-add water button that updates without a full page reload.

**Independent Test**: Navigate to dashboard. Hydration cell shows liters consumed and correct progress percentage. Clicking the add-water button POSTs to `/api/dashboard/hydration/add` and updates the displayed value — other sections are not visually disrupted.

- [x] T029 [P] [US8] Create Server Action `src/server/actions/hydration.ts` — `addWaterAction()` validates session via `getCurrentUser()` (throws if unauthenticated), calls `addWater(userId, today)` from `dashboard.service.ts`, then calls `revalidatePath('/dashboard')`; returns updated `HydrationLog` DTO. Then create `src/components/dashboard/hydration/add-water-button.tsx` — `'use client'`; calls `addWaterAction()` via `useTransition`; shows Lucide loading spinner while `isPending`; no manual `router.refresh()` needed (revalidatePath handles it)
- [x] T030 [US8] Create `src/components/dashboard/hydration/hydration-content.tsx` — renders total liters as large number, `<ProgressBar>` for `percentConsumed` (clamped 0–100), `<AddWaterButton>`; receives `HydrationLog` DTO as props (depends on T029)
- [x] T031 [US8] Create `src/components/dashboard/hydration/hydration-section.tsx` — async RSC; calls `getHydrationLog(userId, today)`; renders `<BentoCell><HydrationContent ... /></BentoCell>`; update `src/app/(dashboard)/dashboard/page.tsx` to replace Hydration placeholder with `<HydrationSection />` inside existing Suspense boundary from T028 (depends on T030)

**Checkpoint**: Hydration bento cell renders with live data. Add-water button increments intake and progress bar updates.

---

## Phase 9: User Story 6 — Weekly Momentum Chart (Priority: P3)

**Goal**: Render the Weekly Momentum bento cell with a 7-bar Recharts chart showing this week's calorie adherence; current day visually highlighted.

**Independent Test**: Navigate to dashboard. Weekly cell shows 7 bars for Mon–Sun; bar heights proportional to `adherenceRatio`; current day bar uses primary color; future/empty days show minimal bars; `MON`–`SUN` day labels are present below bars.

- [x] T032 [US6] Create `src/components/dashboard/weekly-momentum/weekly-momentum-chart.tsx` — `'use client'`; Recharts `BarChart` with `ResponsiveContainer`; bar height = `Math.min(adherenceRatio, 1) × 100%`; `isCurrentDay` bar fill = `var(--primary)`, other bars = `var(--surface-container)`; `dayLabel` text below each bar; current day label uses `text-primary`; no axes or grid lines (minimal aesthetic)
- [x] T033 [US6] Create `src/components/dashboard/weekly-momentum/weekly-momentum-section.tsx` — async RSC; calls `getWeeklySnapshot(userId)`; renders `<BentoCell><WeeklyMomentumChart days={snapshot.days} /></BentoCell>`; update `src/app/(dashboard)/dashboard/page.tsx` to replace Weekly placeholder with `<WeeklyMomentumSection />` inside existing Suspense boundary (depends on T032)

**Checkpoint**: Weekly Momentum bento cell renders with live 7-day data and correct visual highlight for current day.

---

## Phase 10: User Story 7 — Daily Schedule Section (Priority: P3)

**Goal**: Render the Daily Schedule bento cell with logged meals grouped into Morning, Midday, and Evening cards. All three groups always visible; empty groups show a subtle placeholder. "View All" links to the food log.

**Independent Test**: Navigate to dashboard with meals logged in morning and midday only. Verify: all three time-group cards render; morning and midday show entries with Lucide icon, time, name, and calories; evening shows "Nothing logged yet" placeholder; "View All" navigates to `/food-log`.

- [x] T034 [US7] Create `src/components/dashboard/daily-schedule/daily-schedule-content.tsx` — renders three time-group cards (Morning, Midday, Evening) always; each card lists `ScheduleEntry` items with Lucide icon, `time`, `name`, `calories` value; empty group shows "Nothing logged yet" placeholder text; icon background per group (Morning: primary/10 tint, Midday: `amber-100`, Evening: pink/10 tint); "View All" link → `/food-log`; receives `{ morning: ScheduleEntry[], midday: ScheduleEntry[], evening: ScheduleEntry[] }` as props
- [x] T035 [US7] Create `src/components/dashboard/daily-schedule/daily-schedule-section.tsx` — async RSC; calls `getDailySchedule(userId, date)`; renders `<BentoCell><DailyScheduleContent ... /></BentoCell>`; update `src/app/(dashboard)/dashboard/page.tsx` to replace Schedule placeholder with `<DailyScheduleSection date={today} />` inside existing Suspense boundary (depends on T034)

**Checkpoint**: Daily Schedule bento cell renders today's meals grouped by time of day. Empty groups show placeholders.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Deduplication optimization, accessibility, responsive validation, footer, barrel export, and final quality checks.

- [x] T036 Wrap `getDailySummary` with `React.cache()` in `src/server/services/dashboard.service.ts` to deduplicate the database query between `CaloriesSection` and `MacronutrientsSection` within a single RSC render tree
- [x] T037 [P] Add ARIA attributes to `src/components/dashboard/calories/circular-progress.tsx`: `role="img"`, `aria-label` describing current percentage (e.g., "Calories: 67% of daily goal")
- [x] T038 [P] Add ARIA attributes to `src/components/dashboard/shared/progress-bar.tsx`: `role="progressbar"`, `aria-valuenow={Math.round(percentage)}`, `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-label` with macro or hydration name
- [x] T039 [P] Create `src/components/dashboard-footer.tsx` — "Vitalis" brand name, copyright text, Privacy Policy / Terms / Support links; import into `src/app/(dashboard)/layout.tsx` and render below `<main>`
- [x] T040 Verify responsive layout from 375px to 2560px: bento grid stacks to `grid-cols-1` on mobile, all 5 sections readable without horizontal scroll, no overlapping elements at any viewport — fix any issues found
- [x] T041 Update `src/components/dashboard/index.ts` barrel export with all new components: `BentoCell`, `StatCard`, `SectionNudge`, `CircularProgress`, `ProgressBar`, `SectionSkeleton`, `SectionErrorBoundary`
- [x] T042 [P] Create `tests/dashboard/dashboard.spec.ts` — Playwright E2E covering: (1) authenticated user navigates to `/dashboard` → all 5 bento cells visible; (2) Hydration add-water button clicked → `totalLiters` value increases; (3) dashboard renders on 375px viewport without horizontal scroll; (4) theme toggle switches `dark` class on `<html>` element — no flash on reload
- [x] T043 Run `npm test && npm run lint` and resolve all type errors and lint violations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user story phases**
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US2)**: Depends on Phase 2 — CSS-only, can run in parallel with Phase 3
- **Phase 5 (US4)**: Depends on Phase 2; Calories section calls `getDailySummary`
- **Phase 6 (US5)**: Depends on Phase 2; reuses `getDailySummary` like US4
- **Phase 7 (US3)**: Depends on Phase 3 (needs dashboard page.tsx), Phase 5 (T022 must be complete — `<CaloriesSection />` already in page.tsx), Phase 6 (T025 must be complete — `<MacronutrientsSection />` already in page.tsx)
- **Phase 8 (US8)**: Depends on Phase 2; Suspense/ErrorBoundary wrapper comes from Phase 7
- **Phase 9 (US6)**: Depends on Phase 2; Suspense/ErrorBoundary wrapper comes from Phase 7
- **Phase 10 (US7)**: Depends on Phase 2; Suspense/ErrorBoundary wrapper comes from Phase 7
- **Phase 11 (Polish)**: Depends on all story phases being complete

### User Story Dependencies

- **US1 (P1)**: Start after Phase 2 — no story dependencies
- **US2 (P2)**: Start after Phase 2 — CSS only, no story dependencies, can run in parallel with US1
- **US4 (P2)**: Start after Phase 2 — independently testable; requires `getDailySummary` service
- **US5 (P2)**: Start after Phase 2 — independently testable; shares `getDailySummary` with US4
- **US3 (P3)**: Start after Phase 3, US4, US5 — wraps the sections they created; `SectionNudge` reused from US4
- **US8 (P3)**: Start after Phase 2, complete after US3 (Suspense/ErrorBoundary wrapper needed)
- **US6 (P3)**: Start after Phase 2, complete after US3 (Suspense/ErrorBoundary wrapper needed)
- **US7 (P3)**: Start after Phase 2, complete after US3 (Suspense/ErrorBoundary wrapper needed)

### Cross-Story Component Reuse

| Component | Created in | Reused in |
|-----------|-----------|-----------|
| `BentoCell` | T015 (US1) | All 5 section components |
| `StatCard` | T018 (US4) | Calories section only |
| `SectionNudge` | T019 (US4) | US5 (MacronutrientsContent), US8 (HydrationContent) |
| `CircularProgress` | T020 (US4) | Calories section only |
| `ProgressBar` | T023 (US5) | US8 (HydrationContent) |
| `SectionSkeleton` | T026 (US3) | Dashboard page Suspense fallbacks |
| `SectionErrorBoundary` | T027 (US3) | Dashboard page section wrappers |

### Parallel Opportunities

- **Phase 2**: T006–T010 (all 5 route files) run in parallel after T005 (dashboard service)
- **Phase 3**: T012 and T013 (placeholder pages) run in parallel; T015 and T016 are sequential (T016 uses BentoCell from T015)
- **Phase 5**: T018, T019, T020 run in parallel; T021 depends on all three; T022 depends on T021
- **Phase 11**: T037, T038, T039 run in parallel

---

## Parallel Example: Phase 2 (API Routes)

```bash
# After T005 (dashboard.service.ts) completes, launch all 5 route files simultaneously:
Task T006: "Create src/app/api/dashboard/daily-summary/route.ts"
Task T007: "Create src/app/api/dashboard/hydration/route.ts"
Task T008: "Create src/app/api/dashboard/hydration/add/route.ts"
Task T009: "Create src/app/api/dashboard/weekly-snapshot/route.ts"
Task T010: "Create src/app/api/dashboard/schedule/route.ts"
```

## Parallel Example: Phase 5 (Calorie Section Primitives)

```bash
# After Phase 2 completes, launch shared primitive creation simultaneously:
Task T018: "Create src/components/dashboard/shared/stat-card.tsx"
Task T019: "Create src/components/dashboard/shared/section-nudge.tsx"
Task T020: "Create src/components/dashboard/calories/circular-progress.tsx"
# Then T021 (calories-content) after all three complete
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational data layer — **CRITICAL, blocks everything**
3. Complete Phase 3: US1 — bento grid layout with placeholder section slots
4. **STOP and VALIDATE**: Dashboard navigates correctly; 12-column grid renders; mobile stacks
5. Demo-ready at this point with layout structure visible

### Incremental Delivery

1. Setup + Foundational → data layer ready
2. **US1** → bento grid structure visible (**MVP demo point**)
3. **US2** → both themes correct
4. **US4** → Calories section live with real data
5. **US5** → Macros section live with real data
6. **US3** → All 5 sections wrapped with skeleton + error states
7. **US8** → Hydration section live with add-water button
8. **US6** → Weekly momentum chart live
9. **US7** → Daily schedule live
10. **Polish** → Full production quality

### Parallel Team Strategy

After Phase 2 (Foundational) is complete:

- **Dev A**: Phase 3 US1 (layout) + Phase 4 US2 (theme tokens)
- **Dev B**: Phase 5 US4 (calories) → Phase 6 US5 (macros)
- **Dev C**: Phase 7 US3 (loading/error states) after Dev B finishes US4/US5

Then all three converge:
- Dev A: Phase 8 US8 (hydration)
- Dev B: Phase 9 US6 (weekly chart)
- Dev C: Phase 10 US7 (daily schedule)

Final: All three contribute to Phase 11 (polish).

---

## Notes

- `[P]` tasks can run in parallel — they touch different files with no shared dependencies
- `[Story]` label maps each task to a specific user story for traceability
- Macro colors **MUST** come from `src/lib/nutrition-constants.ts` — never declare inline (CLAUDE.md rule)
- All API routes must include `export const dynamic = 'force-dynamic'` to prevent static caching
- `SectionNudge` (T019) is created in US4 but reused by US5 (T024) and US8 (T030)
- `ProgressBar` (T023) is created in US5 but reused by US8 (T030)
- `getDailySummary` is shared between CaloriesSection and MacronutrientsSection — `React.cache()` applied in T036 (Polish phase)
- Commit after each task or logical group using Conventional Commits format: `feat:`, `chore:`, `refactor:`, `fix:`, `style:` (constitution requirement)
- Stop at any **Checkpoint** to validate the story independently before proceeding
