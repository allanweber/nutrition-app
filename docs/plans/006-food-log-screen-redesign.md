# Food Log Screen Redesign

## Context

The current food log page is a single-column layout with basic shadcn/ui Card components and no nutrition summary sidebar. The new design introduces:
- A two-column layout (8-left content / 4-right sidebar)
- A sticky "Nutrition Pulse" sidebar with a calorie ring, macro progress bars, and quick-add recents
- A weekly calendar strip for date navigation
- Redesigned meal cards that match the Vitalis Emerald aesthetic (rounded-2xl, border, hover, food photo thumbnails)
- "Plan Dinner" empty state placeholders for unlogged meals
- Dark mode support for all new components

---

## Architecture Decision

`page.tsx` is currently a **client component**. To render the `NutritionPulse` sidebar using the server-side `getDailySummary()` (already used by the dashboard), we restructure:

- `page.tsx` → **Server component** (thin shell with the 2-col grid + Suspense)
- `food-log-content.tsx` → **Client component** (extracted from current page.tsx, left column)
- `nutrition-pulse-server.tsx` → **Server component** (fetches DailySummaryDTO, date from searchParams)
- `nutrition-pulse.tsx` → **Client component** (renders the sidebar UI)

---

## Files to Modify

### 1. `src/app/(dashboard)/food-log/page.tsx`
- Convert from client to **server component**
- Accept `searchParams` for initial date
- Render a `lg:grid-cols-12 gap-8` layout
  - Left `lg:col-span-8`: `<FoodLogContent />`
  - Right `lg:col-span-4`: `<Suspense>` wrapping `<NutritionPulseServer />`

### 2. `src/components/food-log-client.tsx`
- Remove the old `<Card>` date navigation block
- Remove the `Daily Summary` 4-column grid (moved to sidebar)
- Receive `selectedDate` and `onDateChange` as props (date state now lifted to `FoodLogContent`)
- Render `<WeeklyCalendarStrip>` as the date nav
- Redesign meal cards:
  - `rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-all shadow-sm`
  - Meal header: meal name (xl bold headline) + logged time (sm muted) + `{X} kcal` (primary)
  - Food rows: 48×48 rounded-lg photo, name (bold), serving string, right-aligned kcal + macros, `more_vert` / trash trigger
  - Empty meal placeholders: dashed border button "Plan {MealType}" for meals with zero logs

---

## Files to Create

### 3. `src/app/(dashboard)/food-log/food-log-content.tsx` (Client Component)
Extract all current `page.tsx` logic into this component:
- `useState` for `selectedDate`, `selectedFood`, `modalOpen`
- All query hooks (`useFoodLogsQuery`, `useDeleteFoodLogMutation`, `useFoodDetailQuery`, `useFoodSearch`)
- Header: `"Meal Planner & Daily Intake"` (4xl headline) + formatted date subtitle
- Inline search area: `FoodSearchField` + `Create Plan` + `Create Food` buttons (row layout, no Card wrapper)
- `<FoodLogClient>` and `<FoodLogAddModal>`
- Passes `selectedDate` and `onDateChange` down to `FoodLogClient`

### 4. `src/components/food-log/weekly-calendar-strip.tsx` (Client Component)
Props: `selectedDate: Date`, `onDateChange: (date: Date) => void`
- Computes current week (Mon–Sun) using `date-fns` (`startOfWeek`, `addDays`)
- Renders 7 day pills: `{ MON/TUE label + date number }`
- Active day: `bg-primary text-primary-foreground rounded-xl`
- Other days: `hover:bg-surface-container-low rounded-xl cursor-pointer`
- Disabled future days
- `Full Month` button (visual placeholder — routes to `/food-log` with calendar param in future)
- Container: `bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 shadow-sm`

