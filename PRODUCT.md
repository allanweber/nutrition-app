# Vitalis — Design Context

## Design Context

### Users

**Primary: Nutrition professionals** — registered dietitians and nutritionists managing a roster of clients. They use this tool professionally, every workday. They need an interface that projects authority and precision to their clients as much as it serves their own workflow. They're evaluating software the way a doctor evaluates a tool: does it make me look credible, and does it give me the data I need fast?

**Secondary: Individuals** — health-motivated people tracking their own nutrition. They arrive via self-service, often referred by a dietitian or from organic search. They need the same power without feeling like they're using professional-grade software by accident. Their primary job: log food quickly, understand where they stand, stay motivated to continue.

**Key insight**: The professional is the real user. Design for their standards first — the individual benefits from that elevation, not the other way around.

### Brand Personality

**Three words**: Authoritative. Precise. Forward.

Like a Bloomberg terminal reimagined by a health-obsessed designer. Data-dense but never cluttered. Numbers are given prominence because numbers *are* the product. The tone is motivating without being cheerleader-y — the confidence comes from visible progress and clear data, not from exclamation points or emoji.

Emotional goal: Users should feel in control. Competent. Like the data is working for them.

### Aesthetic Direction

**Bold & data-forward.** Numbers and charts are not decorations on a layout — they *are* the layout. Hierarchy is communicated through scale, weight, and position, not through card borders and background colors.

**References that capture the right feel**: Vercel dashboard, Linear, Raycast, Stripe's new dashboard aesthetic. Strong typographic hierarchy. Whitespace is intentional and earned, not leftover. Asymmetric compositions. Light mode as primary (dark mode supported but not the hero).

**Anti-references — explicitly NOT**:
- **MyFitnessPal**: Dated, cluttered, no personality, pure utility. The bar is higher.
- **Generic SaaS**: Gradient hero sections, glassmorphism, identical card grids, floating notification chips, "Everything you need to succeed" headings, highlighted keywords in primary color. This is the AI slop pattern — avoid entirely.
- **Fitness apps**: Aggressive neons, dark mode with glowing progress rings, hyper-masculine energy, flame emojis as design elements.
- **Medical/clinical**: Cold blues, sterile white layouts, hospital-software density, accessibility-driven ugliness.

### Design Principles

1. **Data is the UI.** Numbers, percentages, and progress are the primary visual elements — not containers for them. When you have a 1,560 calorie count, that number should command the space it deserves, not be nested inside three cards.

2. **Authority through precision.** Exact values, tight alignment, tabular numbers. No softening, no rounding, no decorative chrome that dilutes confidence. Professionals trust tools that look like they were designed by someone who takes accuracy seriously.

3. **Hierarchy through scale, not decoration.** Size, weight, and position communicate importance. A second background color, a border, or a card wrapper should only appear when truly needed — not as the default container for everything.

4. **Professional grade, personal friendly.** The pro dashboard is the flagship product. Individual tracking is an on-ramp. Both should feel like the same product — elevated — not two different apps sharing a color.

5. **Motion serves momentum.** Transitions should feel like progress and state change, not animation for its own sake. Numbers counting up, progress bars filling — these reinforce the product's core promise. Entrance animations should be fast and purposeful.

### Accessibility

**Target**: WCAG 2.1 AA for all new UI work.

- Sufficient color contrast (4.5:1 for body text, 3:1 for large text and UI components)
- Full keyboard navigation and visible focus indicators
- Screen reader support via semantic HTML and ARIA where needed
- `prefers-reduced-motion` already handled globally in `globals.css` — respect it in all custom animations
- Color is never the sole means of conveying information (pair with text or shape)

### Component System

**Design token source of truth**: `src/app/globals.css` — OKLch-based CSS variables for color, radius, and sidebar tokens. All semantic colors reference `var(--token-name)`.

**UI component library**: `src/components/ui/` — Shadcn/UI components with CVA-based variants. Do not duplicate what's here; extend or compose instead.

