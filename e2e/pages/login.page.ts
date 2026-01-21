import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly googleButton: Locator;
  readonly errorMessage: Locator;
  readonly signupLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('email-input');
    this.passwordInput = page.getByTestId('password-input');
    this.submitButton = page.getByTestId('submit-button');
    this.googleButton = page.getByTestId('google-button');
    this.errorMessage = page.getByTestId('error-message');
    this.signupLink = page.getByRole('link', { name: 'Create one free' });
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    
    // Wait for navigation or error message
    await Promise.race([
      this.page.waitForURL('**/dashboard**', { timeout: 15000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 15000 }),
    ]).catch(() => {});
  }

  async getErrorMessage() {
    return this.errorMessage.textContent();
  }
}
