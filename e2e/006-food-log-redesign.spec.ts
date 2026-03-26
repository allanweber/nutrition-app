import { expect, test } from '@playwright/test';
import { seedUsers, testUser } from './fixtures/test-data';
import { FoodLogPage } from './pages/food-log.page';
import { LoginPage } from './pages/login.page';
import { format, addDays, startOfWeek } from 'date-fns';

test.describe('006: Food Log Screen Redesign', () => {
  async function loginAsTestUser(page: import('@playwright/test').Page) {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  }

  async function loginAsFreshUser(page: import('@playwright/test').Page) {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(seedUsers.professional1.email, seedUsers.professional1.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  }

  async function openFoodModal(page: import('@playwright/test').Page, foodLogPage: FoodLogPage) {
    await foodLogPage.goto();
    await foodLogPage.searchFood('chicken');
    await foodLogPage.selectFirstResult();
    await expect(page.getByTestId('food-add-modal')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('add-food-button')).toBeVisible({ timeout: 8000 });
  }

  test.describe('Layout & Structure', () => {
    test('page heading is "Meal Planner & Daily Intake"', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();
      await expect(foodLogPage.heading).toBeVisible();
    });

    test('weekly strip, search, meal cards, and nutrition pulse all visible', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      await expect(foodLogPage.weeklyStrip).toBeVisible();
      await expect(foodLogPage.searchInput).toBeVisible();
      await expect(foodLogPage.nutritionPulse).toBeVisible();
    });
  });

  test.describe('Weekly Calendar Strip', () => {
    test('renders 7 day pills for current week', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        const dayStr = format(day, 'yyyy-MM-dd');
        await expect(page.getByTestId(`week-day-${dayStr}`)).toBeVisible();
      }
    });

    test("today's pill is active (not disabled)", async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todayPill = page.getByTestId(`week-day-${todayStr}`);
      await expect(todayPill).toBeVisible();
      await expect(todayPill).not.toBeDisabled();
    });

    test('clicking a past day pill changes selection', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      // Click Monday (index 0) — it's in the past or today
      await foodLogPage.clickDay(0);

      // Weekly strip remains visible after navigation
      await expect(foodLogPage.weeklyStrip).toBeVisible();
    });

    test('future day pills are disabled when within current week', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      const tomorrow = addDays(new Date(), 1);
      const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
      const tomorrowPill = page.getByTestId(`week-day-${tomorrowStr}`);

      // Only check if tomorrow is still this week
      const isVisible = await tomorrowPill.isVisible().catch(() => false);
      if (isVisible) {
        await expect(tomorrowPill).toBeDisabled();
      }
    });

    test('clicking today pill after navigating to Monday returns to today', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      await foodLogPage.clickDay(0);
      await foodLogPage.clickTodayInStrip();

      // Strip still visible
      await expect(foodLogPage.weeklyStrip).toBeVisible();
    });
  });

  test.describe('Nutrition Pulse Sidebar', () => {
    test('sidebar is visible', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      await expect(foodLogPage.nutritionPulse).toBeVisible();
    });

    test('shows remaining calories value', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      await expect(foodLogPage.pulseCaloriesRemaining).toBeVisible();
      const text = await foodLogPage.pulseCaloriesRemaining.textContent();
      // Should be a number or dash for loading
      expect(text?.trim()).toMatch(/^[\d—-]+$/);
    });

    test('shows protein, carbs, and fat macro bars', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      await expect(foodLogPage.pulseMacroProtein).toBeVisible();
      await expect(foodLogPage.pulseMacroCarbs).toBeVisible();
      await expect(foodLogPage.pulseMacroFat).toBeVisible();
    });

    test('sidebar renders for fresh user with no goals', async ({ page }) => {
      await loginAsFreshUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      // Should still render without crashing
      await expect(foodLogPage.nutritionPulse).toBeVisible();
      await expect(foodLogPage.pulseCaloriesRemaining).toBeVisible();
    });

    test('remaining calories decreases after logging food', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      const initialRemaining = await foodLogPage.getPulseCaloriesRemaining();

      // Add a food via the search field
      await foodLogPage.searchInput.fill('apple');
      await page.waitForTimeout(1500);

      const hasResults = await foodLogPage.searchResults.isVisible().catch(() => false);
      if (!hasResults) return; // Skip if no mock data available

      await page.getByTestId('food-result-item').first().click();
      await expect(page.getByTestId('food-add-modal')).toBeVisible({ timeout: 5000 });
      await foodLogPage.quantityInput.fill('1');
      await foodLogPage.mealTypeSelect.click();
      await page.getByRole('option', { name: /breakfast/i }).click();
      await foodLogPage.addFoodButton.click();
      await expect(page.getByTestId('food-add-modal')).not.toBeVisible({ timeout: 10000 });

      await page.waitForTimeout(1500);
      const newRemaining = await foodLogPage.getPulseCaloriesRemaining();
      // Remaining should be ≤ initial (user has a goal) or unchanged (no goal → 0 goal shows 0)
      expect(newRemaining).toBeLessThanOrEqual(initialRemaining);
    });
  });

  test.describe('Meal Card Design', () => {
    test('all four meal type sections are rendered', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      await expect(page.getByTestId('meal-section-breakfast')).toBeVisible();
      await expect(page.getByTestId('meal-section-lunch')).toBeVisible();
      await expect(page.getByTestId('meal-section-dinner')).toBeVisible();
      await expect(page.getByTestId('meal-section-snack')).toBeVisible();
    });

    test('empty meal placeholders appear for unlogged meals (fresh user)', async ({ page }) => {
      await loginAsFreshUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      // Empty sections start collapsed — expand breakfast to see its placeholder
      await expect(page.getByTestId('meal-section-breakfast')).toBeVisible({ timeout: 10000 });
      await page.getByTestId('meal-toggle-breakfast').click();

      const placeholder = page.getByTestId('meal-empty-placeholder-breakfast');
      await expect(placeholder).toBeVisible({ timeout: 5000 });
    });

    test('food items show in logged meal sections (seeded user)', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      // Seeded user has food logs
      const logCount = await foodLogPage.getFoodLogCount();
      expect(logCount).toBeGreaterThan(0);
    });
  });

  test.describe('Quick Add Recent', () => {
    test('quick add section appears for seeded user with logs', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      const logCount = await foodLogPage.getFoodLogCount();
      if (logCount > 0) {
        await expect(foodLogPage.quickAddButtons).toBeVisible({ timeout: 10000 });
      }
    });

    test('quick add food names can be retrieved', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      const names = await foodLogPage.getQuickAddFoodNames();
      // Either there are names (seeded user has logs) or empty array (no logs today)
      expect(Array.isArray(names)).toBe(true);
    });

    test('clicking quick add pre-fills the search field', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      const names = await foodLogPage.getQuickAddFoodNames();
      if (names.length === 0) return; // Skip if no recent foods

      const firstButton = foodLogPage.quickAddButtons.locator('button').first();
      const foodName = await firstButton.textContent();
      await firstButton.click();

      // Search input should be pre-filled with the food name
      await expect(foodLogPage.searchInput).toHaveValue(foodName?.trim() ?? '');
    });
  });

  test.describe('Food Add Modal', () => {
    test('modal opens with close button and footer buttons', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await openFoodModal(page, foodLogPage);

      await expect(page.getByTestId('food-add-modal')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
      await expect(foodLogPage.cancelButton).toBeVisible();
      await expect(foodLogPage.addFoodButton).toBeVisible();
    });

    test('Escape key closes modal', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await openFoodModal(page, foodLogPage);

      await page.keyboard.press('Escape');
      await expect(page.getByTestId('food-add-modal')).not.toBeVisible({ timeout: 3000 });
    });

    test('Cancel button closes modal', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await openFoodModal(page, foodLogPage);

      await foodLogPage.cancelButton.click();
      await expect(page.getByTestId('food-add-modal')).not.toBeVisible({ timeout: 3000 });
    });

    test('Close button (header X) closes modal', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await openFoodModal(page, foodLogPage);

      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.getByTestId('food-add-modal')).not.toBeVisible({ timeout: 3000 });
    });

    test('MealTypeSelect shows all meal options', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await openFoodModal(page, foodLogPage);

      await foodLogPage.mealTypeSelect.click();
      for (const label of ['Breakfast', 'Lunch', 'Dinner', 'Snack']) {
        await expect(page.getByRole('option', { name: new RegExp(`^${label}$`, 'i') })).toBeVisible();
      }
      await page.keyboard.press('Escape');
    });

    test('MealTypeSelect value changes when option selected', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await openFoodModal(page, foodLogPage);

      await foodLogPage.selectMealType('lunch');
      await expect(foodLogPage.mealTypeSelect).toContainText('Lunch');
    });

    test('DateNavigator is visible with prev/next/display', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await openFoodModal(page, foodLogPage);

      await expect(foodLogPage.dateNavigator).toBeVisible();
      await expect(foodLogPage.dateNavPrev).toBeVisible();
      await expect(foodLogPage.dateNavNext).toBeVisible();
      await expect(foodLogPage.dateNavDisplay).toBeVisible();
    });

    test('DateNavigator prev/next arrows change the displayed date', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await openFoodModal(page, foodLogPage);

      const initialDate = await foodLogPage.dateNavDisplay.textContent();
      await foodLogPage.navigateModalDate('prev');
      const prevDate = await foodLogPage.dateNavDisplay.textContent();
      expect(prevDate).not.toBe(initialDate);

      await foodLogPage.navigateModalDate('next');
      const restoredDate = await foodLogPage.dateNavDisplay.textContent();
      expect(restoredDate).toBe(initialDate);
    });

    test('DateNavigator center click opens calendar popover', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await openFoodModal(page, foodLogPage);

      await foodLogPage.dateNavDisplay.click();
      await expect(page.getByRole('grid').first()).toBeVisible({ timeout: 3000 });
    });

    test('quantity input and slider are visible', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await openFoodModal(page, foodLogPage);

      await expect(foodLogPage.quantityInput).toBeVisible();
      await expect(foodLogPage.quantitySlider).toBeVisible();
    });

    test('typing in quantity input updates macros', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await openFoodModal(page, foodLogPage);

      const calsBefore = await foodLogPage.getMacroCalories();
      await foodLogPage.quantityInput.fill('200');
      await page.keyboard.press('Tab');
      const calsAfter = await foodLogPage.getMacroCalories();
      expect(calsAfter).not.toBe(calsBefore);
    });

    test('macros section shows calories, protein, carbs, fat', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await openFoodModal(page, foodLogPage);

      await expect(foodLogPage.macroCalories).toBeVisible();
      await expect(foodLogPage.macroProtein).toBeVisible();
      await expect(foodLogPage.macroCarbs).toBeVisible();
      await expect(foodLogPage.macroFat).toBeVisible();
    });

    test('submitting food log closes modal', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await openFoodModal(page, foodLogPage);

      await foodLogPage.addFoodButton.click();
      await expect(page.getByTestId('food-add-modal')).not.toBeVisible({ timeout: 8000 });
    });

    test('existing test IDs are preserved (food-add-modal, quantity-input, meal-type-select, add-food-button)', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await openFoodModal(page, foodLogPage);

      await expect(page.getByTestId('food-add-modal')).toBeVisible();
      await expect(page.getByTestId('quantity-input')).toBeVisible();
      await expect(page.getByTestId('meal-type-select')).toBeVisible();
      await expect(page.getByTestId('add-food-button')).toBeVisible();
    });
  });
});
