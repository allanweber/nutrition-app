# Vitalis Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-21

## Active Technologies
- TypeScript 5.x / Node.js 20 + Next.js 16 (App Router), TanStack Query, TanStack Form, shadcn/ui (Radix primitives), Drizzle ORM, BetterAuth, Playwright (E2E) (004-food-search-field)
- PostgreSQL (Drizzle ORM) for food data; browser `localStorage` for search history (device-local, no server storage) (004-food-search-field)
- TypeScript 5.x / Node.js 20 + Next.js 16 (App Router), TanStack Query v5, TanStack Form v0, shadcn/ui (Radix primitives), Drizzle ORM, BetterAuth, Playwright (004-food-search-field)
- TypeScript 5.x / Node.js 20 + Next.js 16.1.2 (App Router), React 19, Recharts 3.6, TanStack Query v5, next-themes 0.4.6, Drizzle ORM 0.45, shadcn/ui (Radix), Tailwind CSS 4 (005-dashboard-redesign)
- PostgreSQL (Drizzle ORM) — new `hydration_logs` table + migration (005-dashboard-redesign)

- TypeScript 5.x, Node.js 20 + Next.js 16 (App Router), Drizzle ORM, TanStack Query, (003-fatsecret-food-retrieval)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x, Node.js 20: Follow standard conventions

## Recent Changes
- 005-dashboard-redesign: Added TypeScript 5.x / Node.js 20 + Next.js 16.1.2 (App Router), React 19, Recharts 3.6, TanStack Query v5, next-themes 0.4.6, Drizzle ORM 0.45, shadcn/ui (Radix), Tailwind CSS 4
- 004-food-search-field: Added TypeScript 5.x / Node.js 20 + Next.js 16 (App Router), TanStack Query v5, TanStack Form v0, shadcn/ui (Radix primitives), Drizzle ORM, BetterAuth, Playwright
- 004-food-search-field: Added TypeScript 5.x / Node.js 20 + Next.js 16 (App Router), TanStack Query, TanStack Form, shadcn/ui (Radix primitives), Drizzle ORM, BetterAuth, Playwright (E2E)


<!-- MANUAL ADDITIONS START -->
## Feature 003: FatSecret Food Retrieval (active branch)

- FatSecret auth: OAuth 2.0 Client Credentials (token POST to `oauth.fatsecret.com/connect/token`, no extra packages)
- FatSecret client: `src/lib/fatsecret.ts` (replaces `src/lib/nutritionix.ts`)
- FatSecret types: `src/types/fatsecret.ts` (replaces `src/types/nutritionix.ts`)
- Orchestration service: `src/server/services/food-search.service.ts`
- New API routes: `GET /api/foods/search` (replaced), `GET /api/foods/detail` (new)
- Retired routes: `/api/foods/nutrients`, `/api/foods/upc` (no FatSecret equivalent)
- DB migration needed: add `medium` column to `food_photos` table
- Feature flag: `FATSECRET_ENABLED` env var (default: enabled)
- See `specs/003-fatsecret-food-retrieval/` for full plan, data-model, and contracts
## Food Log Data Model (redesign-food-log branch)

`foodLogItems` and `dietPlanMealItems` no longer store nutrition snapshots. All nutrition data is read via FK joins:

- `foodId uuid NOT NULL` → `foods.id` (`onDelete: cascade`) — log item cannot exist without a food
- `altMeasureId uuid nullable` → `food_alt_measures.id` (`onDelete: set null`) — display only (e.g. "2 cups"); null means quantity is raw grams
- `quantity` is always stored in **grams**
- Removed columns: `foodName`, `brandName`, `calories`, `protein`, `carbs`, `fat`, `fiber`, `sugar`, `sodium`, `servingQty`, `servingUnitSnapshot`, `servingWeightGrams`, `photoThumbSnapshot`, `servingUnit`

**Unified calculation everywhere**: `nutrient = (foods.nutrient / 100) * quantity_grams`

**POST `/api/food-logs`** now accepts `{ foodId: uuid, altMeasureId?: uuid, quantity: number, mealType, consumedAt }` — no more `foodName`/`servingUnit` strings.
<!-- MANUAL ADDITIONS END -->

## Design Context

### Users
**Primary: Nutrition professionals** — registered dietitians and nutritionists managing a client roster. They use this daily, professionally, and need an interface that projects authority and precision. They evaluate software like a doctor evaluates a tool: does it make me look credible, and does it surface the data I need fast?

**Secondary: Individuals** — health-motivated people tracking their own nutrition, often referred by a dietitian. Job: log food quickly, understand where they stand, stay motivated.

**Key insight**: Design for the professional first. The individual benefits from that elevation.

### Brand Personality
**Three words**: Authoritative. Precise. Forward.

Like a Bloomberg terminal reimagined by a health-obsessed designer. Data-dense but never cluttered. Numbers are prominent because numbers *are* the product. Tone is motivating without being cheerleader-y — confidence comes from visible progress and clear data, not exclamation points.

Emotional goal: Users should feel in control. Competent. Like the data is working for them.

### Aesthetic Direction
**Bold & data-forward.** Numbers and charts are not decorations on a layout — they *are* the layout. Strong typographic hierarchy. Whitespace is intentional and earned. Light mode primary.

**References**: Vercel dashboard, Linear, Raycast, Stripe's dashboard aesthetic.

**Anti-references — explicitly NOT**:
- **MyFitnessPal**: Dated, cluttered, no personality.
- **Generic SaaS**: Gradient heroes, glassmorphism, identical card grids, floating notification chips, highlighted primary-color keywords in headings. This is the AI slop pattern.
- **Fitness apps**: Aggressive neons, dark mode glowing rings, hyper-masculine energy, flame emoji as design element.
- **Medical/clinical**: Cold blues, sterile layouts, hospital-software feel.

### Design Principles
1. **Data is the UI.** Numbers, percentages, and progress are primary visual elements — not decorations inside containers.
2. **Authority through precision.** Exact values, tight alignment, tabular numbers. No decorative chrome.
3. **Hierarchy through scale, not decoration.** Size, weight, position communicate importance — not borders and card wrappers.
4. **Professional grade, personal friendly.** Pro dashboard is the flagship. Individual tracking is an on-ramp. Same elevated product, not two apps.
5. **Motion serves momentum.** Transitions feel like progress and state change — not animation for its own sake.

### Component System

**Design token source of truth**: `src/app/globals.css` — OKLch-based CSS variables for color, radius, and sidebar tokens.

**UI component library**: `src/components/ui/` — Shadcn/UI with CVA variants. Extend or compose; don't duplicate.

**Nutrition-specific constants** (`src/lib/nutrition-constants.ts`):
- `MEAL_TYPE_ORDER`, `MEAL_TYPE_LABELS`, `MEAL_TYPE_COLORS` — meal type ordering, labels, and badge classes
- `MACRO_COLORS` — Tailwind bg classes (protein: rose-500, carbs: amber-500, fat: sky-500)
- `MACRO_HEX_COLORS` — hex values for Recharts (same palette)

**Shared nutrition components**:
- `src/components/meal-type-label.tsx` — `<MealTypeLabel>` colored badge for meal types

**Rule**: macro and meal-type colors always come from `nutrition-constants.ts`. Never redeclare inline.
