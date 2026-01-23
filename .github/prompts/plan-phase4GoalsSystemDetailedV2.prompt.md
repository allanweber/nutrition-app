# Phase 4: Goals System — Detailed Spec (Wizard + Calculator + Goal History) — v2

## Goals (What “Done” Means)

- Users can create nutrition goals via a multi-step wizard.
- Wizard stores ALL inputs (including original units) plus computed values.
- Units supported: metric + imperial (with conversion).
- Macro strategy: user-selectable presets (high-protein / low-carb / etc).
- Manual override allowed on final targets before saving.
- Goal history supported with effective dates (`startDate`, optional `endDate`).
- When creating a new goal, automatically end the previous overlapping goal.
- BMR formula: Mifflin–St Jeor.
- Goal rate for weight loss/gain: chosen by rate (kg/week or lb/week UI).
- For `muscle_gain` and `fat_loss`, default to a small surplus/deficit if rate is not provided.
- Minimum-calories handling: show warning but allow saving.

- Users can submit periodic check-ins:
  - Weight is required
  - Photos (front/back/left/right) are optional
  - Skinfold measurements are optional
- Check-ins are stored as a history and linked to the active goal at the check-in date.
- Goals page and dashboard show charts for the active goal (adherence + weight trend).

---

## High-Level Architecture

### Data flow

1. UI wizard collects inputs (with unit system).
2. UI calls `POST /api/goals/calculate` to get recommended targets + intermediate values.
3. UI optionally allows manual overrides.
4. UI calls `POST /api/goals` to persist a goal record (history).
5. Dashboard/Goals page fetches:
   - active goal for selected date
   - goal history list
   - progress series (daily totals vs goal targets)

6. User submits periodic check-ins (weight required; photos/skinfolds optional).
7. Goals page and dashboard charts combine goals + progress + check-ins.

### Constraints (repo conventions)

- API must validate inputs on server side with Zod + existing validation helpers.
- Forms must use `@tanstack/react-form`.
- TanStack Query: only pages use queries; components receive data as props.

---

## Database Design

### Existing

- `goal_type` enum already contains:
  - `weight_loss`, `maintenance`, `weight_gain`, `muscle_gain`, `fat_loss`, `performance`, `general_health`
- `nutrition_goals` table exists with computed targets and `startDate`/`endDate`.

### Required changes to `nutrition_goals`

Add fields to store wizard inputs + calculation snapshot. Recommend storing:

**Normalized inputs (metric) for consistent computation/history**

- `ageYears` (integer)
- `sex` (varchar) — snapshot input used for BMR formula (e.g., `male|female|other`).
- `heightCm` (decimal)
- `weightKg` (decimal)
- `activityMultiplier` (decimal) — e.g., 1.2 / 1.375 / 1.55 / 1.725 / 1.9
- `goalRateKgPerWeek` (decimal, nullable) — required for `weight_loss`/`weight_gain`, optional otherwise.

**Preset + rule configuration**

- `macroPresetId` (varchar) — e.g., `balanced`, `high_protein`, `low_carb`, `high_carb`
- `proteinGPerKg` (decimal)

**Calculation snapshot**

- `bmrCalories` (decimal)
- `tdeeCalories` (decimal)
- `recommendedTargets` (jsonb) — recommended calories/macros before overrides.
- `wasManuallyOverridden` (boolean) — whether final targets differ from recommended.
- `calorieAdjustmentStrategy` (varchar) — e.g., `rate_based|default_delta|maintenance`

**Raw/original inputs for “store all” + unit support**

- `inputUnitSystem` (varchar) — `metric|imperial`
- `wizardInputs` (jsonb) — original fields exactly as entered, incl. units, UI selections.

### New: `body_checkins` (goal feedback history)

Create a new table to store user feedback over time.

Recommended columns:

- `id` (serial PK)
- `userId` (FK)
- `goalId` (FK to `nutrition_goals`, nullable) — set to the goal effective on `checkInDate`
- `checkInDate` (timestamp) — when the check-in applies (not necessarily createdAt)
- `inputUnitSystem` (varchar) — `metric|imperial`
- `weightKg` (decimal, NOT NULL) — normalized, always stored in kg
- `rawWeight` (jsonb) — original entered weight + unit (e.g., `{ value: 180, unit: "lb" }`)
- `photos` (jsonb, nullable) — `{ front?: string, back?: string, left?: string, right?: string }` (URL/path)
- `skinfoldsMm` (jsonb, nullable) — named sites in mm, e.g., `{ triceps?: number, abdomen?: number, suprailiac?: number, thigh?: number, ... }`
- `notes` (text, nullable)
- `createdAt` (timestamp)