### 5. `src/components/food-log/nutrition-pulse-server.tsx` (Server Component)
- Calls `getDailySummary(userId, date)` from `src/server/services/dashboard.service.ts`
- Gets `userId` from BetterAuth session
- Accepts `date: string` prop (from page searchParams)
- Passes `DailySummaryDTO` + `recentFoods` (last 5 unique food names from logs query) to `<NutritionPulse>`

### 6. `src/components/food-log/nutrition-pulse.tsx` (Client Component)
Props:
```typescript
{
  remaining: number
  consumed: number
  goal: number
  percentConsumed: number
  macros: {
    protein: { consumed: number; goal: number }
    carbs:   { consumed: number; goal: number }
    fat:     { consumed: number; goal: number }
  }
  recentFoods: string[]  // for quick-add buttons
  onQuickAdd: (foodName: string) => void
}
```

**Light mode** (matches mockup):
- Container: `bg-[#C1F0B1] rounded-[2rem] p-8 sticky top-24 overflow-hidden relative`
- Decorative circle: `absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full`
- Text: `text-[#002203]` (very dark green)
- Ring track: `#aee39d`, fill: `#206223`

**Dark mode** (via `dark:` classes):
- Container: `dark:bg-surface-container dark:border dark:border-primary/30`
- Text: `dark:text-foreground`
- Ring track: `dark:text-surface-container-high`, fill: `dark:text-primary`
- Progress bar track: `dark:bg-surface-container-high`
- Insight cards: `dark:bg-surface-container-low/60`

**Calorie Ring**: Reuse `CircularProgress` from `src/components/dashboard/calories/circular-progress.tsx`
- Override colors via props for the green theme in light mode / CSS var in dark mode

**Macro Bars**: Inline (not using shared `ProgressBar` since colors need to be all-green in light / macro colors in dark)
- Light: all bars `bg-[#206223]` on `bg-[#aee39d]` track
- Dark: `MACRO_COLORS` (protein rose, carbs amber, fat sky)

**Insight cards**: Optional `insights?: { type: 'info'|'warning'; title: string; message: string }[]` prop
- Rendered if provided; compute from nutrition data (e.g., protein ≥ 80% → recovery tip, sodium > threshold → alert)
- Light: `bg-white/40 border border-[#206223]/10`
- Dark: `dark:bg-surface-container-low`

**Quick Add Recent**:
- Shows up to 5 recent food names as pill buttons
- `bg-white/40 hover:bg-white/60 dark:bg-surface-container-low dark:hover:bg-surface-container`
- Clicking calls `onQuickAdd(foodName)` which triggers the food search → modal flow

---

## Reused Components (no changes)
- `src/components/dashboard/calories/circular-progress.tsx` — calorie ring
- `src/components/food-search-field/` — search field unchanged
- `src/components/food-log-add-modal.tsx` — add modal unchanged
- `src/server/services/dashboard.service.ts` → `getDailySummary()` — data source for sidebar
- `src/lib/nutrition-constants.ts` — `MEAL_TYPE_ORDER`, `MEAL_TYPE_LABELS`, `MACRO_COLORS`

---

## Data Flow

```
page.tsx (Server)
├── FoodLogContent (Client) — left col
│   ├── WeeklyCalendarStrip (Client) — date nav
│   ├── FoodSearchField — search
│   ├── FoodLogClient (Client) — meal cards
│   └── FoodLogAddModal — add modal
└── NutritionPulseServer (Server) — right col
    └── NutritionPulse (Client) — sidebar UI
```

`FoodLogContent` maintains `selectedDate` and notifies `NutritionPulseServer` via URL param (or prop drilling). Since the pulse is server-rendered, date changes will trigger a soft nav to update searchParams → refetch the sidebar. Alternatively: NutritionPulse fetches via TanStack Query against `/api/nutrition-summary?date=` to update reactively without full navigation.

**Recommended**: Add `GET /api/nutrition-summary?date=` that calls `getDailySummary()` and exposes it as a TanStack Query hook `useNutritionSummaryQuery(date)` — keeps `NutritionPulse` as a pure client component that refetches on date change, removing the need for searchParams complexity.

