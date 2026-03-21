# Feature Specification: Dashboard Redesign

**Feature Branch**: `005-dashboard-redesign`
**Created**: 2026-03-21
**Status**: Draft
**Input**: User description: "Redesign the user dashboard with new light and dark themes, creating reusable components and preparing for future features"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Core Dashboard Layout (Priority: P1)

A user opens the dashboard and sees a fully structured bento-grid layout presenting their daily nutrition at a glance — calories consumed vs. goal, macronutrient breakdown, hydration progress, a weekly momentum chart, and a daily schedule. The page loads server-side with each section appearing in a logical visual hierarchy.

**Why this priority**: The dashboard is the primary entry point to the application. Getting the structural layout and data rendering right is the foundation everything else builds on.

**Independent Test**: Can be fully tested by navigating to the dashboard route and verifying each section renders with real data (or skeleton states) and correct layout at desktop and mobile widths.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they navigate to the dashboard, **Then** the page renders server-side with five distinct data sections arranged in a 12-column bento grid.
2. **Given** a logged-in user, **When** the page loads, **Then** each section displays its data independently — a slow section does not block other sections from rendering.
3. **Given** a logged-in user on a mobile device, **When** viewing the dashboard, **Then** the bento grid stacks to a single column and all data remains readable.

---

### User Story 2 - Light and Dark Theme Support (Priority: P2)