Indexes:

- `(userId, checkInDate)`
- `(goalId, checkInDate)` (optional)

### History + overlap rule

- A goal is “active at date D” when:
  - `startDate <= D` AND (`endDate IS NULL OR endDate >= D`).
- **On create**: auto-end any existing goals overlapping new `startDate`.
  - Set `endDate = newStartDate - 1 day` for any goal with `endDate IS NULL OR endDate >= newStartDate`.

### Indexing recommendations

- Index `(userId, startDate)`
- Index `(userId, endDate)` or partial index for `endDate IS NULL` (optional)

---

## Goal Templates / Macro Presets

Create [src/lib/goal-templates.ts](src/lib/goal-templates.ts) exporting presets.

### Preset model

Each preset defines:

- `id`, `label`, `description`
- `fatPct` (0–1)
- optional `carbPct` (0–1) OR compute carbs as remainder after protein+fat
- `defaultProteinGPerKg` and allowed range (e.g., 1.6–2.2)
- optional notes/warnings

### Initial presets (recommended)

- `balanced`
  - fatPct ~ 0.30
  - protein default 1.8 g/kg
- `high_protein`
  - fatPct ~ 0.25
  - protein default 2.2 g/kg
- `low_carb`
  - fatPct ~ 0.40
  - protein default 2.0 g/kg
- `high_carb_performance`
  - fatPct ~ 0.20
  - protein default 1.8 g/kg

---

## Calculator Spec (Server-Side)

### Route

- `POST /api/goals/calculate`

### Input (calculate)

- `goalType` (enum)
- `inputUnitSystem`: `metric|imperial`
- `sex` (string)
- `ageYears` (number)
- `height` (cm OR feet/inches)
- `weight` (kg OR lbs)
- `activityLevel` (label) and/or `activityMultiplier`
- `goalRate` (kg/week or lb/week) — required for weight loss/gain; optional otherwise.
- `macroPresetId`
- `proteinGPerKg` (optional; defaults from preset)

### Output (calculate)

Return a pure, deterministic response:

- `normalizedInputs`: { `heightCm`, `weightKg`, `goalRateKgPerWeek`, `activityMultiplier` }
- `bmrCalories` (Mifflin–St Jeor)
- `tdeeCalories`
- `recommendedTargets`:
  - `targetCalories`
  - `targetProteinG`
  - `targetFatG`
  - `targetCarbsG`
  - optional `targetFiberG`, `targetSodiumMg` (if you want to include now)
- `warnings`: string[] (e.g., minimum calories warning)
- `explain` (optional): calorie deficit/surplus per day, preset used, rounding notes.

### Formulas

**Mifflin–St Jeor**

- male: `BMR = 10*w + 6.25*h - 5*a + 5`
- female: `BMR = 10*w + 6.25*h - 5*a - 161`
  - $w$ in kg, $h$ in cm, $a$ in years

**TDEE**

- `TDEE = BMR * activityMultiplier`

**Rate → daily energy delta**

- Use 7700 kcal per kg as the conversion.
- `dailyDelta = (goalRateKgPerWeek * 7700) / 7`
  - for weight loss: subtract
  - for weight gain: add

**Calories target**

- maintenance: `targetCalories = TDEE`
- weight_loss: `targetCalories = TDEE - dailyDelta`
- weight_gain: `targetCalories = TDEE + dailyDelta`
- muscle_gain:
  - if goalRate provided: treat like weight_gain
  - else: `targetCalories = TDEE + 250` (default small surplus)
- fat_loss:
  - if goalRate provided: treat like weight_loss
  - else: `targetCalories = TDEE - 250` (default small deficit)
- performance/general_health:
  - default to `targetCalories = TDEE` unless user provides a rate.

**Macros**

- Protein grams: `proteinG = proteinGPerKg * weightKg`
- Protein calories: `proteinCal = proteinG * 4`
- Fat calories: `fatCal = targetCalories * fatPct`
- Carbs calories: `carbCal = targetCalories - proteinCal - fatCal`
- Fat grams: `fatG = fatCal / 9`
- Carbs grams: `carbsG = carbCal / 4`