**Nutrition-specific constants** (`src/lib/nutrition-constants.ts`):
- `MEAL_TYPE_ORDER` — canonical ordering: breakfast → morning snack → lunch → afternoon snack → dinner → evening snack → pre-workout → post-workout → snack → other
- `MEAL_TYPE_LABELS` — display strings for meal types
- `MEAL_TYPE_COLORS` — Tailwind badge classes per meal type (amber/sky/violet/emerald)
- `MACRO_COLORS` — Tailwind bg classes for progress bars (protein: rose-500, carbs: amber-500, fat: sky-500)
- `MACRO_HEX_COLORS` — hex values for Recharts charts (same palette, for inline styles)

**Shared nutrition components**:
- `src/components/meal-type-label.tsx` — `<MealTypeLabel mealType="breakfast" />` colored badge; use wherever a meal type needs visual labeling
- `src/components/macro-fill-track.tsx` — `<MacroFillTrack />` horizontal fill (scaleX); use with `MACRO_COLORS` / `MACRO_CELL_FILL` for fills; `ProgressBar` composes it for dashboard macro rows

**Consistency rule**: macro and meal-type colors must always come from `nutrition-constants.ts`. Never re-declare them inline.

- `MACRO_CELL_BG`, `MACRO_CELL_TEXT`, `MACRO_CELL_FILL` — tinted macro surfaces and labels for tables and forms
- **Removed**: `MACRO_CELL_BORDER` — do not reintroduce colored **left** or **right** border stripes (>1px) on cards, list rows, macro inputs, or callouts (Impeccable absolute ban; reads as generic admin UI). Use full borders, background tints, typographic weight, or top/bottom emphasis if a second cue is needed.

---

## Impeccable guardrails (implementation)

These rules align the codebase with the Impeccable skill’s **anti–AI-slop** list and absolute bans. When in doubt, prefer fewer decorative containers and stronger typography and numbers.

### Banned CSS patterns

- **No gradient text**: never combine `background-clip: text` / `-webkit-background-clip: text` with a gradient fill for typography.
- **No side-stripe accents on cards or lists**: avoid `border-left` / `border-right` wider than **1px** as a colored accent on cards, list items, alerts, or macro fields. Use tint blocks, full borders, pills, or data emphasis instead.
- **Avoid the cliché palette**: no cyan-on-dark dashboards, purple–blue hero gradients, or neon glow accents as the primary brand move.

### Tokens: Nutrition Pulse

The desktop **Nutrition Pulse** panel uses dedicated variables in `src/app/globals.css` (not raw hex in the component):

| Token | Role |
| --- | --- |
| `--nutrition-pulse-surface` | Panel background (light: green tint; dark: `secondary`) |
| `--nutrition-pulse-ink` | Primary text on the panel |
| `--nutrition-pulse-ink-muted` / `--nutrition-pulse-ink-faint` | Secondary labels |
| `--nutrition-pulse-track` / `--nutrition-pulse-fill` | SVG ring track and progress |
| `--nutrition-pulse-decoration` | Decorative blob behind content |

Overflow / over-goal ring stroke uses **`var(--destructive)`**. When changing Pulse appearance, edit these variables first.

### Motion

- Prefer **transform** and **opacity** for UI motion; avoid animating layout properties when alternatives exist (e.g. macro fill bars use **`scaleX`** from `origin-left`, not animated `width`).
- Respect **`prefers-reduced-motion`** (global rules in `globals.css`); do not add transitions that fight those overrides.

### Accessibility patterns for non-text charts

- Decorative SVG rings: `aria-hidden` on the `<svg>`; parent **`role="img"`** with a concise **`aria-label`** summarizing values (consumed, goal, remaining, percent). Hide redundant numeric overlays inside that region with **`aria-hidden`** so screen readers are not doubled.

### Touch targets

- Aim for at least **~44×44px** hit areas on primary and destructive icon actions on touch layouts (food log, favorites, dish group actions). Use `min-h-11 min-w-11` or `size-10` patterns where shadcn `size="icon"` is too small.

### Typography note (known stack)

- Product UI uses **Manrope** (headlines) + **Inter** (body) via `src/app/layout.tsx`. Impeccable’s font procedure discourages Inter on *greenfield* work; changing body font is a deliberate branding decision and should be planned holistically (metrics, licensing, Tailwind `--font-sans`), not swapped in isolation.
