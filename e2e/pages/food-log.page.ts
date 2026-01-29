import { type Page, type Locator } from '@playwright/test';

export class FoodLogPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly searchResults: Locator;
  readonly servingGramsInput: Locator;
  readonly addFoodButton: Locator;
  readonly errorMessage: Locator;
  readonly emptyState: Locator;
  readonly dailySummary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Food Log' });
    this.searchInput = page.getByTestId('food-search-input');
    this.searchResults = page.getByTestId('search-results');
    this.servingGramsInput = page.getByTestId('serving-grams-input');
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
    const trimmed = query.trim();
    const shouldWaitForSearch = trimmed.length >= 3;

    const searchResponsePromise = shouldWaitForSearch
      ? this.page
          .waitForResponse(
            (response) => {
              try {
                const url = new URL(response.url());
                return (
                  url.pathname.endsWith('/api/foods/search') &&
                  (url.searchParams.get('q') ?? '').toLowerCase() === trimmed.toLowerCase()
                );
              } catch {
                return false;
              }
            },
            { timeout: 15000 },
          )
          .catch(() => null)
      : Promise.resolve(null);

    await this.searchInput.fill(query);
    // Wait for debounced search to trigger (300ms delay)
    await this.page.waitForTimeout(450);
    await searchResponsePromise;

    // Give the UI a moment to render results/empty state after the response.
    await this.page.waitForTimeout(150);
  }

  async selectFirstResult() {
    const firstResult = this.page.getByTestId('food-result-0');
    await firstResult.click();
  }

  async setServingGrams(grams: string) {
    await this.servingGramsInput.fill(grams);
  }

  async addFood() {
    await this.addFoodButton.click();
    // Wait for the add operation to complete
    await this.page.waitForTimeout(500);
  }

  async addFoodToLog(query: string, grams: string) {
    await this.searchFood(query);
    await this.selectFirstResult();
    await this.setServingGrams(grams);
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
