# Design System Strategy: The Vitality Edit

## 1. Overview & Creative North Star: "The Living Archive"

This design system moves away from the sterile, clinical feel of traditional health apps. Our Creative North Star is **"The Living Archive"**—an editorial-inspired digital space that treats health data with the prestige of a high-end wellness publication.

We break the "standard app" template by utilizing **intentional asymmetry** and **tonal depth**. Rather than rigid, boxed-in grids, we use expansive breathing room and overlapping elements to create a sense of organic growth. The experience should feel like flipping through a premium physical journal: tactile, authoritative, yet deeply personal. By prioritizing white space and sophisticated layering, we ensure that data-heavy analytics feel like insights, not chores.

---

## 2. Colors: Tonal Depth over Borders

The palette is rooted in `primary` (#206223), a deep "Health Green" that signals authority and vitality, balanced by a sophisticated range of neutral surfaces.

### The "No-Line" Rule

**Explicit Instruction:** 1px solid borders are prohibited for sectioning. Structural boundaries must be defined exclusively through background color shifts. For example, a `surface-container-low` (#f2f4f5) section should sit directly on a `surface` (#f8fafb) background. This creates a "soft edge" that feels modern and premium.

### Surface Hierarchy & Nesting

Treat the UI as a series of stacked, semi-translucent sheets.

- **Base Layer:** `surface` (#f8fafb)

- **Secondary Sectioning:** `surface-container-low` (#f2f4f5)

- **Interactive Cards:** `surface-container-lowest` (#ffffff)

- **Elevated Overlays:** `surface-bright` (#f8fafb) with 80% opacity and a 20px backdrop blur.

### The Glass & Gradient Rule

To avoid a "flat" interface, use Glassmorphism for floating navigation bars or action sheets. Use semi-transparent versions of `surface-container` with a `backdrop-filter: blur(16px)`.

**Signature Texture:** Main CTAs should utilize a subtle linear gradient from `primary` (#206223) to `primary_container` (#3a7b3a) at a 135-degree angle. This adds a "jewel-toned" depth that feels high-end.

---

## 3. Typography: Editorial Authority

We utilize a dual-typeface system to balance "Vitality" with "Functionality."

- **Display & Headlines (Manrope):** Chosen for its geometric modernism. Use `display-lg` (3.5rem) and `headline-md` (1.75rem) to create a clear editorial hierarchy. These should feel like magazine headers—bold, confident, and spacious.

- **Body & Labels (Inter):** The workhorse. Inter provides maximum legibility for dense nutritional data. Use `body-md` (0.875rem) for meal descriptions and `label-sm` (0.6875rem) for micro-data like macronutrient percentages.

**Hierarchy Note:** Always pair a `headline-sm` in `on_surface` (#191c1d) with a `label-md` in `on_tertiary_fixed_variant` (#7f2448) for category tags to create a sophisticated color contrast that guides the eye.

---

## 4. Elevation & Depth: The Layering Principle

Hierarchy is achieved through **Tonal Layering** rather than structural shadows.

- **Natural Lift:** Place a `surface-container-lowest` card on a `surface-container-low` background. This creates a perceived 2dp lift without a single drop shadow.

- **Ambient Shadows:** When an element must float (e.g., a FAB or a modal), use a shadow with a 32px blur, 0px spread, and 4% opacity of the `on-surface` color. It should feel like a soft glow of light, not a dark smudge.

- **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., in high-contrast modes), use the `outline_variant` (#bfcaba) at 15% opacity. Never use 100% opaque lines.

- **Glassmorphism:** Use `surface_variant` at 60% opacity with a blur for top navigation bars to allow the "vitality" of the content to bleed through as the user scrolls.

---

## 5. Components: Precision & Accessibility

### Buttons & Chips

- **Primary Button:** Uses the signature gradient (`primary` to `primary_container`). Shape: `md` (0.75rem) rounding.

- **Action Chips:** Use `secondary_container` (#cfe6f2) with `on_secondary_container` (#526772) text. These should be `full` (9999px) rounded for a soft, touchable feel.

### Lists & Meal Logs

- **The "No-Divider" Rule:** Forbid 1px dividers. Separate list items using `8` (1.75rem) of vertical spacing or alternating subtle background tints between `surface` and `surface_container_low`.

- **Data Visualization:** Use `tertiary` (#923357) for "Warning" or "Off-track" metrics, providing a sophisticated contrast to the health green.

### Cards

- **Nutrition Cards:** Use `surface_container_lowest` (#ffffff) with a `xl` (1.5rem) corner radius. This large radius creates an approachable, organic feel.

- **Analytics Hero:** Use a `primary_fixed` (#acf4a4) background with `on_primary_fixed` (#002203) text for high-impact weekly summaries.

### Input Fields

- **Modern Inputs:** No bottom line or full border. Use a `surface_container_highest` (#e1e3e4) background fill with `sm` (0.25rem) rounding. The label should live in the `label-md` style, 0.4rem above the field.

---

## 6. Do's and Don'ts

### Do

- **Do** use white space as a structural element. If a view feels cluttered, increase the spacing from `10` (2.25rem) to `12` (2.75rem).

- **Do** use `primary_fixed_dim` for "soft" buttons that shouldn't compete with the main CTA.

- **Do** ensure all data visualizations (charts/graphs) use the `roundedness-sm` scale for bar ends and line joins to maintain the "gentle" brand persona.

### Don't

- **Don't** use pure black (#000000) for text. Use `on_surface` (#191c1d) to maintain a soft, premium feel.

- **Don't** use "Card-in-Card" layouts with shadows. If you need to nest content, use a background color shift (e.g., a `surface_container` element inside a `surface_container_low` parent).

- **Don't** use standard system fonts. Stick strictly to the Manrope/Inter pairing to maintain the editorial "Vitality Edit" identity.
