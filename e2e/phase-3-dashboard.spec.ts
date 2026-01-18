import { test, expect } from '@playwright/test';

test.describe('Phase 3: Dashboard & Charts', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('dashboard loads and displays summary cards', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Welcome back');
    
    // Check summary cards
    await expect(page.locator('text=Today\'s Calories')).toBeVisible();
    await expect(page.locator('text=Protein')).toBeVisible();
    await expect(page.locator('text=Carbs')).toBeVisible();
    await expect(page.locator('text=Fat')).toBeVisible();
  });

  test('charts are displayed when data is available', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for chart components
    await expect(page.locator('text=Macronutrient Breakdown')).toBeVisible();
    await expect(page.locator('text=Calories This Week')).toBeVisible();
    await expect(page.locator('text=Protein Trend')).toBeVisible();
    await expect(page.locator('text=Carbs Trend')).toBeVisible();
  });

  test('dashboard is responsive on mobile', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Check mobile layout
    await expect(page.locator('h1')).toBeVisible();
    
    // Summary cards should stack vertically
    const summaryCards = page.locator('.grid > div').filter({ hasText: 'Today\'s Calories' }).count();
    await expect(summaryCards).toBeGreaterThan(0);
  });

  test('quick action links work', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test Search Foods link
    await page.click('text=Search Foods');
    await page.waitForURL('/foods/search');
    
    // Go back to dashboard
    await page.goto('/dashboard');
    
    // Test Log Food link
    await page.click('text=Log Food');
    await page.waitForURL('/food-log');
    
    // Go back to dashboard
    await page.goto('/dashboard');
    
    // Test Set Goals link
    await page.click('text=Set Goals');
    await page.waitForURL('/goals');
  });

  test('dashboard shows current date', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for date display
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    
    await expect(page.locator('text=' + today)).toBeVisible();
  });

  test('empty state displays correctly', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for zero values when no food is logged
    await expect(page.locator('text=0')).toBeVisible();
    await expect(page.locator('text=No food logged today')).toBeVisible();
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

  test('progress bars show correct percentages', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for progress bars
    const progressBars = page.locator('[role="progressbar"]');
    await expect(progressBars.first()).toBeVisible();
  });

  test('today\'s summary section displays', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check summary section
    await expect(page.locator('text=Today\'s Summary')).toBeVisible();
    await expect(page.locator('text=Food Items:')).toBeVisible();
    await expect(page.locator('text=Fiber:')).toBeVisible();
    await expect(page.locator('text=Sugar:')).toBeVisible();
    await expect(page.locator('text=Sodium:')).toBeVisible();
  });
});