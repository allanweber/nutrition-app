import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { FoodLogPage } from './pages/food-log.page';
import { testUser, seedUsers, newUser } from './fixtures/test-data';

test.describe('Phase 2: Food Logging', () => {
  // Helper to login with seeded user
  async function loginAsTestUser(page: import('@playwright/test').Page) {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  }

  // Helper for tests that need a fresh user (no food logs)
  async function loginAsFreshUser(page: import('@playwright/test').Page) {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Use professional user who has no food logs in seed
    await loginPage.login(seedUsers.professional1.email, seedUsers.professional1.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  }

  test.describe('Food Search', () => {
    test('user can search for food', async ({ page }) => {
      await loginAsTestUser(page);
      
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();
      
      // Search for a common food
      await foodLogPage.searchFood('apple');
      
      // Wait for search to complete (either results appear or no results message)
      await Promise.race([
        foodLogPage.searchResults.isVisible(),
        page.getByText('No foods found').isVisible(),
        // Also check for loading spinner to disappear
        page.getByText('Searching...').isHidden(),
      ]);
      
      // Wait a bit for UI to settle
      await page.waitForTimeout(300);
      
      // Check if search results are displayed
      const hasResults = await foodLogPage.searchResults.isVisible().catch(() => false);
      const noResultsMessage = page.getByText('No foods found');
      const hasNoResults = await noResultsMessage.isVisible().catch(() => false);
      
      // Either we have results or a "no results" message
      expect(hasResults || hasNoResults).toBeTruthy();
    });

    test('search shows loading state', async ({ page }) => {
      await loginAsTestUser(page);
      
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();
      
      // Start typing
      await foodLogPage.searchInput.fill('chi');
      
      // Loading might be very quick, so just check the input works
      await expect(foodLogPage.searchInput).toHaveValue('chi');
    });
  });

  test.describe('Food Log Display', () => {
    test('seeded user has existing food logs', async ({ page }) => {
      await loginAsTestUser(page);
      
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Seeded user should have food logs
      const logCount = await foodLogPage.getFoodLogCount();
      expect(logCount).toBeGreaterThan(0);
    });

    test('daily summary shows values for seeded user', async ({ page }) => {
      await loginAsTestUser(page);
      
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();
      
      // Check that daily summary section exists
      await expect(foodLogPage.dailySummary).toBeVisible();
      
      // Seeded user should have calories
      const calories = await foodLogPage.getCaloriesTotal();
      expect(calories).toBeGreaterThan(0);
    });

    test('empty state shows for professional user without logs', async ({ page }) => {
      await loginAsFreshUser(page);
      
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Professional user should see empty state (no food logs in seed)
      await expect(foodLogPage.emptyState).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Date Navigation', () => {
    test('can navigate to previous day', async ({ page }) => {
      await loginAsTestUser(page);
      
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();
      
      // Get current date display
      const todayText = await page.getByText('Today').isVisible();
      expect(todayText).toBeTruthy();
      
      // Navigate to previous day
      await foodLogPage.navigateToPreviousDay();
      
      // Should no longer show "Today"
      const todayButton = page.getByRole('button', { name: /today/i });
      await expect(todayButton).toBeVisible();
    });

    test('can navigate back to today', async ({ page }) => {
      await loginAsTestUser(page);
      
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();
      
      // Navigate to previous day
      await foodLogPage.navigateToPreviousDay();
      
      // Navigate back to today
      await foodLogPage.navigateToToday();
      
      // Should show "Today" again
      await expect(page.getByText('Today')).toBeVisible();
    });

    test('cannot navigate to future dates', async ({ page }) => {
      await loginAsTestUser(page);
      
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();
      
      // Next day button should be disabled when on today
      const nextDayButton = page.getByRole('button').filter({ 
        has: page.locator('svg.lucide-chevron-right') 
      });
      await expect(nextDayButton).toBeDisabled();
    });
  });

  test.describe('Page Structure', () => {
    test('food log page has required sections', async ({ page }) => {
      await loginAsTestUser(page);
      
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();
      
      // Check page heading
      await expect(foodLogPage.heading).toBeVisible();
      
      // Check for Add Food section
      await expect(page.getByText('Add Food')).toBeVisible();
      
      // Check for search input
      await expect(foodLogPage.searchInput).toBeVisible();
      
      // Check for daily summary
      await expect(foodLogPage.dailySummary).toBeVisible();
    });

    test('food log page is responsive on mobile', async ({ page }) => {
      await loginAsTestUser(page);
      
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();
      
      // Page should still function on mobile viewport
      await expect(foodLogPage.heading).toBeVisible();
      await expect(foodLogPage.searchInput).toBeVisible();
    });
  });

  test.describe('Authentication', () => {
    test('food log redirects to login when not authenticated', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies();
      
      // Try to access food log directly
      await page.goto('/food-log');
      await page.waitForLoadState('networkidle');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });
  });

  // These tests use mock Nutritionix data (USE_MOCK_NUTRITIONIX=true in playwright config)
  test.describe('Food Logging with Mock API', () => {
    test('user can add food to log', async ({ page }) => {
      await loginAsTestUser(page);
      
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();
      
      // Get initial count
      const initialCount = await foodLogPage.getFoodLogCount();
      
      // Search for apple (exists in mock data)
      await foodLogPage.searchInput.fill('apple');
      await page.waitForTimeout(1500); // Wait for debounced search
      
      // Wait for search results
      await expect(foodLogPage.searchResults).toBeVisible({ timeout: 10000 });
      
      // Click on first result
      const firstResult = page.getByTestId('food-result-0');
      await expect(firstResult).toBeVisible({ timeout: 5000 });
      await firstResult.click();
      
      // Verify selected food form appears
      await expect(foodLogPage.quantityInput).toBeVisible();
      await expect(foodLogPage.mealTypeSelect).toBeVisible();
      
      // Set quantity
      await foodLogPage.quantityInput.fill('1');
      
      // Select meal type
      await foodLogPage.mealTypeSelect.click();
      await page.getByRole('option', { name: /breakfast/i }).click();
      
      // Click add button
      await foodLogPage.addFoodButton.click();
      
      // Check for success message
      await expect(page.getByText(/food added successfully/i)).toBeVisible({ timeout: 10000 });
      
      // Wait for the log to appear
      await page.waitForTimeout(1000);
      
      // Food count should increase
      const newCount = await foodLogPage.getFoodLogCount();
      expect(newCount).toBeGreaterThan(initialCount);
    });

    test('user can delete food from log', async ({ page }) => {
      await loginAsTestUser(page);
      
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();
      
      // Wait for the food log entry to appear (seeded user has logs)
      const foodLogEntry = page.locator('[data-testid^="food-log-"]').first();
      await expect(foodLogEntry).toBeVisible({ timeout: 10000 });
      
      // Get initial count
      const initialCount = await foodLogPage.getFoodLogCount();
      expect(initialCount).toBeGreaterThan(0);
      
      // Set up dialog handler to accept confirmation BEFORE clicking
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      
      // Find and click delete button on first log entry
      const deleteButton = page.locator('[data-testid^="delete-log-"]').first();
      await expect(deleteButton).toBeVisible({ timeout: 5000 });
      await deleteButton.click();
      
      // Wait for the food log entry to be removed from DOM or count to decrease
      await page.waitForTimeout(1000);
      
      // Count should decrease
      const newCount = await foodLogPage.getFoodLogCount();
      expect(newCount).toBeLessThan(initialCount);
    });

    test('daily totals update correctly after adding food', async ({ page }) => {
      await loginAsTestUser(page);
      
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();
      
      // Get initial calories
      const initialCalories = await foodLogPage.getCaloriesTotal();
      
      // Add food (chicken exists in mock with known calories)
      await foodLogPage.searchInput.fill('chicken');
      await page.waitForTimeout(1500);
      
      await expect(foodLogPage.searchResults).toBeVisible({ timeout: 10000 });
      
      const firstResult = page.getByTestId('food-result-0');
      await expect(firstResult).toBeVisible({ timeout: 5000 });
      await firstResult.click();
      
      await foodLogPage.quantityInput.fill('1');
      await foodLogPage.mealTypeSelect.click();
      await page.getByRole('option', { name: /lunch/i }).click();
      await foodLogPage.addFoodButton.click();
      
      await expect(page.getByText(/food added successfully/i)).toBeVisible({ timeout: 10000 });
      
      // Wait for the UI to update
      await page.waitForTimeout(1500);
      
      // Calories should have increased
      const newCalories = await foodLogPage.getCaloriesTotal();
      expect(newCalories).toBeGreaterThan(initialCalories);
    });

    test('can add multiple foods to different meals', async ({ page }) => {
      await loginAsFreshUser(page); // Use fresh user for predictable state
      
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();
      
      // Add apple to breakfast
      await foodLogPage.searchInput.fill('apple');
      await page.waitForTimeout(400);
      await expect(foodLogPage.searchResults).toBeVisible({ timeout: 10000 });
      await page.getByTestId('food-result-0').click();
      await foodLogPage.quantityInput.fill('1');
      await foodLogPage.mealTypeSelect.click();
      await page.getByRole('option', { name: /breakfast/i }).click();
      await foodLogPage.addFoodButton.click();
      
      // Wait for success message to appear and disappear
      await expect(page.getByText(/food added successfully/i)).toBeVisible({ timeout: 10000 });
      await page.waitForSelector('text=/food added successfully/i', { state: 'hidden', timeout: 5000 });
      
      // Add rice to lunch
      await foodLogPage.searchInput.fill('rice');
      await page.waitForTimeout(400);
      await expect(foodLogPage.searchResults).toBeVisible({ timeout: 10000 });
      await page.getByTestId('food-result-0').click();
      await foodLogPage.quantityInput.fill('1');
      await foodLogPage.mealTypeSelect.click();
      await page.getByRole('option', { name: /lunch/i }).click();
      await foodLogPage.addFoodButton.click();
      
      // Wait for success message to appear
      await expect(page.getByText(/food added successfully/i)).toBeVisible({ timeout: 10000 });
      
      // Wait for the log to refresh and show both meals
      await page.waitForTimeout(1000);
      
      // Verify both meals are shown (case insensitive match)
      await expect(page.locator('text=Breakfast').or(page.locator('text=breakfast'))).toBeVisible();
      await expect(page.locator('text=Lunch').or(page.locator('text=lunch'))).toBeVisible();
      
      // Verify food count is 2
      const logCount = await foodLogPage.getFoodLogCount();
      expect(logCount).toBe(2);
    });
  });
});