---

## New API Endpoint

### `GET /api/nutrition-summary?date=YYYY-MM-DD`
- File: `src/app/api/nutrition-summary/route.ts`
- Auth: BetterAuth session
- Calls: `getDailySummary(userId, date)`
- Returns: `DailySummaryDTO` shape (remaining, consumed, goal, macros, hasGoal)

---

## Dark Mode Strategy

| Element | Light | Dark |
|---------|-------|------|
| Sidebar bg | `bg-[#C1F0B1]` | `dark:bg-surface-container` |
| Sidebar text | `text-[#002203]` | `dark:text-foreground` |
| Ring fill | `#206223` | CSS var `--primary` |
| Ring track | `#aee39d` | CSS var `--surface-container-high` |
| Macro bars (all green in light) | `#206223` | macro colors (rose/amber/sky) |
| Macro track | `#aee39d` | `dark:bg-surface-container-high` |
| Insight cards | `bg-white/40` | `dark:bg-surface-container-low` |
| Quick-add pills | `bg-white/40` | `dark:bg-surface-container-low` |
| Meal cards | white + border | `dark:bg-surface-container-low` |
| Weekly strip | white bg | `dark:bg-surface-container-low` |
| Active day | `bg-primary text-primary-foreground` | same |

---

## E2E Test Plan

### Page Object Updates — `e2e/pages/food-log.page.ts`

The redesign changes several locators. The page object must be updated:

| Locator | Current | Updated |
|---------|---------|---------|
| `heading` | `getByRole('heading', { name: 'Food Log' })` | `getByRole('heading', { name: 'Meal Planner & Daily Intake' })` |
| `dailySummary` | `getByTestId('daily-summary')` | Remove — summary moves to sidebar; add `nutritionPulse: getByTestId('nutrition-pulse')` |
| `caloriesTotal` | `getByTestId('calories-total')` | `getByTestId('pulse-calories-remaining')` (in sidebar) |
| `navigateToPreviousDay` | filters on `svg.lucide-chevron-left` | `getByTestId('week-day-prev')` or click the previous week day pill |
| `navigateToNextDay` | filters on `svg.lucide-chevron-right` | disabled future day pill |
| `navigateToToday` | `getByRole('button', { name: /today/i })` | click today's day pill in the weekly strip |

New locators to add:
```typescript
readonly nutritionPulse: Locator;          // data-testid="nutrition-pulse"
readonly weeklyStrip: Locator;             // data-testid="weekly-calendar-strip"
readonly pulseCaloriesRemaining: Locator;  // data-testid="pulse-calories-remaining"
readonly pulseMacroProtein: Locator;       // data-testid="pulse-macro-protein"
readonly pulseMacroCarbs: Locator;         // data-testid="pulse-macro-carbs"
readonly pulseMacroFat: Locator;           // data-testid="pulse-macro-fat"
readonly quickAddButtons: Locator;         // data-testid="quick-add-recent"
readonly emptyMealPlaceholder: Locator;    // data-testid="meal-empty-placeholder"

// Date navigation via weekly strip
async clickDay(dayIndex: number): navigate to a specific day (0=Mon … 6=Sun)
async clickTodayInStrip(): click today's highlighted pill
```

New helper methods:
```typescript
async getNutritionPulseVisible(): Promise<boolean>
async getPulseCaloriesRemaining(): Promise<number>
async getQuickAddFoodNames(): Promise<string[]>
```

---

### New E2E Spec — `e2e/006-food-log-redesign.spec.ts`

#### Suite: Layout & Structure
- **Two-column layout visible on desktop**: heading, weekly strip, search, meal cards on left; nutrition pulse on right
- **Sidebar stacks below on mobile** (viewport 375×667): nutrition pulse `below` meal section in DOM order
- **Page heading is "Meal Planner & Daily Intake"**: `expect(foodLogPage.heading).toBeVisible()`

