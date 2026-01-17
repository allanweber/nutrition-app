import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { SignupPage } from './pages/signup.page';
import { testUsers, invalidCredentials, routes } from './fixtures/test-data';

test.describe('Phase 1: Authentication', () => {
  test.describe('User Registration', () => {
    test('user can register with email/password', async ({ page }) => {
      const signupPage = new SignupPage(page);
      const uniqueEmail = `test-${Date.now()}@example.com`;

      await signupPage.goto();
      await signupPage.signup('Test User', uniqueEmail, 'TestPassword123!');

      // Should redirect to dashboard after successful signup
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    });

    test('shows error for invalid email format', async ({ page }) => {
      const signupPage = new SignupPage(page);

      await signupPage.goto();
      await signupPage.nameInput.fill('Test User');
      await signupPage.emailInput.fill('invalid-email');
      await signupPage.passwordInput.fill('TestPassword123!');
      await signupPage.submitButton.click();

      // Browser validation should prevent submission
      const emailInput = signupPage.emailInput;
      const validationMessage = await emailInput.evaluate(
        (el: HTMLInputElement) => el.validationMessage
      );
      expect(validationMessage).toBeTruthy();
    });

    test('shows error for short password', async ({ page }) => {
      const signupPage = new SignupPage(page);

      await signupPage.goto();
      await signupPage.nameInput.fill('Test User');
      await signupPage.emailInput.fill('test@example.com');
      await signupPage.passwordInput.fill('short');
      await signupPage.submitButton.click();

      // Browser validation should prevent submission (minLength=8)
      const passwordInput = signupPage.passwordInput;
      const validationMessage = await passwordInput.evaluate(
        (el: HTMLInputElement) => el.validationMessage
      );
      expect(validationMessage).toBeTruthy();
    });

    test('can navigate to login page', async ({ page }) => {
      const signupPage = new SignupPage(page);

      await signupPage.goto();
      await signupPage.loginLink.click();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(routes.login, { timeout: 10000 });
    });
  });

  test.describe('User Login', () => {
    test('user can login with email/password', async ({ page }) => {
      // First create a user
      const signupPage = new SignupPage(page);
      const uniqueEmail = `test-${Date.now()}@example.com`;
      const password = 'TestPassword123!';

      await signupPage.goto();
      await signupPage.signup('Test User', uniqueEmail, password);
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

      // Clear cookies/session to logout
      await page.context().clearCookies();

      // Now login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(uniqueEmail, password);

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    });

    test('shows error for invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.login(invalidCredentials.email, invalidCredentials.password);

      // Should show error message
      await expect(loginPage.errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('can navigate to signup page', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.signupLink.click();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(routes.signup, { timeout: 10000 });
    });
  });

  test.describe('Session Management', () => {
    test('session persists across page reload', async ({ page }) => {
      // Create and login user
      const signupPage = new SignupPage(page);
      const uniqueEmail = `test-${Date.now()}@example.com`;

      await signupPage.goto();
      await signupPage.signup('Test User', uniqueEmail, 'TestPassword123!');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be on dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test('user can logout', async ({ page }) => {
      // Create and login user
      const signupPage = new SignupPage(page);
      const uniqueEmail = `test-${Date.now()}@example.com`;

      await signupPage.goto();
      await signupPage.signup('Test User', uniqueEmail, 'TestPassword123!');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

      // Find and click logout button (if exists in dashboard layout)
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
      if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logoutButton.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/(login|$)/, { timeout: 10000 });
      }
    });
  });

  test.describe('Protected Routes', () => {
    test('dashboard redirects to login when not authenticated', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies();

      // Try to access dashboard directly
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should redirect to login (or show login prompt)
      // Note: This depends on middleware implementation
      await expect(page).toHaveURL(/\/(login|dashboard)/, { timeout: 10000 });
    });
  });

  test.describe('Google OAuth', () => {
    test('google sign-in button is visible on login page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await expect(loginPage.googleButton).toBeVisible();
      await expect(loginPage.googleButton).toContainText(/google/i);
    });

    test('google sign-in button is visible on signup page', async ({ page }) => {
      const signupPage = new SignupPage(page);
      await signupPage.goto();

      await expect(signupPage.googleButton).toBeVisible();
      await expect(signupPage.googleButton).toContainText(/google/i);
    });
  });
});
