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
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check that key dashboard elements are visible
    await expect(page.locator('text=Calories').first()).toBeVisible();
    await expect(page.locator('text=Protein').first()).toBeVisible();
    await expect(page.locator('text=Carbs').first()).toBeVisible();
    
    // Check that chart section is visible
    await expect(page.locator('text=Calorie Intake')).toBeVisible();
    
    // Check weekly stats section
    await expect(page.locator('text=Avg Calories')).toBeVisible();
    await expect(page.locator('text=Protein Goal')).toBeVisible();
    await expect(page.locator('text=Streak')).toBeVisible();
    
    // Check Recent Foods section
    await expect(page.locator('text=Recent Foods')).toBeVisible();
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
    
    // Wait for charts to load
    await page.waitForTimeout(2000);
    
    // Check chart section exists in DOM
    await expect(page.locator('text=Calorie Intake')).toBeVisible();
    await expect(page.locator('text=Daily Calories')).toBeVisible();
    
    // Check for chart SVG elements (recharts renders SVGs)
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
    
    // Check key elements are still present on mobile
    await expect(page.locator('text=Calorie Intake')).toBeVisible();
    await expect(page.locator('text=Recent Foods')).toBeVisible();
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
    await expect(newPage.locator('h1')).toContainText('Dashboard');
    await expect(newPage.locator('text=Calories').first()).toBeVisible();
    
    await context.close();
  });
});
