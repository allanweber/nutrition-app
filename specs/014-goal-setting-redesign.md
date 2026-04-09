# 014 — Goal Setting Redesign

## Context

The goals page currently has a flat, generic form and a non-functional "Open Calculator" stub. The design files specify two complete UIs to build:

1. **Redesigned edit form** (`goal_edit.html`) — a sectioned scrollable form, data-forward, big number inputs, macro color indicators.
2. **Wizard modal** (`goal_wizard.html`) — 7-step card-style dialog that auto-calculates BMR/TDEE and fills in targets.

Wizard opens as a modal/dialog over the goals page (not a separate route). Post-wizard save redirects to `/dashboard`. Height is included in step 1 for accurate Mifflin-St Jeor BMR. Metric + imperial toggle in step 1; DB always stores kg/cm.

---

## Critical Files

| File | Change |
|------|--------|
| `src/app/(dashboard)/goals/page.tsx` | Add wizard open state, remove stub cards |
| `src/components/forms/goals-form.tsx` | Full visual redesign |
| `src/components/goal-wizard-modal.tsx` | **New** — full wizard dialog |
| `src/lib/form-validation.ts` | Add `hydration` field |
| `src/lib/api-validation.ts` | Add `hydration` + wizard snapshot fields |
| `src/app/api/goals/route.ts` | Persist wizard snapshot columns |

Types already exist in `src/types/goals.ts`. DB columns already exist in schema. No migration needed.

---

## Phase 1 — API / Validation Extensions

### `src/lib/form-validation.ts`

Add to `goalsFormSchema`:

```ts
hydration: z.coerce.number().min(0).max(10000),
```

### `src/lib/api-validation.ts`

Add to `nutritionGoalsSchema` (all wizard fields optional):

```ts
hydration: z.number().min(0).max(10000).optional(),
ageYears: z.number().int().min(1).max(120).optional().nullable(),
sex: z.enum(['male', 'female']).optional().nullable(),
heightCm: z.number().min(50).max(300).optional().nullable(),
weightKg: z.number().min(10).max(500).optional().nullable(),
activityMultiplier: z.number().optional().nullable(),
bmrCalories: z.number().optional().nullable(),
tdeeCalories: z.number().optional().nullable(),
wizardInputs: z.record(z.unknown()).optional().nullable(),
inputUnitSystem: z.enum(['metric', 'imperial']).optional().nullable(),
macroPresetId: z.string().optional().nullable(),
```

Update `transformNutritionGoalsForDB` to pass these snapshot fields through to the insert.

### `src/app/api/goals/route.ts`

In the PUT handler, extend the insert to include wizard snapshot fields from validated input (columns already exist on the `nutrition_goals` table).

---

## Phase 2 — Redesign `goals-form.tsx`

Matches `goal_edit.html` exactly. Page-level layout with a centered header and 4 `<section>` blocks. Each section is a 2-column grid on md+: **left** = icon + title + description prose, **right** = the actual inputs. No card wrappers — whitespace and dividers separate sections.

### Page header

```
[PERSONALIZATION pill badge — bg-primary/5 text-primary text-xs font-black uppercase tracking-widest rounded-full]
"Let's define your path."     ← text-4xl md:text-5xl font-headline font-extrabold tracking-tight
"Configure your daily targets..."  ← text-outline text-lg font-medium
```

### Section 1 — Lifestyle & Aim

- **Left**: `Target` icon in `w-12 h-12 bg-primary/10 rounded-2xl` • h2 "Lifestyle & Aim" • description prose
- **Right**: two `Select` fields (goalType, activityLevel)
  - Trigger styled: `rounded-2xl px-6 py-4 text-lg font-bold bg-white border-outline-variant/30 appearance-none`

### Section 2 — Energy & Vitality

- **Left**: `Droplets` icon in `bg-blue-500/10` box • h2 "Energy & Vitality"
- **Right**: two large inputs with `text-3xl font-black` value text
  - Calories — placeholder "2500", trailing unit `kcal` (absolute right-6)
  - Hydration (new field) — placeholder "3500", trailing unit `ml / day`
  - Input wrapper: `rounded-2xl px-6 py-5 bg-white border-outline-variant/30`

### Section 3 — Macronutrients

