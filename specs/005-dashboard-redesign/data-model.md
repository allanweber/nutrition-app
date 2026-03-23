# Data Model: Dashboard Redesign (005)

**Phase**: 1 — Design
**Date**: 2026-03-21
**Spec**: [spec.md](spec.md) | **Research**: [research.md](research.md)

---

## Existing Tables Used (Read-Only)

These tables already exist and are queried by new dashboard endpoints without modification:

| Table | Used for |
|-------|---------|
| `food_log_meals` | Daily schedule entries, daily nutrition aggregation |
| `food_log_items` | Calorie/macro totals per meal |
| `nutrition_goals` | Calorie goal, macro goals (protein/carbs/fat) |

---

## New Table: `hydration_logs`

Tracks daily water intake per user. One row per user per calendar date.

```sql
CREATE TABLE hydration_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  total_ml    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX hydration_logs_user_date_idx ON hydration_logs (user_id, date);
```

### Field Notes
- `total_ml`: Cumulative milliliters logged for the day. Incremented by 250 per glass.
- `UNIQUE(user_id, date)`: Prevents duplicate rows; enables upsert on add-water action.
- **Hydration goal**: Sourced from `nutrition_goals.target_hydration_ml` (default 2500 ml) at query time. Not stored on `hydration_logs`.

### Drizzle Schema Addition (in `src/server/db/schema.ts`)
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

---

## Entity Definitions

These are the four dashboard data entities defined in the spec, with their field types, sources, and transformation rules.

### DailySummary

Aggregated nutrition data for a specific date.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `date` | `string` (ISO date) | Query param | Today's date |
| `caloriesConsumed` | `number` | SUM(`food_log_items.calories × quantity`) | Rounded to nearest integer |
| `calorieGoal` | `number` | `nutrition_goals.target_calories` | Default: 2000 if no active goal |
| `caloriesBurned` | `number` | Hardcoded `0` | Exercise tracking not yet implemented |
| `netBalance` | `number` | `caloriesConsumed - caloriesBurned` | |
| `percentConsumed` | `number` | `caloriesConsumed / calorieGoal × 100` | Clamped: 0–999 |
| `remaining` | `number` | `calorieGoal - caloriesConsumed` | Can be negative (over goal) |
| `protein` | `{ consumed: number, goal: number }` | food_log_items + nutrition_goals | grams |
| `carbs` | `{ consumed: number, goal: number }` | food_log_items + nutrition_goals | grams |
| `fat` | `{ consumed: number, goal: number }` | food_log_items + nutrition_goals | grams |
| `hasGoal` | `boolean` | Whether user has an active `nutrition_goals` row | Used to show "Set your goals" nudge |

**Default goals** (when `hasGoal = false`):
- `calorieGoal`: 2000 kcal
- `protein.goal`: 150 g
- `carbs.goal`: 250 g
- `fat.goal`: 65 g

---

### HydrationLog

Daily water intake record.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `date` | `string` (ISO date) | Today | |
| `totalMl` | `number` | `hydration_logs.total_ml` | 0 if no row exists yet |
| `totalLiters` | `number` | `totalMl / 1000` | Rounded to 1 decimal |
| `goalMl` | `number` | `nutrition_goals.target_hydration_ml` | Default 2500 if no goal row |
| `percentConsumed` | `number` | `totalMl / goalMl × 100` | Clamped 0–100 for progress bar |
| `hasGoal` | `boolean` | Always `true` (default goal applied) | No separate goal config yet |

**Add-water action**: Upserts `hydration_logs` for today, incrementing `total_ml` by 250.

---

### WeeklySnapshot

Seven-day array covering the current calendar week (Monday–Sunday).

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `weekStart` | `string` (ISO date) | Computed | Monday of current week |
| `days` | `WeeklyDay[]` | See below | Always exactly 7 entries |

**WeeklyDay**:

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `date` | `string` (ISO date) | Calendar computation | |
| `dayLabel` | `string` | `"MON"…"SUN"` | Uppercase 3-letter abbreviation |
| `caloriesConsumed` | `number` | Aggregated from food_log_items | 0 if no data |
| `calorieGoal` | `number` | Active nutrition_goals at time of query | Same goal applied to all days |
| `adherenceRatio` | `number` | `caloriesConsumed / calorieGoal` | Unclamped (can exceed 1.0) |
| `isCurrentDay` | `boolean` | `date === today` | |
| `hasData` | `boolean` | `caloriesConsumed > 0` | Used to style empty/future days |

---

### ScheduleEntry

A single logged meal or activity for the current day.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `id` | `string` | `food_log_meals.id` | UUID7 |
| `name` | `string` | First `food_log_items.food_name` in the meal | Or meal type label if no items |
| `time` | `string` | `food_log_meals.consumed_at` formatted | e.g., "08:00 AM" |
| `timeGroup` | `"morning" \| "midday" \| "evening"` | Derived from `consumed_at` hour | See mapping below |
| `calories` | `number` | SUM of items in this meal | kcal |
| `iconType` | `"meal" \| "snack" \| "exercise"` | Derived from `mealType` | For icon selection |
| `mealType` | `string` | `food_log_meals.meal_type` | Raw value |

**Time group mapping** (by `consumed_at` hour):
- 00:00–10:59 → `morning`
- 11:00–16:59 → `midday`
- 17:00–23:59 → `evening`

**API response wraps schedule entries by group**:
```typescript
{
  morning: ScheduleEntry[],   // always present (may be empty)
  midday: ScheduleEntry[],    // always present (may be empty)
  evening: ScheduleEntry[],   // always present (may be empty)
}
```

---

## State Transitions

### Hydration Log State

```
No row (new day)
  → GET /api/dashboard/hydration → creates row with totalMl=0
  → POST /api/dashboard/hydration/add → increments totalMl by 250
  → ... repeat up to goalMl
  → totalMl can exceed goalMl (no cap enforced server-side)
```

### Dashboard Section States

Each section follows this lifecycle:
```
Page load → Suspense fallback (SectionSkeleton rendered by server)
          → async Server Component resolves
          → Section renders with data   [LOADED]
          OR
          → async Server Component throws
          → SectionErrorBoundary catches → [ERROR state with retry button]
          → User clicks retry → router.refresh() → section re-streams
```

---

## Validation Rules

| Rule | Scope | Detail |
|------|-------|--------|
| Auth required | All dashboard endpoints | `getCurrentUser()` must return a user |
| Date param | `/daily-summary`, `/schedule`, `/weekly-snapshot` | ISO date string, defaults to today |
| add-water increment | `/hydration/add` | Fixed 250ml; no body param accepted |
| Calorie goal minimum | DailySummary | Never return 0 — use default 2000 if missing |
| Hydration goal minimum | HydrationLog | Never return 0 — use default 2500 if missing |
