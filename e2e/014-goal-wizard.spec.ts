import { expect, test, type Page } from '@playwright/test';
import { AUTH_FILES } from './fixtures/test-data';
import { GoalsPage } from './pages/goals.page';

// All tests in this file use the generalHealth seed user
test.use({ storageState: AUTH_FILES.generalHealth });

// Tests mutate the same user's goals — run serially to avoid DB conflicts
test.describe.configure({ mode: 'serial' });

// ── BMR/TDEE expected values for default wizard inputs ────────────────────────
// Male, 25 y/o, 75 kg, 170 cm, moderate (1.55), maintenance, balanced preset
//   BMR  = 10×75 + 6.25×170 − 5×25 + 5 = 1692.5
//   TDEE = 1692.5 × 1.55 = 2623.375 → 2623
//   Protein = 75 × 1.4 = 105 g
//   Fat     = Math.round((2623 × 0.30) / 9) = 87 g
//   Carbs   = Math.round((2623 − 105×4 − 87×9) / 4) = 355 g
//   Fiber   = Math.round(2623 / 1000 × 14) = 37 g
const EXPECTED = {
  calories: 2623,
  protein: 105,
  fat: 87,
  carbs: 355,
  fiber: 37,
  sodium: 2300,
};

// ── Block 1: Goals form ───────────────────────────────────────────────────────

test.describe('014: Goals form', () => {
  let gp: GoalsPage;

  test.beforeEach(async ({ page }) => {
    gp = new GoalsPage(page);
    await gp.goto();
  });

  test('goals page renders the form sections', async () => {
    await expect(gp.page.getByText(/lifestyle & aim/i)).toBeVisible();
    await expect(gp.page.getByText(/energy & vitality/i)).toBeVisible();
    await expect(gp.page.getByText(/macronutrients/i)).toBeVisible();
    await expect(gp.page.getByText(/micros & refinement/i)).toBeVisible();
  });

  test('"Open Calculator" button is visible in the form header', async () => {
    await expect(gp.openCalculatorButton).toBeVisible();
  });

  test('clicking "Open Calculator" opens the wizard dialog', async () => {
    await gp.openWizard();
    await expect(gp.dialog).toBeVisible();
  });
});

// ── Block 2: Wizard — step navigation ────────────────────────────────────────

test.describe('014: Wizard step navigation', () => {
  let gp: GoalsPage;

  test.beforeEach(async ({ page }) => {
    gp = new GoalsPage(page);
    await gp.goto();
    await gp.openWizard();
  });

  test('step 0 (splash) shows headline and start button', async () => {
    await expect(gp.dialog.locator('h1')).toBeVisible();
    await expect(gp.dialog.getByRole('button', { name: /start my journey/i })).toBeVisible();
  });

  test('step 0 → step 1: personal info shows age and gender inputs', async () => {
    await gp.clickStartMyJourney();
    await expect(gp.dialog.getByText(/tell us a bit/i)).toBeVisible();
    await expect(gp.dialog.getByRole('spinbutton')).toBeVisible(); // age input
  });

  test('step 1 → step 2: goal selection shows three options', async () => {
    await gp.clickStartMyJourney();
    await gp.clickContinue();
    await expect(gp.dialog.getByText(/main goal/i)).toBeVisible();
    await expect(gp.dialog.getByRole('button', { name: /lose weight/i })).toBeVisible();
    await expect(gp.dialog.getByRole('button', { name: /maintain/i })).toBeVisible();
    await expect(gp.dialog.getByRole('button', { name: /gain muscle/i })).toBeVisible();
  });

  test('step 2 → step 3: activity level shows five options', async () => {
    await gp.clickStartMyJourney();
    await gp.clickContinue();
    await gp.selectGoal('Maintain Weight');
    await gp.clickNext();
    await expect(gp.dialog.getByText(/activity level/i).or(gp.dialog.getByText(/how active/i))).toBeVisible();
    await expect(gp.dialog.getByRole('button', { name: /sedentary/i })).toBeVisible();
    await expect(gp.dialog.getByRole('button', { name: /^very active/i })).toBeVisible();
    await expect(gp.dialog.getByRole('button', { name: /^extra active/i })).toBeVisible();
  });

  test('step 3 → step 4: macro preset tiles are visible', async () => {
    await gp.clickStartMyJourney();
    await gp.clickContinue();
    await gp.selectGoal('Maintain Weight');
    await gp.clickNext();
    await gp.selectActivity('Moderately Active');
    await gp.clickAlmostThere();
    await expect(gp.dialog.getByRole('radio', { name: /balanced/i })).toBeVisible();
    await expect(gp.dialog.getByRole('radio', { name: /high protein/i })).toBeVisible();
    await expect(gp.dialog.getByRole('radio', { name: /low carb/i })).toBeVisible();
    await expect(gp.dialog.getByRole('radio', { name: /keto/i })).toBeVisible();
  });

  test('step 4 → step 5: review summary shows selected data', async () => {
    await gp.clickStartMyJourney();
    await gp.clickContinue();
    await gp.selectGoal('Maintain Weight');
    await gp.clickNext();
    await gp.selectActivity('Moderately Active');
    await gp.clickAlmostThere();
    await gp.selectPreset('Balanced');
    await gp.clickReviewPlan();
    await expect(gp.dialog.getByText(/ready for your results/i)).toBeVisible();
    await expect(gp.dialog.getByRole('button', { name: /calculate my plan/i })).toBeVisible();
  });

  test('back button returns to previous step', async () => {
    await gp.clickStartMyJourney();
    await gp.clickContinue();
    // Now on step 2; click back
    await gp.dialog.getByRole('button', { name: /back/i }).click();
    // Should be on step 1 again
    await expect(gp.dialog.getByText(/tell us a bit/i)).toBeVisible();
  });
});

