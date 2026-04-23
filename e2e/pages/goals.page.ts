import { type Page, type Locator } from '@playwright/test';

export class GoalsPage {
  readonly page: Page;

  // Goals form
  readonly openCalculatorButton: Locator;
  readonly caloriesInput: Locator;
  readonly proteinInput: Locator;
  readonly carbsInput: Locator;
  readonly fatInput: Locator;
  readonly fiberInput: Locator;
  readonly sodiumInput: Locator;
  readonly saveButton: Locator;

  // Wizard dialog
  readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.openCalculatorButton = page.getByRole('button', { name: /open calculator/i });
    this.caloriesInput = page.getByPlaceholder('2500');
    this.proteinInput = page.getByPlaceholder('150');
    this.carbsInput = page.getByPlaceholder('250');
    this.fatInput = page.getByPlaceholder('65');
    this.fiberInput = page.getByPlaceholder('30');
    this.sodiumInput = page.getByPlaceholder('2300');
    this.saveButton = page.getByRole('button', { name: /save goals/i });
    this.dialog = page.getByRole('dialog');
  }

  async goto() {
    await this.page.goto('/goals');
    await this.page.waitForLoadState('networkidle');
  }

  // ── Wizard navigation helpers ─────────────────────────────────────────────

  async openWizard() {
    await this.openCalculatorButton.click();
    await this.dialog.waitFor({ state: 'visible' });
  }

  async clickStartMyJourney() {
    await this.dialog.getByRole('button', { name: /start my journey/i }).click();
  }

  async clickContinue() {
    await this.dialog.getByRole('button', { name: /continue/i }).click();
  }

  async clickNext() {
    await this.dialog.getByRole('button', { name: /next/i }).click();
  }

  async clickAlmostThere() {
    await this.dialog.getByRole('button', { name: /almost there/i }).click();
  }

  async clickReviewPlan() {
    await this.dialog.getByRole('button', { name: /review plan/i }).click();
  }

  async clickCalculateMyPlan() {
    await this.dialog.getByRole('button', { name: /calculate my plan/i }).click();
  }

  async clickStartTracking() {
    await this.dialog.getByRole('button', { name: /start tracking my plan/i }).click();
  }

  async clickAdjustMacros() {
    await this.dialog.getByRole('button', { name: /adjust macros/i }).click();
  }

  async clickApplyChanges() {
    await this.dialog.getByRole('button', { name: /apply changes/i }).click();
  }

  async clickCancel() {
    await this.dialog.getByRole('button', { name: /cancel/i }).click();
  }

  // ── Step 2: Goal selection ────────────────────────────────────────────────

  async selectGoal(goal: 'Lose Weight' | 'Maintain Weight' | 'Gain Muscle') {
    await this.dialog.getByRole('button', { name: new RegExp(goal, 'i') }).click();
  }

  // ── Step 3: Activity level ────────────────────────────────────────────────

  async selectActivity(level: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extra Active') {
    await this.dialog.getByRole('button', { name: new RegExp(level, 'i') }).click();
  }

  // ── Step 4: Macro preset ──────────────────────────────────────────────────

  async selectPreset(preset: 'Balanced' | 'High Protein' | 'Low Carb' | 'Keto') {
    await this.dialog.getByRole('radio', { name: new RegExp(preset, 'i') }).click();
  }

  // ── Step 6: Results ───────────────────────────────────────────────────────

  async getDisplayedCalories(): Promise<number> {
    // The calorie number is inside the hero block — grab the large number
    const text = await this.dialog.locator('.font-headline.font-black.tracking-tighter').first().textContent();
    return parseInt((text ?? '0').replace(/,/g, ''), 10);
  }

  // ── Step 7: Macro sliders ─────────────────────────────────────────────────

  getSliders() {
    return this.dialog.getByRole('slider');
  }

  getMacroTotal() {
    return this.dialog.getByText(/100%/);
  }
}