### Rounding

- Calories: round to nearest integer.
- Macro grams: round to nearest 1g.
- Ensure carbs/fat not negative.

### Minimum-calories warnings (allow save)

- Define warning thresholds (tunable): e.g., <1200 (female) / <1500 (male) or a single global threshold.
- If below threshold: add a warning string, but do not fail validation.

---

## Goals CRUD API (History + Active-at-date)

### Routes

- `GET /api/goals`
  - supports `activeAt=YYYY-MM-DD` to return the goal effective on that date.

- `POST /api/goals`
  - creates a new goal record.
  - performs auto-end overlap logic.
  - stores both wizard inputs and final computed targets.

- (Recommended) `PATCH /api/goals/[id]`
  - edits limited fields (e.g., `endDate`, targets) to preserve history integrity.

- `DELETE /api/goals/[id]`
  - deletes a goal record.

---

## Progress Tracking + Summaries

### Progress endpoint

- `GET /api/goals/progress?from=YYYY-MM-DD&to=YYYY-MM-DD`
  Returns per-day entries:
- date
- consumed totals (calories/protein/carbs/fat)
- active goal targets that day
- percent-to-goal per metric

Additionally include check-in series for the same date range:

- weight check-ins (date + weightKg)
- optional photo/skinfold presence flags (for UI)

### Weekly/monthly summaries

- `GET /api/analytics/summary?range=weekly|monthly&date=YYYY-MM-DD`
  Return aggregated totals and average adherence vs goal.

---

## UI/UX: Goal Wizard (Reusable Multi-Step Form)

### Component split

- `GoalWizard` (nutrition-specific wrapper)
- `StepWizard` (generic reusable shell)

### StepWizard responsibilities

- Step navigation (next/back)
- Validation gate per step
- Progress indicator
- Shared submit orchestration

### GoalWizard steps (recommended)

1. Units
   - choose `metric|imperial`
2. Body info
   - sex, ageYears, height, weight
3. Activity
   - choose label + multiplier
4. Goal
   - goalType
   - if `weight_loss` or `weight_gain`: rate selector (kg/week or lb/week)
   - if `muscle_gain`/`fat_loss`: rate optional + show “defaults to ±250 kcal if omitted”
   - for `performance`/`general_health`: rate optional/hidden by default
5. Macros preset
   - choose preset
   - choose protein g/kg within allowed range
6. Review + Override
   - show BMR/TDEE and recommended targets
   - show warnings (min calories)
   - allow manual override calories/macros
7. Schedule
   - startDate (default today)
   - optional endDate
8. Save
   - call create goal mutation

---

## UI/UX: Check-ins (Goal Feedback)

### Check-in form (Goals page)

Single form with progressive disclosure:

- Required: weight
- Optional toggles/sections:
  - Add photos (front/back/left/right)
  - Add skinfolds (site list)
  - Add notes

### Check-in history

- Table/list by date (latest first)
- Edit/delete (optional; at minimum allow delete)

### Goal tracking charts

On Goals page:

- Weight trend chart for the active goal date range
- Adherence chart (calories/macros vs targets) for selected range

On Dashboard:

- Compact weight trend chart (last 30/60/90 days) aligned to active goal
- Optional: “Change since goal start” KPI (based on goal start weight vs latest check-in)

---

## E2E (Playwright) — Phase 4

Create [e2e/phase-4-goals.spec.ts](e2e/phase-4-goals.spec.ts) covering:

1. Create goal via wizard (metric)
2. Create goal via wizard (imperial)
3. Calculator sanity check (expected BMR/TDEE tolerance)
4. Manual override saves overridden targets
5. Goal history overlap auto-ends previous goal
6. muscle_gain default +250 when no rate set
7. fat_loss default -250 when no rate set
8. Minimum-calories warning appears but allows saving

Add check-in coverage:

9. User adds a weight-only check-in and sees it in history
10. User adds a check-in with photos (optional) and it persists
11. User adds a check-in with skinfolds (optional) and it persists
12. Weight chart updates after a new check-in

---

## Decisions Confirmed

- Auto-end previous goal on new start date: YES.
- `performance`/`general_health` goal-rate: optional.
- BMR formula: Mifflin–St Jeor.
- `muscle_gain`/`fat_loss` default delta when no rate: YES (+250/-250).
- Minimum calories: warning only, allow save.