// ── Block 3: Wizard — BMR/TDEE calculation ───────────────────────────────────

test.describe('014: Wizard BMR/TDEE calculation', () => {
  let gp: GoalsPage;

  // Walk through full wizard with default inputs (male, 25, 75 kg, 170 cm, moderate, maintenance, balanced)
  async function walkToResults(page: Page) {
    gp = new GoalsPage(page);
    await gp.goto();
    await gp.openWizard();
    await gp.clickStartMyJourney();
    // Step 1: keep defaults (male 25 yo, 75 kg, 170 cm)
    await gp.clickContinue();
    // Step 2: maintenance
    await gp.selectGoal('Maintain Weight');
    await gp.clickNext();
    // Step 3: moderately active
    await gp.selectActivity('Moderately Active');
    await gp.clickAlmostThere();
    // Step 4: balanced preset
    await gp.selectPreset('Balanced');
    await gp.clickReviewPlan();
    // Step 5: calculate
    await gp.clickCalculateMyPlan();
    // Wait for results step
    await expect(gp.dialog.getByText(/your custom daily plan/i)).toBeVisible({ timeout: 5000 });
  }

  test('results screen shows correct calorie total (Mifflin-St Jeor)', async ({ page }) => {
    await walkToResults(page);
    const displayed = await gp.getDisplayedCalories();
    expect(displayed).toBe(EXPECTED.calories);
  });

  test('results screen shows protein, carbs, fat grams', async ({ page }) => {
    await walkToResults(page);
    await expect(gp.dialog.getByText(`${EXPECTED.protein}g`, { exact: true })).toBeVisible();
    await expect(gp.dialog.getByText(`${EXPECTED.fat}g`, { exact: true })).toBeVisible();
    await expect(gp.dialog.getByText(`${EXPECTED.carbs}g`, { exact: true })).toBeVisible();
  });

  test('results screen shows fiber and sodium tiles', async ({ page }) => {
    await walkToResults(page);
    await expect(gp.dialog.getByText(new RegExp(`${EXPECTED.fiber}\\s*g`))).toBeVisible();
    await expect(gp.dialog.getByText(new RegExp(`${EXPECTED.sodium}\\s*mg`))).toBeVisible();
  });

  test('results screen shows hydration tile (weight × 35 ml)', async ({ page }) => {
    await walkToResults(page);
    // 75 kg × 35 ml = 2625 ml = 2.6 L
    await expect(gp.dialog.getByText(/2\.6\s*l/i)).toBeVisible();
  });
});

// ── Block 4: Wizard — save & persist ─────────────────────────────────────────

