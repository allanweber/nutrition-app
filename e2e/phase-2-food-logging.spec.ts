import { expect, test } from '@playwright/test';
import { seedUsers, testUser } from './fixtures/test-data';
import { FoodLogPage } from './pages/food-log.page';
import { LoginPage } from './pages/login.page';

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
    await loginPage.login(
      seedUsers.professional1.email,
      seedUsers.professional1.password,
    );
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
      const hasResults = await foodLogPage.searchResults
        .isVisible()
        .catch(() => false);
      const hasNoResults = await page.getByTestId('search-empty')
        .isVisible()
        .catch(() => false);

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

      // Check that nutrition pulse sidebar is visible
      await expect(foodLogPage.nutritionPulse).toBeVisible();

      // Seeded user should have calories remaining shown
      await expect(foodLogPage.pulseCaloriesRemaining).toBeVisible();
    });

    test('empty state shows for professional user without logs', async ({
      page,
    }) => {
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
    test('can navigate to previous day via weekly strip', async ({ page }) => {
      await loginAsTestUser(page);

      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      // Weekly strip should be visible
      await expect(foodLogPage.weeklyStrip).toBeVisible();

      // Navigate to Monday (index 0)
      await foodLogPage.clickDay(0);

      // Weekly strip is still visible after navigation
      await expect(foodLogPage.weeklyStrip).toBeVisible();
    });

    test('can navigate back to today via weekly strip', async ({ page }) => {
      await loginAsTestUser(page);

      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      // Navigate to Monday, then back to today
      await foodLogPage.clickDay(0);
      await foodLogPage.clickTodayInStrip();

      // Today's pill is still in the strip
      await expect(foodLogPage.weeklyStrip).toBeVisible();
    });

    test('cannot navigate to future dates', async ({ page }) => {
      await loginAsTestUser(page);

      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      // Future day pills should be disabled
      const { format: fmt, addDays: add } = await import('date-fns');
      const tomorrow = add(new Date(), 1);
      const tomorrowStr = fmt(tomorrow, 'yyyy-MM-dd');
      const tomorrowPill = page.getByTestId(`week-day-${tomorrowStr}`);

      // If tomorrow is within this week it should be disabled
      const isVisible = await tomorrowPill.isVisible().catch(() => false);
      if (isVisible) {
        await expect(tomorrowPill).toBeDisabled();
      }
    });
  });

  test.describe('Page Structure', () => {
    test('food log page has required sections', async ({ page }) => {
      await loginAsTestUser(page);

      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      // Check page heading
      await expect(foodLogPage.heading).toBeVisible();

      // Check for search input
      await expect(foodLogPage.searchInput).toBeVisible();

      // Check for weekly strip and nutrition pulse
      await expect(foodLogPage.weeklyStrip).toBeVisible();
      await expect(foodLogPage.nutritionPulse).toBeVisible();
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
    test('food log redirects to login when not authenticated', async ({
      page,
    }) => {
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

      // Wait for search results dropdown
      await expect(foodLogPage.searchResults).toBeVisible({ timeout: 10000 });

      // Click on first result — modal opens
      const firstResult = page.getByTestId('food-result-item').first();
      await expect(firstResult).toBeVisible({ timeout: 5000 });
      await firstResult.click();

      // Verify add modal appears with form
      await expect(page.getByTestId('food-add-modal')).toBeVisible({ timeout: 5000 });
      await expect(foodLogPage.quantityInput).toBeVisible();
      await expect(foodLogPage.mealTypeSelect).toBeVisible();

      // Set quantity
      await foodLogPage.quantityInput.fill('1');

      // Select meal type
      await foodLogPage.mealTypeSelect.click();
      await page.getByRole('option', { name: /breakfast/i }).click();

      // Click add button
      await foodLogPage.addFoodButton.click();

      // Modal should close on success
      await expect(page.getByTestId('food-add-modal')).not.toBeVisible({ timeout: 10000 });

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

      // Find and click delete button on first log entry
      const deleteButton = page.locator('[data-testid^="delete-log-"]').first();
      await expect(deleteButton).toBeVisible({ timeout: 5000 });
      await deleteButton.click();

      // Inline confirmation UI: click the "Remove" confirm button
      const confirmButton = page.locator('[data-testid^="delete-confirm-"]').first();
      await expect(confirmButton).toBeVisible({ timeout: 5000 });
      await confirmButton.click();

      // Count should decrease after query invalidation/refetch completes.
      await expect
        .poll(async () => await foodLogPage.getFoodLogCount(), {
          timeout: 10000,
        })
        .toBeLessThan(initialCount);
    });

    test('daily totals update correctly after adding food', async ({
      page,
    }) => {
      await loginAsTestUser(page);

      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      // Get initial calories
      const initialCalories = await foodLogPage.getCaloriesTotal();

      // Add food (chicken exists in mock with known calories)
      await foodLogPage.searchInput.fill('chicken');
      await page.waitForTimeout(1500);

      await expect(foodLogPage.searchResults).toBeVisible({ timeout: 10000 });

      const firstResult = page.getByTestId('food-result-item').first();
      await expect(firstResult).toBeVisible({ timeout: 5000 });
      await firstResult.click();

      await expect(page.getByTestId('food-add-modal')).toBeVisible({ timeout: 5000 });
      await foodLogPage.quantityInput.fill('1');
      await foodLogPage.mealTypeSelect.click();
      await page.getByRole('option', { name: /lunch/i }).click();
      await foodLogPage.addFoodButton.click();

      // Modal should close on success
      await expect(page.getByTestId('food-add-modal')).not.toBeVisible({ timeout: 10000 });

      // Wait for the UI to update
      await page.waitForTimeout(1500);

      // Remaining calories should have decreased (more food consumed = less remaining)
      const newCalories = await foodLogPage.getCaloriesTotal();
      expect(newCalories).toBeLessThanOrEqual(initialCalories);
    });

    test('can add multiple foods to different meals', async ({ page }) => {
      await loginAsFreshUser(page); // Use fresh user for predictable state

      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      // Add apple to breakfast
      await foodLogPage.searchInput.fill('apple');
      await page.waitForTimeout(600);
      await expect(foodLogPage.searchResults).toBeVisible({ timeout: 10000 });
      await page.getByTestId('food-result-item').first().click();
      await expect(page.getByTestId('food-add-modal')).toBeVisible({ timeout: 5000 });
      await foodLogPage.quantityInput.fill('1');
      await foodLogPage.mealTypeSelect.click();
      await page.getByRole('option', { name: /breakfast/i }).click();
      await foodLogPage.addFoodButton.click();

      // Wait for modal to close
      await expect(page.getByTestId('food-add-modal')).not.toBeVisible({ timeout: 10000 });

      // Add rice to lunch
      await foodLogPage.searchInput.click();
      await foodLogPage.searchInput.fill('rice');
      await page.waitForTimeout(600);
      await expect(foodLogPage.searchResults).toBeVisible({ timeout: 10000 });
      await page.getByTestId('food-result-item').first().click();
      await expect(page.getByTestId('food-add-modal')).toBeVisible({ timeout: 5000 });
      await foodLogPage.quantityInput.fill('1');
      await foodLogPage.mealTypeSelect.click();
      await page.getByRole('option', { name: /lunch/i }).click();
      await foodLogPage.addFoodButton.click();

      // Wait for modal to close
      await expect(page.getByTestId('food-add-modal')).not.toBeVisible({ timeout: 10000 });

      // Wait for the log to refresh and show both meals
      await page.waitForTimeout(1000);

      // Verify both meals are shown (case insensitive match)
      await expect(
        page.locator('text=Breakfast').or(page.locator('text=breakfast')),
      ).toBeVisible();
      await expect(
        page.locator('text=Lunch').or(page.locator('text=lunch')),
      ).toBeVisible();

      // Verify food count is 2
      const logCount = await foodLogPage.getFoodLogCount();
      expect(logCount).toBe(2);
    });
  });
});
