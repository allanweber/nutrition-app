# Dashboard Redesign — Implementation Plan

## Context

Redesign the user dashboard with a bento-grid layout supporting light and dark themes. The page is rendered server-side using Next.js App Router React Server Components with Suspense streaming, so each of the five sections loads independently and in parallel. Add a new `hydration_logs` table and four new aggregation API endpoints. Build reusable component library for future dashboard features.

---

## Design Decisions

### SSR Architecture
- React Server Components with Suspense streaming for initial HTML
- Each section (`CaloriesSection`, `HydrationSection`, `MacronutrientsSection`, `WeeklyMomentumSection`, `DailyScheduleSection`) is an async Server Component
- `<Suspense>` boundaries wrap each section with shared skeleton fallback
- Sections stream to browser independently as data resolves

### Per-Section Retry
- Client Component error boundary (`SectionErrorBoundary`) wraps each section
- Retry button calls `useRouter().refresh()` wrapped in `startTransition`
- Only the failed section re-streams; other sections are unaffected

### Theme System
- App already uses `next-themes@0.4.6` with inline blocking script
- No flash on reload - next-themes handles this
- New CSS tokens added to `globals.css` for dashboard-specific colors

### Hydration Data
- New `hydration_logs` table tracks daily water intake
- Quick-add button increments by 250ml (one glass)
- Goal sourced from `nutrition_goals.target_hydration_ml` (default 2500ml)

### Calories Burned
- Hardcoded to 0 (exercise tracking not yet implemented)
- `net_balance = calories_consumed - 0 = calories consumed`
- Future "Exercise Library" feature will add exercise logging

### Daily Schedule Groups
- Morning: mealTypes `breakfast`, `morning_snack`
- Midday: mealTypes `lunch`, `afternoon_snack`, `pre_workout`, `post_workout`, `other`
- Evening: mealTypes `dinner`, `evening_snack`

### Macro Colors
- Colors come from `MACRO_COLORS` in `nutrition-constants.ts`
- Protein: rose-500, Carbs: amber-500, Fat: sky-500

### Icon Strategy
- Use Lucide React (already installed) for schedule icons
- No Google Fonts or additional icon libraries

---

## Schema Changes Required

### New Table: `hydration_logs`

```typescript
export const hydrationLogs = pgTable(
  'hydration_logs',
  {
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    totalMl: integer('total_ml').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('hydration_logs_user_date_idx').on(table.userId, table.date),
    unique('hydration_logs_user_date_unique').on(table.userId, table.date),
  ],
);
```

**Migration**: `npm run db:generate` then `npm run db:push`

---

## Files to Create

### API Routes (under `src/app/api/dashboard/`)

| File | Purpose |
|------|---------|
| `daily-summary/route.ts` | GET - DailySummary aggregation |
| `hydration/route.ts` | GET - today's water intake |
| `hydration/add/route.ts` | POST - add 250ml water |
| `weekly-snapshot/route.ts` | GET - 7-day calorie adherence |
| `schedule/route.ts` | GET - today's meals by time group |

### Dashboard Service

| File | Purpose |
|------|---------|
| `src/server/services/dashboard.service.ts` | Server-side data fetching functions |

### Components (under `src/components/dashboard/`)

| File | Purpose |
|------|---------|
| `index.ts` | Barrel export |
| `shared/section-skeleton.tsx` | Shared skeleton loader (shape variants) |
| `shared/section-error-boundary.tsx` | Client error boundary + retry |
| `shared/progress-bar.tsx` | Linear progress bar |
| `shared/stat-card.tsx` | Small metric card |
| `shared/bento-cell.tsx` | Grid cell wrapper |
| `shared/section-nudge.tsx` | "Set your goals" nudge |
| `calories/calories-section.tsx` | Async RSC wrapper |
| `calories/calories-content.tsx` | Visual content |
| `calories/circular-progress.tsx` | SVG ring indicator |
| `hydration/hydration-section.tsx` | Async RSC wrapper |
| `hydration/hydration-content.tsx` | Visual content |
| `hydration/add-water-button.tsx` | Client mutation button |
| `macronutrients/macronutrients-section.tsx` | Async RSC wrapper |
| `macronutrients/macronutrients-content.tsx` | Visual content |
| `weekly-momentum/weekly-momentum-section.tsx` | Async RSC wrapper |
| `weekly-momentum/weekly-momentum-chart.tsx` | Recharts bar chart |
| `daily-schedule/daily-schedule-section.tsx` | Async RSC wrapper |
| `daily-schedule/daily-schedule-content.tsx` | Visual content |