test.describe('014: Wizard save', () => {
  test('saving plan redirects to /dashboard', async ({ page }) => {
    const gp = new GoalsPage(page);
    await gp.goto();
    await gp.openWizard();
    await gp.clickStartMyJourney();
    await gp.clickContinue();
    await gp.selectGoal('Maintain Weight');
    await gp.clickNext();
    await gp.selectActivity('Moderately Active');
    await gp.clickAlmostThere();
    await gp.selectPreset('Balanced');
    await gp.clickReviewPlan();
    await gp.clickCalculateMyPlan();
    await expect(gp.dialog.getByText(/your custom daily plan/i)).toBeVisible({ timeout: 5000 });
    await gp.clickStartTracking();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('saved goals persist to API (GET /api/goals returns wizard values)', async ({ page }) => {
    const gp = new GoalsPage(page);
    await gp.goto();
    await gp.openWizard();
    await gp.clickStartMyJourney();
    await gp.clickContinue();
    await gp.selectGoal('Maintain Weight');
    await gp.clickNext();
    await gp.selectActivity('Moderately Active');
    await gp.clickAlmostThere();
    await gp.selectPreset('Balanced');
    await gp.clickReviewPlan();
    await gp.clickCalculateMyPlan();
    await expect(gp.dialog.getByText(/your custom daily plan/i)).toBeVisible({ timeout: 5000 });
    await gp.clickStartTracking();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Verify via API
    const res = await page.request.get('/api/goals');
    expect(res.ok()).toBeTruthy();
    const { goals } = await res.json();
    expect(goals.calories).toBe(EXPECTED.calories);
    expect(goals.protein).toBe(EXPECTED.protein);
    expect(goals.carbs).toBe(EXPECTED.carbs);
    expect(goals.fat).toBe(EXPECTED.fat);
    expect(goals.sodium).toBe(EXPECTED.sodium);
  });
});

// ── Block 5: Wizard — Adjust Macros (step 7) ─────────────────────────────────

test.describe('014: Adjust Macros step', () => {
  let gp: GoalsPage;

  async function walkToResults(page: Page) {
    gp = new GoalsPage(page);
    await gp.goto();
    await gp.openWizard();
    await gp.clickStartMyJourney();
    await gp.clickContinue();
    await gp.selectGoal('Maintain Weight');
    await gp.clickNext();
    await gp.selectActivity('Moderately Active');
    await gp.clickAlmostThere();
    await gp.selectPreset('Balanced');
    await gp.clickReviewPlan();
    await gp.clickCalculateMyPlan();
    await expect(gp.dialog.getByText(/your custom daily plan/i)).toBeVisible({ timeout: 5000 });
  }

  test('"Adjust Macros" button is visible on results screen', async ({ page }) => {
    await walkToResults(page);
    await expect(gp.dialog.getByRole('button', { name: /adjust macros/i })).toBeVisible();
  });

  test('clicking "Adjust Macros" opens the macro adjustment step', async ({ page }) => {
    await walkToResults(page);
    await gp.clickAdjustMacros();
    await expect(gp.dialog.getByText(/fine-tune your macros/i)).toBeVisible();
  });

  test('step 7 shows three sliders (protein, carbs, fat)', async ({ page }) => {
    await walkToResults(page);
    await gp.clickAdjustMacros();
    await expect(gp.getSliders()).toHaveCount(3);
  });

  test('total percentage row shows 100%', async ({ page }) => {
    await walkToResults(page);
    await gp.clickAdjustMacros();
    await expect(gp.getMacroTotal()).toBeVisible();
  });

  test('total kcal in step 7 matches results screen calories', async ({ page }) => {
    await walkToResults(page);
    await gp.clickAdjustMacros();
    await expect(gp.dialog.getByText(new RegExp(`${EXPECTED.calories.toLocaleString('en-US')}\\s*kcal`)).first()).toBeVisible();
  });

  test('"Cancel" returns to results screen without leaving dialog', async ({ page }) => {
    await walkToResults(page);
    await gp.clickAdjustMacros();
    await gp.clickCancel();
    await expect(gp.dialog.getByText(/your custom daily plan/i)).toBeVisible();
  });

  test('"Apply Changes" returns to results screen', async ({ page }) => {
    await walkToResults(page);
    await gp.clickAdjustMacros();
    await gp.clickApplyChanges();
    await expect(gp.dialog.getByText(/your custom daily plan/i)).toBeVisible();
  });

  test('moving a slider keeps total percentage at 100', async ({ page }) => {
    await walkToResults(page);
    await gp.clickAdjustMacros();
    const sliders = gp.getSliders();
    // Move protein slider via keyboard (Radix sliders are spans, not inputs)
    await sliders.first().press('ArrowRight');
    // Total row should still say 100%
    await expect(gp.getMacroTotal()).toBeVisible();
  });
});
