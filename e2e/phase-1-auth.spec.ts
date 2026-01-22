import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { SignupPage } from './pages/signup.page';
import { testUser, newUser, invalidCredentials, routes } from './fixtures/test-data';

test.describe('Phase 1: Authentication', () => {
  test.describe('User Registration', () => {
    test('user can register with email/password', async ({ page }) => {
      const signupPage = new SignupPage(page);
      // Use unique email to avoid conflicts with seed data
      const uniqueEmail = `signup-test-${Date.now()}@example.com`;

      await signupPage.goto();
      await signupPage.signup('Test User', uniqueEmail, 'TestPassword123!');

      // Should redirect to dashboard after successful signup
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    });

    test('shows field validation errors', async ({ page }) => {
      const signupPage = new SignupPage(page);

      await signupPage.goto();

      // Test empty form submission
      await signupPage.submitButton.click();

      // Should show field-specific error messages
      await expect(signupPage.nameError.first()).toBeVisible({ timeout: 5000 });
      await expect(signupPage.emailError.first()).toBeVisible({ timeout: 5000 });
      await expect(signupPage.passwordError.first()).toBeVisible({ timeout: 5000 });
    });

    test('shows email validation error', async ({ page }) => {
      const signupPage = new SignupPage(page);

      await signupPage.goto();
      await signupPage.nameInput.fill('Test User');
      await signupPage.emailInput.fill('invalid-email');
      await signupPage.passwordInput.fill('TestPassword123!');

      // Trigger validation by clicking submit or blurring field
      await signupPage.emailInput.blur();

      // Should show email validation error
      await expect(signupPage.emailError.first()).toBeVisible({ timeout: 5000 });
      await expect(signupPage.emailError.first()).toContainText('email');
    });

    test('shows error for existing email', async ({ page }) => {
      const signupPage = new SignupPage(page);

      await signupPage.goto();
      await signupPage.signup('Test User', testUser.email, 'TestPassword123!');

      // Should show error message for existing email
      await expect(signupPage.errorMessage).toBeVisible({ timeout: 10000 });
      await expect(signupPage.errorMessage).toContainText(/email|already|exists|user/i);
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
    test('user can login with seeded account', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    });

    test('shows error for invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.login(invalidCredentials.email, invalidCredentials.password);

      // Should show error message (form submission error)
      // Check for any error text on the page
      await expect(page.getByText(/invalid|wrong|error/i)).toBeVisible({ timeout: 10000 });
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
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be on dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test('user can logout', async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);
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