#### Suite: Weekly Calendar Strip
- **Renders 7 day pills for current week**: 7 elements with `data-testid="week-day-*"`
- **Today's pill is highlighted** (has `bg-primary` or active variant class)
- **Clicking a past day updates displayed date**: click Monday pill → meal cards reflect Monday's logs (empty for fresh user)
- **Future day pills are disabled**: next day from today is not clickable
- **Clicking today pill from a past day returns to today**: navigate back to today

#### Suite: Nutrition Pulse Sidebar
- **Sidebar is visible**: `expect(foodLogPage.nutritionPulse).toBeVisible()`
- **Shows remaining calories**: `pulse-calories-remaining` is visible with a numeric value
- **Shows protein, carbs, fat progress bars**: all three `pulse-macro-*` locators visible
- **Sidebar updates after food is logged**: add food → wait → `pulse-calories-remaining` value decreases
- **Sidebar reflects user with no goals** (fresh professional user): calorie ring shows 0 or nudge text, no crash
- **Dark mode: sidebar renders correctly**: set dark class → `nutrition-pulse` still visible, text contrast valid

#### Suite: Meal Card Redesign
- **Meal cards show meal name and total kcal**: `text=Breakfast` + `text=420 kcal` pattern
- **Food items show photo thumbnail when available**: `img` within `food-log-{id}` is visible
- **Empty meal placeholder renders for unlogged meals**: `data-testid="meal-empty-placeholder"` contains "Plan" text
- **Empty meal placeholder is not shown for logged meals**: no placeholder visible for meals that have entries

#### Suite: Quick Add Recent
- **Quick add buttons appear for users with today's logs**: `quick-add-recent` has ≥1 button
- **Clicking a quick add button opens the search modal**: click pill → `food-add-modal` appears with food pre-filled
- **No quick add buttons for fresh user with no logs**: section hidden or shows placeholder

#### Suite: Existing Regression (update existing tests that break)
Update `phase-2-food-logging.spec.ts`:
- `'food log page has required sections'`: replace `getByText('Add Food')` assertion with `getByTestId('food-search-input').isVisible()` and `getByTestId('nutrition-pulse').isVisible()`
- `'daily summary shows values for seeded user'`: replace `dailySummary` / `calories-total` assertions with `pulse-calories-remaining`
- `'can navigate to previous day'`: replace `navigateToPreviousDay()` (chevron-left SVG) with weekly strip `clickDay()` or `data-testid` based selector
- `'can navigate back to today'`: replace `navigateToToday()` with `clickTodayInStrip()`
- `'cannot navigate to future dates'`: verify future day pills are disabled/absent instead of checking chevron button

---

### `data-testid` Attributes Required in New Components

| Component | testid |
|-----------|--------|
| `FoodLogContent` header | `food-log-heading` |
| `WeeklyCalendarStrip` container | `weekly-calendar-strip` |
| Individual day pill | `week-day-{YYYY-MM-DD}` |
| `NutritionPulse` container | `nutrition-pulse` |
| Calories remaining value | `pulse-calories-remaining` |
| Protein bar row | `pulse-macro-protein` |
| Carbs bar row | `pulse-macro-carbs` |
| Fat bar row | `pulse-macro-fat` |
| Quick add container | `quick-add-recent` |
| Quick add button per food | `quick-add-{slug}` |
| Empty meal placeholder | `meal-empty-placeholder-{mealType}` |

---

## Verification

1. `npm run dev` → navigate to `/food-log`
2. Confirm 2-col layout: meal log left, nutrition pulse right
3. Click days in weekly strip → meal cards update, calorie ring updates
4. Log a food via search → ring and macro bars update reactively
5. Delete a log → sidebar remaining calories increases
6. Toggle dark mode → sidebar bg, text, ring, bars all flip correctly
7. Mobile (375px): sidebar stacks below meal cards, all content accessible
8. Run `npm run test:e2e` — existing passing tests still pass (after page object updates)
9. New `006-food-log-redesign.spec.ts` suite passes all cases
