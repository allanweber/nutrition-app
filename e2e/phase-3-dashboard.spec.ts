import { test, expect } from '@playwright/test';
import { SignupPage } from './pages/signup.page';

test.describe('Phase 3: Dashboard & Charts', () => {
  test.beforeEach(async ({ page }) => {
    // Create a new user and login
    const signupPage = new SignupPage(page);
    const uniqueEmail = `dashboard-test-${Date.now()}@example.com`;
    
    await signupPage.goto();
    await signupPage.signup('Test User', uniqueEmail, 'TestPassword123!');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  test('dashboard loads successfully', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check success message
    await expect(page.locator('text=Dashboard loaded successfully')).toBeVisible();
  });

  test('dashboard is responsive on mobile', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Check mobile layout - dashboard should still display
    await expect(page.locator('h1')).toBeVisible();
  });

  test('dashboard redirects to login when not authenticated', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const newPage = await context.newPage();
    
    // Try to access dashboard without auth
    await newPage.goto('/dashboard');
    
    // Should redirect to login
    await newPage.waitForURL('/login');
    await expect(newPage).toHaveURL('/login');
    
    await context.close();
  });
});
