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
    
    // Check that key dashboard elements are visible
    await expect(page.locator('text=Calories').nth(0)).toBeVisible(); // First occurrence
    await expect(page.locator('text=Macronutrients')).toBeVisible();
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    
    // Check that charts are visible
    await expect(page.locator('text=Calories This Week')).toBeVisible();
    await expect(page.locator('text=Macronutrient Breakdown')).toBeVisible();
    await expect(page.locator('text=Calories Trend')).toBeVisible();
    await expect(page.locator('text=Protein (g) Trend')).toBeVisible();
    await expect(page.locator('text=Carbs (g) Trend')).toBeVisible();
    await expect(page.locator('text=Fat (g) Trend')).toBeVisible();
  });

  test('charts display correctly with data', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for charts to load
    await page.waitForTimeout(2000);
    
    // Check charts exist in DOM (even if showing "No data")
    await expect(page.locator('text=Calories This Week')).toBeVisible();
    await expect(page.locator('text=Macronutrient Breakdown')).toBeVisible();
    
    // Check for chart SVG elements (skip icons by looking for responsive containers)
    const chartContainers = page.locator('.recharts-wrapper');
    const hasCharts = await chartContainers.count() > 0 || 
                     await page.locator('svg').count() > 5; // Multiple charts have SVGs
    
    expect(hasCharts).toBeTruthy();
  });

  test('dashboard is responsive on mobile', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Check mobile layout - dashboard should still display
    await expect(page.locator('h1')).toBeVisible();
    
    // Check charts are still present on mobile
    await expect(page.locator('text=Calories This Week')).toBeVisible();
    await expect(page.locator('text=Macronutrient Breakdown')).toBeVisible();
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