A user can toggle between a light and dark theme on the dashboard. Both themes use the same component structure but apply distinct color palettes — light uses a deep forest green primary (#206223) and white surfaces; dark uses a bright emerald green primary (#4ade80) and deep slate surfaces. The theme preference persists across sessions.

**Why this priority**: Both themes are part of the design specification and must be correct before marking the redesign complete. Theme switching is a quality-of-life feature that users expect and that brand credibility requires.

**Independent Test**: Can be fully tested by toggling the theme control and verifying that all five dashboard sections, the navigation header, and footer correctly adopt the target theme colors without broken states.

**Acceptance Scenarios**:

1. **Given** the light theme is active, **When** a user views the dashboard, **Then** the surface colors are white/light-slate, the primary color is dark green, and text contrast passes accessibility standards.
2. **Given** the dark theme is active, **When** a user views the dashboard, **Then** the surface colors are deep slate, the primary color is bright emerald, and text contrast passes accessibility standards.
3. **Given** a user has selected dark mode, **When** they reload the page, **Then** their theme preference is preserved.

---

### User Story 3 - Per-Section Loading and Error States (Priority: P3)

Each dashboard section displays a skeleton loading state while its data is being fetched, and a clear error state if the fetch fails. Loading and error presentation is visually consistent across all sections using a shared component pattern, so users always know what state each section is in.

**Why this priority**: SSR with parallel async sections means some sections may arrive after others. Users need clear, consistent feedback for in-progress and failed states — this is also the architectural pattern that all future dashboard features will inherit.

**Independent Test**: Can be fully tested by simulating slow/failed data responses for individual sections and confirming each shows its skeleton state, then error state, without affecting other sections.

**Acceptance Scenarios**:

1. **Given** a section's data is still loading, **When** a user views the dashboard, **Then** the section renders a skeleton placeholder that matches the section's expected shape and occupies the same space as the loaded view.
2. **Given** a section's data fetch fails, **When** a user views the dashboard, **Then** the section renders a consistent error state with a retry affordance, without crashing or hiding other sections.
3. **Given** loading and error states across different sections, **When** comparing their visual presentation, **Then** the skeleton and error UI uses the same shared component pattern so they look consistent.

---

### User Story 4 - Calorie Focus Section (Priority: P2)

A user sees their daily calorie intake prominently — a large number showing calories consumed, a goal denominator, a circular progress ring showing percentage of goal reached, and two sub-metrics (calories burned and net balance). The section communicates metabolic state at a glance.

**Why this priority**: Calories is the primary metric in nutrition tracking. This is the largest bento cell (2/3 width) and the visual anchor of the dashboard.

**Independent Test**: Can be tested standalone by rendering the Calories section with mock daily summary data and verifying the circular progress ring, headline numbers, and sub-metric cards display correctly.

**Acceptance Scenarios**:

1. **Given** a user with logged meals, **When** they view the Calories section, **Then** they see consumed calories as a large prominent number, the daily goal as a denominator, a circular ring filled proportionally to goal percentage, and separate "Burned" and "Net Balance" values.
2. **Given** a user who has consumed 0 calories, **When** the Calories section loads, **Then** the ring is empty and all values show 0 without layout breakage.
3. **Given** a user who has exceeded their calorie goal, **When** the Calories section loads, **Then** the ring fills completely and the display reflects the over-goal state clearly.

---

### User Story 5 - Macronutrients Section (Priority: P2)

A user sees their protein, carbohydrate, and fat intake for the day as progress bars showing grams consumed versus their target. Each macro is visually distinguished by color.

**Why this priority**: Macros are the second most important nutritional metric after calories and are central to both professional and personal use cases.

**Independent Test**: Can be tested standalone by rendering the Macronutrients section with mock macro data and verifying each bar reflects the correct percentage of goal.

**Acceptance Scenarios**:

1. **Given** a user with logged meals, **When** they view the Macronutrients section, **Then** they see three progress bars — Protein, Carbohydrates, and Fats — each showing grams consumed and daily target.
2. **Given** a macro at 0% progress, **When** the Macronutrients section renders, **Then** the bar is empty but the label and target still display correctly.
3. **Given** a macro exceeding its target, **When** the section renders, **Then** the bar fills completely and the display makes the exceeded state visible.

---

### User Story 6 - Weekly Momentum Chart (Priority: P3)

A user sees a 7-day bar chart showing daily calorie adherence for the current week. The current day is visually highlighted. This gives a quick sense of the user's weekly pattern without navigating away.

**Why this priority**: Weekly context motivates continued engagement and is a key differentiator for the redesigned dashboard.

**Independent Test**: Can be tested by rendering the Weekly Momentum section with 7-day summary data and verifying each bar's proportional height, day labels, and current-day highlight.

**Acceptance Scenarios**:

1. **Given** a user viewing the dashboard mid-week, **When** the Weekly Momentum section loads, **Then** days with data show bars proportional to their value, and the current day is highlighted distinctly.
2. **Given** days with no data (future days or skipped days), **When** the chart renders, **Then** those columns appear empty or with a minimal indicator — no layout errors.

---

### User Story 7 - Daily Schedule Section (Priority: P3)

A user sees a timeline of the current day's logged meals and activities, organized into time-of-day groups (Morning, Midday, Evening), each with an icon, label, meal/activity name, time, and calorie count. A "View All" link navigates to the food log.

**Why this priority**: The schedule section contextualizes the day's data chronologically, bridging the dashboard summary view with detailed tracking.

**Independent Test**: Can be tested by rendering the Daily Schedule section with a set of logged entries and verifying time-group cards appear with correct content and the "View All" link points to the food log.

**Acceptance Scenarios**:

1. **Given** a user with meals and activities logged today, **When** the Daily Schedule section loads, **Then** entries are grouped by morning/midday/evening with correct icon, time, and calorie values.
2. **Given** no entries for a time group, **When** the section renders, **Then** that group is hidden or shows an empty state without breaking the layout.
3. **Given** the "View All" button, **When** clicked, **Then** the user navigates to the food log page.

---

### User Story 8 - Hydration Tracker (Priority: P3)

A user sees their daily water intake displayed as a large number in liters, a linear progress bar showing percentage toward their daily target, and a quick-add button to log an additional glass of water.

**Why this priority**: Hydration is a supporting wellness metric that rounds out the holistic view of the dashboard.

**Independent Test**: Can be tested by rendering the Hydration section with mock hydration data and verifying the liters value, progress bar percentage, and add-water button are present and correct.

**Acceptance Scenarios**:

1. **Given** a user who has logged water intake, **When** the Hydration section loads, **Then** they see liters consumed, a progress percentage toward their goal, and a visual progress bar.
2. **Given** a user who clicks the add-water button, **When** the action completes, **Then** the displayed water intake increases and the progress bar updates accordingly.

---

### Edge Cases

- What happens when all sections fail to load simultaneously (e.g., server error)?
- How does the bento grid handle very long food or activity names in the Daily Schedule section?
- What if a user has no goal set — does the Calories section show progress against zero?
- How does the circular progress ring behave when calorie intake exceeds the goal?
- What happens when the weekly chart has only one day of data vs. a full seven?
- How does the theme toggle behave when the user's OS preference changes while the session is active?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard page MUST render server-side, delivering a full HTML structure before JavaScript hydration.
- **FR-002**: Each dashboard section (Calories, Hydration, Macronutrients, Weekly Momentum, Daily Schedule) MUST load its own data asynchronously and independently, in parallel with all other sections.
- **FR-003**: Each dashboard section MUST display a loading skeleton state while data is being fetched, matching the section's expected visual shape.
- **FR-004**: Each dashboard section MUST display a consistent error state with a retry action if data fetching fails, without affecting other sections.
- **FR-005**: The loading skeleton and error states MUST use a shared component pattern so their presentation is consistent across all sections.
- **FR-006**: The dashboard MUST implement the bento grid layout: Calories (large, ~2/3 width), Hydration (small, ~1/3 width), Macronutrients (medium, ~5/12 width), Weekly Momentum (medium, ~7/12 width), and Daily Schedule (full width).
- **FR-007**: The dashboard MUST support both a light theme and a dark theme, with each section correctly adopting the active theme's color palette.
- **FR-008**: The Calories section MUST display: calories consumed (large headline), daily calorie goal, percentage consumed as a circular progress ring, calories burned, and net calorie balance.
- **FR-009**: The Macronutrients section MUST display protein, carbohydrates, and fat as individual progress bars showing consumed vs. goal values in grams, using the project's established macro color system.
- **FR-010**: The Weekly Momentum section MUST display a 7-day bar chart with the current day visually highlighted and day-of-week labels.
- **FR-011**: The Daily Schedule section MUST group logged meals and activities by time of day (Morning, Midday, Evening) with icon, time, name, and calorie/duration data, and provide a "View All" link to the food log.
- **FR-012**: The Hydration section MUST display water consumed in liters, a progress bar toward the daily goal, and a quick-add button.
- **FR-013**: The navigation header MUST be fixed at the top of the viewport with the brand mark, primary navigation links (Dashboard, Food Log, Meal Planner, Exercise Library, Goals), and notification/profile icon buttons.
- **FR-014**: The dashboard layout MUST be fully responsive — bento cells stack to a single column on mobile viewports.
- **FR-015**: Components created for this dashboard MUST be structured for reuse in future features (e.g., progress bar, stat card, skeleton loader, section error boundary).
- **FR-016**: The global CSS theme file MUST be updated to include all color tokens required by both light and dark design variants.
- **FR-017**: The dashboard MUST include a "Log Activity" primary action button in the header area.

### Key Entities

- **DailySummary**: Aggregated nutrition data for a specific date — total calories consumed, calorie goal, calories burned, net balance, and macro totals (protein g, carbs g, fat g) vs. goals.
- **HydrationLog**: Daily water intake record — total liters consumed and daily target in liters.
- **WeeklySnapshot**: Seven-day array of daily adherence scores or calorie totals used to render the momentum chart.
- **ScheduleEntry**: A single logged meal or activity — name, time, time-of-day group (morning/midday/evening), icon type, and calorie or duration value.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The dashboard page renders its initial HTML with navigation and section structure visible in under 1.5 seconds on a standard broadband connection.
- **SC-002**: Each dashboard section loads and displays its data independently — no single section's delay prevents other sections from appearing.
- **SC-003**: All five data sections render correctly in both light and dark modes with no visual regressions (missing colors, broken layout, or illegible text).
- **SC-004**: All five sections display appropriate skeleton and error states — a QA reviewer can trigger each state and confirm it is visually consistent with the shared loading/error component.
- **SC-005**: The dashboard layout is fully usable on viewports from 375px (mobile) to 2560px (large desktop) without horizontal scrolling or overlapping elements.
- **SC-006**: Accessibility contrast ratios meet WCAG AA standards for all text and interactive elements in both light and dark modes.
- **SC-007**: At least three reusable components (e.g., progress bar, stat card, section skeleton) are extractable and usable in future features without modification.
- **SC-008**: A user completing a full dashboard review (all five sections read and understood) can do so in under 30 seconds — the information hierarchy is clear and scannable.

## Assumptions

- The user is already authenticated; this feature does not change authentication flows.
- Calorie goal, macro goals, and hydration goal are already stored in the user's profile and accessible by existing server-side data layers.
- The food log page already exists and the Daily Schedule "View All" link will navigate to it.
- Meal Planner, Exercise Library, and Goals navigation links point to pages that do not yet exist — placeholder routes are acceptable for now.
- The quick-add water button increments by a standard 250ml (one glass) per tap.
- The Weekly Momentum chart shows calorie adherence (consumed vs. goal ratio) as the bar height metric.
- Theme toggling is handled by a class on the root HTML element (e.g., a `dark` class), consistent with the reference design files.
- The global CSS file contains the authoritative design token source of truth and will be updated as part of this feature.
