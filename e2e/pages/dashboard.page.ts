import { type Page, type Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly logoutButton: Locator;
  readonly caloriesCard: Locator;
  readonly proteinCard: Locator;
  readonly carbsCard: Locator;
  readonly fatCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    this.caloriesCard = page.getByText(/calories/i).first();
    this.proteinCard = page.getByText(/protein/i).first();
    this.carbsCard = page.getByText(/carbs/i).first();
    this.fatCard = page.getByText(/fat/i).first();
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async isVisible() {
    return this.page.url().includes('/dashboard');
  }
}
