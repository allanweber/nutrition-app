import { type Page, type Locator } from '@playwright/test';

export class FoodLogPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly searchResults: Locator;
  readonly quantityInput: Locator;
  readonly mealTypeSelect: Locator;
  readonly addFoodButton: Locator;
  readonly errorMessage: Locator;
  readonly emptyState: Locator;
  readonly dailySummary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Food Log' });
    this.searchInput = page.getByTestId('food-search-input');
    this.searchResults = page.getByTestId('search-results');
    this.quantityInput = page.getByTestId('quantity-input');
    this.mealTypeSelect = page.getByTestId('meal-type-select');
    this.addFoodButton = page.getByTestId('add-food-button');
    this.errorMessage = page.getByTestId('error-message');
    this.emptyState = page.getByTestId('empty-state');
    this.dailySummary = page.getByText('Daily Summary');
  }

  async goto() {
    await this.page.goto('/food-log');
    await this.page.waitForLoadState('networkidle');
  }

  async searchFood(query: string) {
    await this.searchInput.fill(query);
    // Wait for debounced search to trigger (300ms delay)
    await this.page.waitForTimeout(400);
  }

  async selectFirstResult() {
    const firstResult = this.page.getByTestId('food-result-0');
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

  async deleteLog(logId: number) {
    const deleteButton = this.page.getByTestId(`delete-log-${logId}`);
    await deleteButton.click();
  }

  async getFoodLogCount() {
    const logs = await this.page.locator('[data-testid^="food-log-"]').count();
    return logs;
  }

  async getCaloriesTotal() {
    // Get the calories value from the daily summary
    const caloriesText = await this.page.locator('.text-orange-600').first().textContent();
    return parseInt(caloriesText || '0', 10);
  }

  async navigateToPreviousDay() {
    await this.page.getByRole('button').filter({ has: this.page.locator('svg.lucide-chevron-left') }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToNextDay() {
    await this.page.getByRole('button').filter({ has: this.page.locator('svg.lucide-chevron-right') }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToToday() {
    const todayButton = this.page.getByRole('button', { name: /today/i });
    if (await todayButton.isVisible()) {
      await todayButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }
}
