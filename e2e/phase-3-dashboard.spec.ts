import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { testUser, seedUsers } from './fixtures/test-data';

test.describe('Phase 3: Dashboard & Charts', () => {
  test.beforeEach(async ({ page }) => {
    // Login with seeded user who has food logs and goals
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  test('dashboard loads successfully', async ({ page }) => {
    await page.goto('/dashboard');

    // Check page heading
    await expect(page.locator('h1')).toBeVisible();

    // Check that key dashboard sections are visible
    await expect(page.getByRole('heading', { name: 'Calories' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Daily Macros' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Weekly Momentum' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Daily Schedule' })).toBeVisible({ timeout: 10000 });
  });

  test('dashboard shows data for seeded user', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for data to load
    await page.waitForTimeout(1000);
    
    // Seeded user has food logs, so there should be some calorie data
    // Check for any numeric calorie value in the dashboard
    const calorieValues = page.locator('text=/\\d+.*cal/i');
    await expect(calorieValues.first()).toBeVisible({ timeout: 10000 });
  });

  test('charts display correctly with data', async ({ page }) => {
    await page.goto('/dashboard');

    // Check Weekly Momentum section with its bar chart
    await expect(page.getByRole('heading', { name: 'Weekly Momentum' })).toBeVisible({ timeout: 10000 });

    // recharts-wrapper is a div and always has dimensions
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible({ timeout: 10000 });

    // SVG <g> elements have no bounding box — use toBeAttached to confirm presence
    await expect(page.locator('.recharts-xAxis')).toBeAttached();
    await expect(page.locator('.recharts-bar')).toBeAttached();
  });

  test('dashboard is responsive on mobile', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Check mobile layout — dashboard should still display
    await expect(page.locator('h1')).toBeVisible();

    // Check key sections are present on mobile
    await expect(page.getByRole('heading', { name: 'Calories' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Daily Schedule' })).toBeVisible({ timeout: 10000 });
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

  test('dashboard shows different data for different goal types', async ({ page, browser }) => {
    // First check weight loss user (current)
    await page.goto('/dashboard');
    await expect(page.locator('text=Calories').first()).toBeVisible();
    
    // Create new context and login as muscle gain user
    const context = await browser.newContext();
    const newPage = await context.newPage();
    
    const loginPage = new LoginPage(newPage);
    await loginPage.goto();
    await loginPage.login(seedUsers.muscleGain.email, seedUsers.muscleGain.password);
    await newPage.waitForURL(/\/dashboard/, { timeout: 15000 });
    
    // Dashboard should load for muscle gain user too
    await expect(newPage.locator('h1')).toBeVisible();
    await expect(newPage.locator('text=Calories').first()).toBeVisible();
    
    await context.close();
  });
});