- **Left**: `UtensilsCrossed` icon in `bg-tertiary/10` box • h2 "Macronutrients"
- **Right**: 3 inputs (protein, carbs, fat) each with:
  - `text-2xl font-black` value text
  - **Colored left border** via inline style `{ borderLeftWidth: 8, borderLeftColor: MACRO_HEX_COLORS[macro] }`
  - Label row has `w-2 h-2 rounded-full` color dot before field name
  - Trailing unit `grams` (absolute right)
  - Colors: protein `#D54069`, carbs `#CC7A40`, fat `#408FBE` — sourced from `src/lib/nutrition-constants.ts`

### Section 4 — Micros & Refinement

- **Left**: `FlaskConical` icon in `bg-surface-container-high` box • h2 "Micros & Refinement"
- **Right**: 2-column grid — fiber (g) + sodium (mg) inputs with `text-xl font-black`

### Submit area

```
border-t border-outline-variant/20
centered: "Ready to start?" h3 + helper text
full-width max-w-sm button: bg-primary text-white py-5 rounded-2xl text-lg font-black shadow-2xl shadow-primary/30 hover:-translate-y-1
```

---

## Phase 3 — Create `goal-wizard-modal.tsx`

Uses shadcn `Dialog` — `max-w-lg` centered on desktop, full-screen on mobile. Inner container: `rounded-[2.5rem] shadow-2xl shadow-primary/10 overflow-hidden`.

### Progress bar (steps 1–5 only, hidden on 0 and 6)

```
[STEP X OF 5]  text-xs font-black uppercase tracking-widest text-primary     [← Back button]
[━━━━━━░░░░]   h-1.5 bg-surface-container-low; filled: bg-primary transition-all duration-500
```

### Step 0 — Splash

- Centered `w-24 h-24 bg-primary/10 rounded-3xl` with `Sparkles` icon `text-primary text-5xl`
- Headline `text-4xl md:text-5xl font-headline font-extrabold`
- Subtitle `text-xl text-outline font-medium`
- Button: `w-full bg-primary text-white py-6 rounded-2xl text-xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02]` → "Start My Journey"

### Step 1 — Personal Info

- Headline "Tell us a bit about yourself" `text-3xl font-headline font-extrabold`
- **Unit toggle** (top right): two small pill buttons `px-3 py-1 rounded-full text-xs font-black`; active = `bg-primary text-white`
- 2-col grid:
  - **Age**: `bg-surface-container-low border-none rounded-2xl px-6 py-4 text-xl font-bold` number input
  - **Gender**: two buttons `flex-1 py-4 border-2 rounded-2xl font-bold`; selected = `border-primary bg-primary/5`
- **Weight** (full width): label row + value `text-xl font-bold text-primary` (e.g. "75 kg") + range slider `h-2 accent-primary`
- **Height** (full width): same pattern as weight
- "Continue" button → step 2

### Step 2 — Main Goal

- Centered headline "What's your main goal?"
- 3 radio-card rows:
  - `border-2 border-outline-variant/30 rounded-[1.5rem] p-6 flex items-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all`
  - Icon box `w-14 h-14 bg-primary/10 rounded-2xl`; hover/selected → `bg-primary text-white`
  - Selected state: `border-primary bg-primary/5`
  - Options: Lose weight (`Target`), Maintain weight (`Scale`), Gain muscle (`Dumbbell`)
- "Next" button → step 3

### Step 3 — Activity Level

- 5 button-card rows (same card style as step 2)
- Icon in `w-12 h-12 rounded-xl bg-surface-container-low`; selected icon box → `bg-primary/20`
- Icons (Lucide): Sedentary (`Armchair`), Lightly Active (`Footprints`), Moderately Active (`Zap`), Very Active (`Flame`), Extra Active (`Trophy`)
- "Almost there!" button → step 4

### Step 4 — Preferences

- Headline "Any personal preferences?"
- **2×2 grid** of macro preset tiles: High Protein, Balanced, Low Carb, Keto
  - `p-5 border-2 rounded-2xl font-bold text-sm`; selected = `border-primary bg-primary/5`
- Divider + two toggle rows (UI only, no DB field yet):
  - "Vegetarian / Vegan" + visual toggle switch
  - "Low Sodium focus" + visual toggle switch