### Pages

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/meal-planner/page.tsx` | Placeholder "Coming soon" |
| `src/app/(dashboard)/exercise-library/page.tsx` | Placeholder "Coming soon" |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/server/db/schema.ts` | Add hydrationLogs table + Zod schemas |
| `src/app/globals.css` | Add dashboard color tokens |
| `src/components/dashboard-nav.tsx` | Update to Vitalis design |
| `src/app/(dashboard)/layout.tsx` | Update layout, add footer |
| `src/app/(dashboard)/dashboard/page.tsx` | Replace with async RSC bento-grid |

---

## Key Data Shapes

### DailySummary
```typescript
interface DailySummary {
  date: string;
  caloriesConsumed: number;
  calorieGoal: number;
  caloriesBurned: number;    // hardcoded 0
  netBalance: number;
  percentConsumed: number;
  remaining: number;
  protein: { consumed: number; goal: number };
  carbs: { consumed: number; goal: number };
  fat: { consumed: number; goal: number };
  hasGoal: boolean;
}
```

### HydrationLog
```typescript
interface HydrationLog {
  date: string;
  totalMl: number;
  totalLiters: number;
  goalMl: number;
  percentConsumed: number;    // clamped 0-100 for bar
  hasGoal: boolean;
}
```

### WeeklySnapshot
```typescript
interface WeeklySnapshot {
  weekStart: string;
  days: Array<{
    date: string;
    dayLabel: string;         // "MON"..."SUN"
    caloriesConsumed: number;
    calorieGoal: number;
    adherenceRatio: number;   // unclamped
    isCurrentDay: boolean;
    hasData: boolean;
  }>;
}
```

### ScheduleEntry
```typescript
interface ScheduleEntry {
  id: string;
  name: string;
  time: string;              // "08:00 AM"
  timeGroup: 'morning' | 'midday' | 'evening';
  calories: number;
  iconType: 'meal' | 'snack' | 'exercise';
  mealType: string;
}

// Response wraps by group:
interface DailySchedule {
  morning: ScheduleEntry[];
  midday: ScheduleEntry[];
  evening: ScheduleEntry[];
}
```

---

## Implementation Order

1. **Setup**: Create component directory structure
2. **Foundational**: Add hydration_logs table, create dashboard service, create all API routes
3. **User Story 1** (P1): Core Dashboard Layout
   - Update navigation, create bento grid, placeholder cells
4. **User Story 2** (P2): Light and Dark Theme Support
   - Add CSS tokens to globals.css
5. **User Story 3** (P3): Per-Section Loading and Error States
   - Create SectionSkeleton, SectionErrorBoundary
   - Wrap all sections with Suspense + ErrorBoundary
6. **User Story 4** (P2): Calorie Focus Section
   - Create CircularProgress, StatCard, CaloriesContent
   - Add CaloriesSection RSC
7. **User Story 5** (P2): Macronutrients Section
   - Create ProgressBar, MacronutrientsContent
   - Add MacronutrientsSection RSC
8. **User Story 6** (P3): Weekly Momentum Chart
   - Create WeeklyMomentumChart (Recharts)
   - Add WeeklyMomentumSection RSC
9. **User Story 7** (P3): Daily Schedule Section
   - Create DailyScheduleContent
   - Add DailyScheduleSection RSC
10. **User Story 8** (P3): Hydration Tracker
    - Create AddWaterButton, HydrationContent
    - Add HydrationSection RSC
11. **Polish**: ARIA attributes, responsive validation, footer, barrel export, E2E tests

---

## Verification Checklist

- [ ] Dashboard renders with 5 bento cells in 12-column grid
- [ ] Mobile view stacks to single column
- [ ] Light theme shows dark green primary, white surfaces
- [ ] Dark theme shows bright emerald primary, deep slate surfaces
- [ ] Theme toggle preserves preference with no flash on reload
- [ ] Each section shows skeleton while loading
- [ ] Each section shows error state with retry on failure
- [ ] Retry re-fetches only that section
- [ ] Calories section shows circular progress ring
- [ ] Macronutrients section shows 3 progress bars with correct colors
- [ ] Weekly momentum chart shows 7 bars with current day highlighted
- [ ] Daily schedule shows 3 time groups, empty groups show placeholder
- [ ] Hydration shows liters + progress bar + add-water button
- [ ] Add-water button increments and updates display
- [ ] npm run lint passes
