import { type Page, type Locator } from '@playwright/test';

export class SignupPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly roleSelect: Locator;
  readonly submitButton: Locator;
  readonly googleButton: Locator;
  readonly errorMessage: Locator;
  readonly nameError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByTestId('name-input');
    this.emailInput = page.getByTestId('email-input');
    this.passwordInput = page.getByTestId('password-input');
    this.roleSelect = page.getByTestId('role-select');
    this.submitButton = page.getByTestId('submit-button');
    this.googleButton = page.getByTestId('google-button');
    this.errorMessage = page.getByTestId('error-message');
    this.nameError = page.locator('[data-testid="name-input"] + div').filter({ hasText: /.+/ });
    this.emailError = page.locator('[data-testid="email-input"] + div').filter({ hasText: /.+/ });
    this.passwordError = page.locator('[data-testid="password-input"] + div').filter({ hasText: /.+/ });
    this.loginLink = page.getByRole('link', { name: 'Sign in' });
  }

  async goto() {
    await this.page.goto('/signup');
    await this.page.waitForLoadState('networkidle');
  }

  async signup(name: string, email: string, password: string) {
    await this.nameInput.fill(name);
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