- Two buttons: "Skip" (outline) → step 5 | "Review Plan" (primary) → step 5

### Step 5 — Review Summary

- Headline "Ready for your results?"
- Summary card `bg-surface-container-low rounded-[2rem] p-8 space-y-5`:
  - 4 rows, each: icon `text-primary/60` + label `text-outline font-medium` | right value `font-black uppercase tracking-wider`
  - Goal (value in `text-primary`), Activity, Details (age + weight), Preference
- "Calculate my plan" button → triggers BMR/TDEE calculation, advances to step 6

### Step 6 — Results

- Badge: `bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest`
- Headline "Your Custom Daily Plan"
- **Calorie hero block**: `bg-primary/5 border border-primary/10 rounded-[3rem] p-12 text-center relative overflow-hidden`
  - Label: `text-xs font-black uppercase tracking-[0.25em] text-primary/70`
  - Number: `text-8xl font-headline font-black tracking-tighter` + `text-2xl font-black text-outline` "kcal"
  - Strategy pill: `bg-white px-6 py-2 rounded-full shadow-sm border border-primary/5`
- **Macro Distribution** — 3-col grid (`.macro-card p-5 rounded-2xl bg-white border border-outline-variant/30`):
  - Percentage circle: `w-12 h-12 rounded-full border-4` in macro color/20
  - Label `text-xs font-black uppercase tracking-widest text-outline`
  - Grams `text-3xl font-black`
  - Colors from `MACRO_HEX_COLORS`
- **Info tiles** (2-col grid, `bg-surface-container-low rounded-3xl p-6`):
  - Hydration: blue icon box + `text-2xl font-black` liters + description
  - Fiber: emerald icon box + `text-2xl font-black` grams + description
- **CTAs**:
  - "Start Tracking My Plan" — full-width primary → saves + redirects to `/dashboard`
  - Row: "Refine My Plan" (→ step 4) + "Start Over" (→ step 0) — both `border-2 border-outline-variant/30 rounded-2xl`

### BMR/TDEE Calculation

Triggered on "Calculate my plan" (step 5 → 6). Pure client-side.

```ts
// Mifflin-St Jeor (always compute in metric kg/cm)
const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);

const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, extra_active: 1.9 };
const tdee = bmr * multipliers[activityLevel];

const adjustment = { weight_loss: -500, maintenance: 0, muscle_gain: +250 };
const targetCalories = Math.round(tdee + adjustment[goalType]);

const presets = {
  balanced:     { p: 0.30, c: 0.40, f: 0.30 },
  high_protein: { p: 0.40, c: 0.35, f: 0.25 },
  low_carb:     { p: 0.35, c: 0.25, f: 0.40 },
  keto:         { p: 0.25, c: 0.05, f: 0.70 },
};
const protein = Math.round((targetCalories * preset.p) / 4);
const carbs   = Math.round((targetCalories * preset.c) / 4);
const fat     = Math.round((targetCalories * preset.f) / 9);
```

Imperial inputs are display-only conversions (lbs ↔ kg, ft/in ↔ cm). DB always stores kg/cm.

---

## Phase 4 — Wire up `goals/page.tsx`

```tsx
const [wizardOpen, setWizardOpen] = useState(false);

// Replace Goal Calculator card body:
<Button onClick={() => setWizardOpen(true)}>Open Calculator</Button>
<GoalWizardModal open={wizardOpen} onClose={() => setWizardOpen(false)} />
```

Remove the "Tips" card (not present in the design).

---

## Verification

1. `npm test && npm run lint` — no regressions
2. `/goals` loads redesigned sectioned form: big inputs, macro color left-borders, hydration field visible
3. Save form → `PUT /api/goals` succeeds, hydration + all targets persist
4. "Open Calculator" → wizard dialog opens on splash step
5. Walk all 7 steps; step 6 shows calculated kcal/macros matching BMR formula above
6. "Start Tracking My Plan" → saves to DB with wizard snapshot fields, redirects to `/dashboard`
7. Return to `/goals` → all fields reflect wizard-calculated values
8. Imperial toggle: sliders/inputs show lbs and ft/in; DB stores kg/cm after save
