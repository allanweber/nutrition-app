# Phase 4 Goals — Implementation Tasks

This task list turns the spec in `.github/prompts/plan-phase4GoalsSystemDetailedV2.prompt.md` into concrete work items.

## A) Database & Types

- [ ] A1. Add goal-history fields to `nutrition_goals` table ([Issue #14](https://github.com/allanweber/nutrition-app/issues/14))
  - Files: [src/server/db/schema.ts](src/server/db/schema.ts)
  - Add columns (per spec):
    - normalized inputs: `ageYears`, `sex`, `heightCm`, `weightKg`, `activityMultiplier`, `goalRateKgPerWeek`
    - preset/rules: `macroPresetId`, `proteinGPerKg`
    - snapshot: `bmrCalories`, `tdeeCalories`, `recommendedTargets`, `wasManuallyOverridden`, `calorieAdjustmentStrategy`
    - raw inputs: `inputUnitSystem`, `wizardInputs`
  - DoD: schema compiles; Drizzle types updated.

- [ ] A2. Create and apply a Drizzle migration for the new columns ([Issue #14](https://github.com/allanweber/nutrition-app/issues/14))
  - Files: `drizzle/*.sql` (new)
  - DoD: `npm run db:push` (or migrate flow) succeeds locally.

- [ ] A3. Update goal-related TypeScript types used by UI/queries ([Issue #14](https://github.com/allanweber/nutrition-app/issues/14))
  - Files: [src/types/food.ts](src/types/food.ts) (or wherever `NutritionGoals` / goal history types live)
  - DoD: goal history record type + wizard input types exist and are used in API/queries.

- [ ] A4. Add body check-ins table for goal feedback history ([Issue #14](https://github.com/allanweber/nutrition-app/issues/14))
  - Files: [src/server/db/schema.ts](src/server/db/schema.ts)
  - Create table `body_checkins` with:
    - required: `weightKg` (normalized), `checkInDate`, `userId`
    - optional: photos (front/back/left/right), skinfolds (json), notes
    - optional link: `goalId` (goal effective at `checkInDate`)
    - raw input: `inputUnitSystem`, `rawWeight`
  - DoD: types exported + relations (user/checkins, goal/checkins).

- [ ] A5. Create and apply a Drizzle migration for `body_checkins` ([Issue #14](https://github.com/allanweber/nutrition-app/issues/14))
  - Files: `drizzle/*.sql` (new)
  - DoD: schema push/migrate succeeds locally.

## B) Goal Templates & Calculator Core

- [ ] B1. Create macro preset definitions ([Issue #15](https://github.com/allanweber/nutrition-app/issues/15))
  - Files: [src/lib/goal-templates.ts](src/lib/goal-templates.ts) (new)
  - Include: `balanced`, `high_protein`, `low_carb`, `high_carb_performance` with `fatPct`, protein defaults/range.
  - DoD: presets are strongly typed and usable by API + UI.

- [ ] B2. Implement unit conversion helpers (metric/imperial) ([Issue #15](https://github.com/allanweber/nutrition-app/issues/15))
  - Files: [src/lib](src/lib) (new file, e.g. `goal-units.ts`)
  - DoD: conversions are deterministic and covered by quick unit tests if a test pattern exists.

- [ ] B3. Implement goal calculation helpers (pure functions) ([Issue #15](https://github.com/allanweber/nutrition-app/issues/15))
  - Files: [src/lib](src/lib) (new file, e.g. `goal-calculator.ts`)
  - Must implement:
    - Mifflin–St Jeor BMR
    - TDEE via `activityMultiplier`
    - rate-based daily delta using 7700 kcal/kg
    - defaults for `muscle_gain` (+250) and `fat_loss` (-250) when rate omitted
    - macro math with protein g/kg
    - rounding rules + non-negative guard
    - minimum-calories warnings (warn only)
  - DoD: functions are side-effect-free and unit-tested if there’s an existing unit test setup.

## C) API Endpoints

- [ ] C1. Add calculate endpoint ([Issue #16](https://github.com/allanweber/nutrition-app/issues/16))
  - Files: [src/app/api/goals/calculate/route.ts](src/app/api/goals/calculate/route.ts) (new)
  - Contract:
    - `POST` accepts wizard inputs (unit system supported)
    - returns `normalizedInputs`, `bmrCalories`, `tdeeCalories`, `recommendedTargets`, `warnings`
  - DoD: server-side Zod validation; returns structured validation errors.

- [ ] C2. Upgrade goals CRUD endpoint to support history + activeAt ([Issue #16](https://github.com/allanweber/nutrition-app/issues/16))
  - Files: [src/app/api/goals/route.ts](src/app/api/goals/route.ts)
  - Changes:
    - `GET`: support `activeAt=YYYY-MM-DD` and optionally return history list
    - `POST`: create new goal record using final targets + store wizard snapshot fields
    - Auto-end overlapping prior goals for the user
    - Keep `PUT` temporarily as backwards-compatible “replace active goal” alias (optional), or migrate callers to `POST`.
  - DoD: can create two goals and verify the first is auto-ended.

- [ ] C3. Add goal progress endpoint ([Issue #16](https://github.com/allanweber/nutrition-app/issues/16))
  - Files: [src/app/api/goals/progress/route.ts](src/app/api/goals/progress/route.ts) (new)
  - `GET ?from&to` returns per-day totals joined to active goal of each day.
  - DoD: response includes both consumed totals and targets.

- [ ] C4. Add weekly/monthly summary endpoint ([Issue #16](https://github.com/allanweber/nutrition-app/issues/16))
  - Files: [src/app/api/analytics/summary/route.ts](src/app/api/analytics/summary/route.ts) (new)
  - `GET ?range=weekly|monthly&date=` returns aggregates + adherence.
  - DoD: used by UI (or at least callable + validated).

- [ ] C5. Add check-ins CRUD endpoint ([Issue #16](https://github.com/allanweber/nutrition-app/issues/16))
  - Files:
    - [src/app/api/body-checkins/route.ts](src/app/api/body-checkins/route.ts) (new)
    - [src/app/api/body-checkins/[id]/route.ts](src/app/api/body-checkins/[id]/route.ts) (new)
  - Contract:
    - `GET` returns history, filterable by date range
    - `POST` creates a check-in (weight required; photos/skinfolds optional)
    - `DELETE` removes a check-in
    - (Optional) `PATCH` updates a check-in
  - Behavior:
    - On create, compute the goal effective on `checkInDate` and persist `goalId`.
  - DoD: creating a check-in shows up in goals progress payload.

## D) Client Data Layer (TanStack Query)

- [ ] D1. Update goals queries to match new API shape ([Issue #17](https://github.com/allanweber/nutrition-app/issues/17))
  - Files: [src/queries/goals.ts](src/queries/goals.ts)
  - Add:
    - `useGoalHistoryQuery()`
    - `useActiveGoalQuery(activeAt)`
    - `useCreateGoalMutation()`
    - `useEndGoalMutation()` (PATCH endDate) (optional)
    - `useDeleteGoalMutation()`
  - DoD: mutations invalidate related queries; errors flow through existing API error helpers.

- [ ] D2. Keep backwards compatibility with existing hook(s) ([Issue #17](https://github.com/allanweber/nutrition-app/issues/17))
  - Files: [src/hooks/use-nutrition-goals.ts](src/hooks/use-nutrition-goals.ts)
  - DoD: existing pages still work, even if they later migrate to the wizard.

- [ ] D3. Add check-ins queries/mutations ([Issue #17](https://github.com/allanweber/nutrition-app/issues/17))
  - Files: [src/queries](src/queries) (new file recommended: `body-checkins.ts`)
  - Add:
    - `useBodyCheckinsQuery({ from, to })`
    - `useCreateBodyCheckinMutation()`
    - `useDeleteBodyCheckinMutation()`
  - DoD: mutations invalidate check-in list + goals progress queries.

## E) UI: Wizard + Goals Page

- [ ] E1. Build reusable StepWizard shell ([Issue #18](https://github.com/allanweber/nutrition-app/issues/18))
  - Files: [src/components](src/components) (new file, e.g. `step-wizard.tsx`)
  - DoD: supports next/back, per-step validation gating, step indicator.

- [ ] E2. Build GoalWizard component using `@tanstack/react-form` ([Issue #18](https://github.com/allanweber/nutrition-app/issues/18))
  - Files: [src/components/goal-wizard.tsx](src/components/goal-wizard.tsx) (new)
  - Steps (per spec): Units → Body → Activity → Goal(+rate) → Preset → Review/Override(+warnings) → Schedule → Save
  - DoD: calls calculate endpoint during review step; supports manual override before save.

- [ ] E3. Integrate GoalWizard into Goals page ([Issue #18](https://github.com/allanweber/nutrition-app/issues/18))
  - Files: [src/app/(dashboard)/goals/page.tsx](<src/app/(dashboard)/goals/page.tsx>)
  - Add:
    - Active goal summary card
    - “Create new goal” button opens wizard (dialog/drawer)
    - Goal history list with effective dates
    - End/delete actions (as implemented in API)
  - DoD: user can create a new goal and see it reflected without refresh.

- [ ] E4. Add wizard validation schemas ([Issue #18](https://github.com/allanweber/nutrition-app/issues/18))
  - Files: [src/lib/form-validation.ts](src/lib/form-validation.ts)
  - DoD: field-level errors show in UI; blocks step progression when invalid.

- [ ] E5. Add check-in form + history UI to Goals page ([Issue #18](https://github.com/allanweber/nutrition-app/issues/18))
  - Files: [src/app/(dashboard)/goals/page.tsx](<src/app/(dashboard)/goals/page.tsx>)
  - UI requirements:
    - Weight field is required
    - Optional sections for photos (front/back/left/right) and skinfolds
    - List/history of submitted check-ins
  - DoD: new check-in appears immediately in history and charts.

- [ ] E6. Add charts for goal tracking (Goals page + Dashboard) ([Issue #18](https://github.com/allanweber/nutrition-app/issues/18))
  - Files:
    - [src/components/charts](src/components/charts) (new components)
    - [src/app/(dashboard)/goals/page.tsx](<src/app/(dashboard)/goals/page.tsx>)
    - [src/app/(dashboard)/dashboard/page.tsx](<src/app/(dashboard)/dashboard/page.tsx>)
  - Components (suggested):
    - `goal-weight-trend-chart.tsx` (weight check-ins over time)
    - `goal-adherence-chart.tsx` (consumed vs targets)
  - DoD: charts render for the active goal and update when new check-in is added.

## F) E2E Tests (Playwright)

- [ ] F1. Add goals page object support as needed ([Issue #19](https://github.com/allanweber/nutrition-app/issues/19))
  - Files: [e2e/pages/goals.page.ts](e2e/pages/goals.page.ts)
  - DoD: has helpers to open wizard, fill steps, and assert saved goal.

- [ ] F2. Implement Phase 4 E2E spec ([Issue #19](https://github.com/allanweber/nutrition-app/issues/19))
  - Files: [e2e/phase-4-goals.spec.ts](e2e/phase-4-goals.spec.ts) (new)
  - Must cover:
    - metric goal creation
    - imperial goal creation + conversion
    - manual override saved
    - overlap auto-end behavior
    - muscle_gain default +250 when no rate
    - fat_loss default -250 when no rate
    - minimum-calories warning appears but allows saving
    - weight-only check-in persists
    - optional photo check-in persists (or at least UI accepts + stores references)
    - optional skinfold check-in persists
    - weight chart updates after new check-in
  - DoD: passes locally with `npm run test:e2e`.

## G) Polish / Cleanup

- [ ] G1. Remove/adjust legacy goal editing UI if redundant ([Issue #20](https://github.com/allanweber/nutrition-app/issues/20))
  - Files: [src/app/(dashboard)/goals/page.tsx](<src/app/(dashboard)/goals/page.tsx>)
  - DoD: no duplicate/confusing flows; prefer wizard as primary.

- [ ] G2. Verify dashboard progress visuals still align with goals ([Issue #20](https://github.com/allanweber/nutrition-app/issues/20))
  - Files: dashboard components that display goal progress
  - DoD: dashboard uses the active goal for the relevant date range.
