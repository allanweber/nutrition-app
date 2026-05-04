import { type Page, type Locator } from '@playwright/test';
import { format, startOfWeek, addDays } from 'date-fns';

export class FoodLogPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly mealPlanBanner: Locator;
  readonly mealPlanBannerDismiss: Locator;
  readonly logAllMealsButton: Locator;
  readonly logMealsModal: Locator;
  readonly logMealsAddButton: Locator;
  readonly logMealsReplaceButton: Locator;
  readonly searchInput: Locator;
  readonly searchResults: Locator;
  readonly quantityInput: Locator;
  readonly mealTypeSelect: Locator;
  readonly addFoodButton: Locator;
  readonly errorMessage: Locator;
  readonly emptyState: Locator;
  readonly nutritionPulse: Locator;
  readonly weeklyStrip: Locator;
  readonly pulseCaloriesRemaining: Locator;
  readonly pulseMacroProtein: Locator;
  readonly pulseMacroCarbs: Locator;
  readonly pulseMacroFat: Locator;
  readonly quickAddButtons: Locator;
  // New modal UI locators
  readonly dateNavigator: Locator;
  readonly dateNavPrev: Locator;
  readonly dateNavNext: Locator;
  readonly dateNavDisplay: Locator;
  readonly quantitySlider: Locator;
  readonly measureSelect: Locator;
  readonly macroCalories: Locator;
  readonly macroProtein: Locator;
  readonly macroCarbs: Locator;
  readonly macroFat: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Meal Planner & Daily Intake' });
    this.mealPlanBanner = page.getByTestId('meal-plan-banner');
    this.mealPlanBannerDismiss = page.getByTestId('meal-plan-banner-dismiss');
    this.logAllMealsButton = page.getByTestId('log-all-meals-btn');
    this.logMealsModal = page.getByTestId('log-meals-modal');
    this.logMealsAddButton = page.getByTestId('log-meals-add-btn');
    this.logMealsReplaceButton = page.getByTestId('log-meals-replace-btn');
    this.searchInput = page.getByTestId('food-search-input');
    this.searchResults = page.getByTestId('food-search-dropdown');
    this.quantityInput = page.getByTestId('quantity-input');
    this.mealTypeSelect = page.getByTestId('meal-type-select');
    this.addFoodButton = page.getByTestId('add-food-button');
    this.errorMessage = page.getByTestId('error-message');
    this.emptyState = page.getByTestId('empty-state');
    this.nutritionPulse = page.getByTestId('nutrition-pulse');
    this.weeklyStrip = page.getByTestId('weekly-calendar-strip');
    this.pulseCaloriesRemaining = page.getByTestId('pulse-calories-remaining');
    this.pulseMacroProtein = page.getByTestId('pulse-macro-protein');
    this.pulseMacroCarbs = page.getByTestId('pulse-macro-carbs');
    this.pulseMacroFat = page.getByTestId('pulse-macro-fat');
    this.quickAddButtons = page.getByTestId('quick-add-recent');
    // New modal UI locators
    this.dateNavigator = page.getByTestId('date-navigator');
    this.dateNavPrev = page.getByTestId('date-nav-prev');
    this.dateNavNext = page.getByTestId('date-nav-next');
    this.dateNavDisplay = page.getByTestId('date-nav-display');
    this.quantitySlider = page.getByTestId('quantity-slider');
    this.measureSelect = page.getByTestId('measure-select');
    this.macroCalories = page.getByTestId('macros-calories');
    this.macroProtein = page.getByTestId('macros-protein');
    this.macroCarbs = page.getByTestId('macros-carbs');
    this.macroFat = page.getByTestId('macros-fat');
    this.cancelButton = page.getByTestId('food-modal-cancel');
  }

  async goto(date?: string) {
    await this.page.goto(date ? `/food-log?date=${date}` : '/food-log');
    await this.page.waitForLoadState('networkidle');
  }

  mealPlanAddon(mealType: string) {
    return this.page.getByTestId(`meal-plan-addon-${mealType}`);
  }

  logPlanButton(mealType: string) {
    return this.page.getByTestId(`log-plan-btn-${mealType}`);
  }

  mealSection(mealType: string) {
    return this.page.getByTestId(`meal-section-${mealType}`);
  }

  mealRows(mealType: string) {
    return this.mealSection(mealType).locator('[data-testid^="food-log-"]');
  }

  async searchFood(query: string) {
    await this.searchInput.fill(query);
    // Wait for debounced search to trigger (300ms delay)
    await this.page.waitForTimeout(400);
  }

  async selectFirstResult() {
    const firstResult = this.page.getByTestId('food-result-item').first();
    await firstResult.click();
  }

  async setQuantity(quantity: string) {
    await this.quantityInput.fill(quantity);
  }

  async selectMealType(mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') {
    await this.mealTypeSelect.click();
    await this.page.getByRole('option', { name: new RegExp(mealType, 'i') }).click();
  }

  async addFood() {
    await this.addFoodButton.click();
    // Wait for the add operation to complete
    await this.page.waitForTimeout(500);
  }

  async addFoodToLog(query: string, quantity: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') {
    await this.searchFood(query);
    await this.selectFirstResult();
    await this.setQuantity(quantity);
    await this.selectMealType(mealType);
    await this.addFood();
  }

  async deleteLog(logId: string) {
    const deleteButton = this.page.getByTestId(`delete-log-${logId}`);
    await deleteButton.click();
  }

  async getFoodLogCount() {
    const logs = await this.page.locator('[data-testid^="food-log-"]:not([data-testid="food-log-heading"])').count();
    return logs;
  }

  async getCaloriesTotal(): Promise<number> {
    const text = await this.pulseCaloriesRemaining.textContent();
    return parseInt(text || '0', 10);
  }

  /** Click a specific day in the weekly strip (0 = Monday of current week … 6 = Sunday) */
  async clickDay(dayIndex: number) {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const day = addDays(weekStart, dayIndex);
    const dayStr = format(day, 'yyyy-MM-dd');
    await this.page.getByTestId(`week-day-${dayStr}`).click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Click today's pill in the weekly strip */
  async clickTodayInStrip() {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    await this.page.getByTestId(`week-day-${todayStr}`).click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToPreviousDay() {
    // Navigate to Monday of the current week (first available past day)
    await this.clickDay(0);
  }

  async navigateToNextDay() {
    // Future days are disabled; this is kept for backwards compatibility
    await this.clickDay(6);
  }

  async navigateToToday() {
    await this.clickTodayInStrip();
  }

  async getNutritionPulseVisible(): Promise<boolean> {
    return this.nutritionPulse.isVisible().catch(() => false);
  }

  async getPulseCaloriesRemaining(): Promise<number> {
    return this.getCaloriesTotal();
  }

  async getQuickAddFoodNames(): Promise<string[]> {
    const container = this.quickAddButtons;
    const visible = await container.isVisible().catch(() => false);
    if (!visible) return [];
    const buttons = container.locator('button');
    const count = await buttons.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent();
      if (text) names.push(text.trim());
    }
    return names;
  }

  /** Select a measure unit by label text in the modal */
  async setMeasure(label: string) {
    await this.measureSelect.click();
    await this.page.getByRole('option', { name: new RegExp(label, 'i') }).click();
  }

  /** Click the prev or next date arrow in the modal's DateNavigator */
  async navigateModalDate(direction: 'prev' | 'next') {
    if (direction === 'prev') {
      await this.dateNavPrev.click();
    } else {
      await this.dateNavNext.click();
    }
  }

  /** Returns the calories text from the macros summary in the modal */
  async getMacroCalories(): Promise<string> {
    return (await this.macroCalories.textContent()) ?? '';
  }
}
