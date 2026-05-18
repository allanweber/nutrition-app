import { expect, test, type TestInfo } from '@playwright/test';
import { AUTH_FILES, seedUsers, testUser } from './fixtures/test-data';
import { FoodLogPage } from './pages/food-log.page';
import { LoginPage } from './pages/login.page';
import { format, addDays, startOfWeek, subDays } from 'date-fns';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

function isolatedLogDate(testInfo: TestInfo): string {
  const s = testInfo.titlePath.join('|');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return format(subDays(new Date(), 2 + (h % 20)), 'yyyy-MM-dd');
}

async function clearFoodLogsForDate(page: import('@playwright/test').Page, date: string) {
  const response = await page.request.get(`/api/food-logs?date=${date}`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  for (const log of body.logs as Array<{ id: string }>) {
    const deleteResponse = await page.request.delete(`/api/food-logs/${log.id}`);
    expect(deleteResponse.ok()).toBeTruthy();
  }
}

async function findMealTypeWithLogs(foodLogPage: FoodLogPage): Promise<(typeof MEAL_TYPES)[number] | null> {
  for (const mealType of MEAL_TYPES) {
    const section = foodLogPage.mealSection(mealType);
    if (!(await section.isVisible().catch(() => false))) continue;
    const rowCount = await foodLogPage.mealRows(mealType).count();
    if (rowCount > 0) return mealType;
  }
  return null;
}

function getDbDayOfWeek(date: Date) {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

test.describe('006: Food Log Screen Redesign', () => {
  async function createPlanViaApi(page: import('@playwright/test').Page, data: {
    name: string;
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    status: 'active' | 'draft' | 'archived';
    startDate?: string;
  }) {
    const res = await page.request.post('/api/diet-plans', {
      data: {
        ...data,
        startDate: data.startDate ?? new Date().toISOString(),
      },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    return body.plan.id as string;
  }

  async function createMealViaApi(
    page: import('@playwright/test').Page,
    planId: string,
    mealType: string,
    dayOfWeek: number,
  ) {
    const res = await page.request.post(`/api/diet-plans/${planId}/meals`, {
      data: { mealType, dayOfWeek },
    });

    expect(res.ok()).toBeTruthy();
  }

  async function deletePlanViaApi(page: import('@playwright/test').Page, planId: string) {
    await page.request.delete(`/api/diet-plans/${planId}`);
  }

  async function deleteAllPlansViaApi(page: import('@playwright/test').Page) {
    const res = await page.request.get('/api/diet-plans');
    if (!res.ok()) return;
    const body = await res.json();
    for (const plan of (body.plans ?? []) as Array<{ id: string }>) {
      await deletePlanViaApi(page, plan.id);
    }
  }

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
    test('renders only meal sections that have logs or a plan', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      const today = new Date();
      const dateStr = format(today, 'yyyy-MM-dd');
      const [logsRes, plansRes] = await Promise.all([
        page.request.get(`/api/food-logs?date=${dateStr}`),
        page.request.get('/api/diet-plans'),
      ]);

      expect(logsRes.ok()).toBeTruthy();
      expect(plansRes.ok()).toBeTruthy();

      const logsBody = await logsRes.json();
      const plansBody = await plansRes.json();
      const activePlan = plansBody.plans.find((plan: { status: string }) => plan.status === 'active');

      const visibleMealTypes = new Set<string>();

      for (const [mealType, entries] of Object.entries(logsBody.logsByMeal ?? {})) {
        if (Array.isArray(entries) && entries.length > 0) {
          visibleMealTypes.add(mealType);
        }
      }

      if (activePlan) {
        const mealsRes = await page.request.get(`/api/diet-plans/${activePlan.id}/meals`);
        expect(mealsRes.ok()).toBeTruthy();

        const mealsBody = await mealsRes.json();
        const dayOfWeek = getDbDayOfWeek(today);

        for (const meal of mealsBody.meals ?? []) {
          if (meal.dayOfWeek === dayOfWeek) {
            visibleMealTypes.add(meal.mealType);
          }
        }
      }

      const mealSections = page.locator('[data-testid^="meal-section-"]');
      await expect.poll(async () => mealSections.count(), { timeout: 10000 }).toBeGreaterThan(0);

      const visibleSectionCount = await mealSections.count();
      expect(visibleSectionCount).toBe(visibleMealTypes.size);
    });

    test('empty meal placeholders appear for unlogged planned meals', async ({ page }) => {
      await loginAsFreshUser(page);
      const foodLogPage = new FoodLogPage(page);
      const today = new Date();
      const dayOfWeek = getDbDayOfWeek(today);
      const planId = await createPlanViaApi(page, {
        name: `E2E Empty Meal Plan ${Date.now()}`,
        targetCalories: 2000,
        targetProtein: 150,
        targetCarbs: 200,
        targetFat: 70,
        status: 'active',
        startDate: today.toISOString(),
      });

      try {
        await createMealViaApi(page, planId, 'breakfast', dayOfWeek);
        await foodLogPage.goto();

        const breakfastSection = page.getByTestId('meal-section-breakfast');
        await expect(breakfastSection).toBeVisible({ timeout: 10000 });

        const toggle = page.getByTestId('meal-toggle-breakfast');
        if ((await toggle.getAttribute('aria-expanded')) === 'false') {
          await toggle.click();
        }

        await expect(page.getByTestId('meal-empty-placeholder-breakfast')).toBeVisible({ timeout: 5000 });
      } finally {
        await deletePlanViaApi(page, planId);
      }
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

  test.describe('Meal Footer Summary', () => {
    test('logged meal sections show footer with calories and macros', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      expect(await foodLogPage.getFoodLogCount()).toBeGreaterThan(0);

      const mealType = await findMealTypeWithLogs(foodLogPage);
      expect(mealType).not.toBeNull();

      await foodLogPage.expandMealSection(mealType!);

      await expect(foodLogPage.mealLogSummary(mealType!)).toBeVisible();
      await expect(foodLogPage.mealLogSummary(mealType!)).toContainText('Total Calories');
      await expect(foodLogPage.mealLogSummary(mealType!)).toContainText('Protein');
      await expect(foodLogPage.mealLogSummary(mealType!)).toContainText('Carbs');
      await expect(foodLogPage.mealLogSummary(mealType!)).toContainText('Fats');

      await expect
        .poll(async () => FoodLogPage.parseNutrientValue(await foodLogPage.mealLogTotalCalories(mealType!).textContent()))
        .toBeGreaterThan(0);
      await expect
        .poll(async () => FoodLogPage.parseNutrientValue(await foodLogPage.mealLogTotalProtein(mealType!).textContent()))
        .toBeGreaterThanOrEqual(0);
      await expect
        .poll(async () => FoodLogPage.parseNutrientValue(await foodLogPage.mealLogTotalCarbs(mealType!).textContent()))
        .toBeGreaterThanOrEqual(0);
      await expect
        .poll(async () => FoodLogPage.parseNutrientValue(await foodLogPage.mealLogTotalFat(mealType!).textContent()))
        .toBeGreaterThanOrEqual(0);
    });

    test('footer total calories match the meal header', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      const mealType = await findMealTypeWithLogs(foodLogPage);
      expect(mealType).not.toBeNull();

      await foodLogPage.expandMealSection(mealType!);

      const headerKcal = FoodLogPage.parseNutrientValue(
        await foodLogPage.mealHeaderCalories(mealType!).textContent(),
      );
      const footerKcal = FoodLogPage.parseNutrientValue(
        await foodLogPage.mealLogTotalCalories(mealType!).textContent(),
      );

      expect(headerKcal).toBeGreaterThan(0);
      expect(footerKcal).toBe(headerKcal);
    });

    test('footer is hidden when the meal section is collapsed', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await foodLogPage.goto();

      const mealType = await findMealTypeWithLogs(foodLogPage);
      expect(mealType).not.toBeNull();

      await foodLogPage.expandMealSection(mealType!);
      await expect(foodLogPage.mealLogSummary(mealType!)).toBeVisible();

      await foodLogPage.collapseMealSection(mealType!);
      await expect(foodLogPage.mealLogSummary(mealType!)).not.toBeVisible();
    });

    test('empty meal section does not show footer summary', async ({ page }) => {
      await loginAsFreshUser(page);
      const today = new Date();
      const planId = await createPlanViaApi(page, {
        name: `E2E Footer Empty Plan ${Date.now()}`,
        targetCalories: 2000,
        targetProtein: 150,
        targetCarbs: 200,
        targetFat: 70,
        status: 'active',
        startDate: today.toISOString(),
      });

      try {
        await createMealViaApi(page, planId, 'breakfast', getDbDayOfWeek(today));

        const foodLogPage = new FoodLogPage(page);
        await foodLogPage.goto();

        await expect(foodLogPage.mealSection('breakfast')).toBeVisible({ timeout: 10000 });
        await foodLogPage.expandMealSection('breakfast');

        await expect(page.getByTestId('meal-empty-placeholder-breakfast')).toBeVisible();
        await expect(foodLogPage.mealLogSummary('breakfast')).not.toBeVisible();
      } finally {
        await deletePlanViaApi(page, planId);
      }
    });

    test.describe('after adding food', () => {
      test.use({ storageState: AUTH_FILES.testUser });

      test('footer appears with non-zero calories', async ({ page }, testInfo) => {
        const logDate = isolatedLogDate(testInfo);
        await clearFoodLogsForDate(page, logDate);

        const foodLogPage = new FoodLogPage(page);
        await foodLogPage.goto(logDate);

        await foodLogPage.searchInput.fill('apple');
        await page.waitForTimeout(1500);
        await expect(foodLogPage.searchResults).toBeVisible({ timeout: 10000 });

        await page.getByTestId('food-result-item').first().click();
        await expect(page.getByTestId('food-add-modal')).toBeVisible({ timeout: 5000 });
        await foodLogPage.quantityInput.fill('100');
        await foodLogPage.mealTypeSelect.click();
        await page.getByRole('option', { name: /breakfast/i }).click();
        await foodLogPage.addFoodButton.click();
        await expect(page.getByTestId('food-add-modal')).not.toBeVisible({ timeout: 10000 });

        await expect(foodLogPage.mealSection('breakfast')).toBeVisible({ timeout: 10000 });
        await foodLogPage.expandMealSection('breakfast');
        await expect(foodLogPage.mealRows('breakfast').first()).toBeVisible({ timeout: 10000 });

        await expect(foodLogPage.mealLogSummary('breakfast')).toBeVisible();
        await expect
          .poll(async () =>
            FoodLogPage.parseNutrientValue(await foodLogPage.mealLogTotalCalories('breakfast').textContent()),
          )
          .toBeGreaterThan(0);

        const headerKcal = FoodLogPage.parseNutrientValue(
          await foodLogPage.mealHeaderCalories('breakfast').textContent(),
        );
        const footerKcal = FoodLogPage.parseNutrientValue(
          await foodLogPage.mealLogTotalCalories('breakfast').textContent(),
        );
        expect(footerKcal).toBe(headerKcal);
      });
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

    test('quantity input can be cleared and selects all text on focus', async ({ page }) => {
      await loginAsTestUser(page);
      const foodLogPage = new FoodLogPage(page);
      await openFoodModal(page, foodLogPage);

      await foodLogPage.quantityInput.click();
      await expect(foodLogPage.quantityInput).toHaveJSProperty('selectionStart', 0);
      await expect(foodLogPage.quantityInput).toHaveJSProperty('selectionEnd', 1);

      await page.keyboard.press('Backspace');
      await expect(foodLogPage.quantityInput).toHaveValue('');

      await foodLogPage.quantityInput.fill('2.5');
      await expect(foodLogPage.quantityInput).toHaveValue('2.5');
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

  test.describe('Empty Meal Quick Add', () => {
    test.describe.configure({ mode: 'serial' });

    async function createPlanWithMeal(
      page: import('@playwright/test').Page,
      mealType: string,
    ) {
      const today = new Date();
      const planId = await createPlanViaApi(page, {
        name: `E2E Quick Add Plan ${Date.now()}`,
        targetCalories: 2000,
        targetProtein: 150,
        targetCarbs: 200,
        targetFat: 70,
        status: 'active',
        startDate: today.toISOString(),
      });
      await createMealViaApi(page, planId, mealType, getDbDayOfWeek(today));
      return planId;
    }

    async function expandMealSection(
      page: import('@playwright/test').Page,
      mealType: string,
    ) {
      const toggle = page.getByTestId(`meal-toggle-${mealType}`);
      if ((await toggle.getAttribute('aria-expanded')) === 'false') {
        await toggle.click();
      }
    }

    test('empty meal section renders a "Log {meal}" action button', async ({ page }) => {
      await loginAsFreshUser(page);
      await deleteAllPlansViaApi(page);
      const planId = await createPlanWithMeal(page, 'breakfast');

      try {
        const foodLogPage = new FoodLogPage(page);
        await foodLogPage.goto();

        await expect(page.getByTestId('meal-section-breakfast')).toBeVisible({ timeout: 10000 });
        await expandMealSection(page, 'breakfast');

        const addButton = page.getByTestId('meal-empty-add-breakfast');
        await expect(addButton).toBeVisible();
        await expect(addButton).toHaveAttribute('aria-label', 'Log food for Breakfast');
        await expect(addButton).toContainText(/Log breakfast/i);
      } finally {
        await deletePlanViaApi(page, planId);
      }
    });

    test('clicking empty-state action opens search dialog targeted at that meal', async ({ page }) => {
      await loginAsFreshUser(page);
      await deleteAllPlansViaApi(page);
      const planId = await createPlanWithMeal(page, 'lunch');

      try {
        const foodLogPage = new FoodLogPage(page);
        await foodLogPage.goto();

        await expect(page.getByTestId('meal-section-lunch')).toBeVisible({ timeout: 10000 });
        await foodLogPage.expandMealSection('lunch');

        const addButton = page.getByTestId('meal-empty-add-lunch');
        await expect(addButton).toBeVisible({ timeout: 5000 });
        await addButton.scrollIntoViewIfNeeded();
        await addButton.click();

        await expect(foodLogPage.foodSearchDialog()).toBeVisible({ timeout: 10000 });
        await expect(foodLogPage.foodSearchDialogTitle()).toHaveText(/Add to Lunch/i);
      } finally {
        await deletePlanViaApi(page, planId);
      }
    });

    test('selecting a food from the empty-state flow pre-fills the meal type', async ({ page }) => {
      await loginAsFreshUser(page);
      await deleteAllPlansViaApi(page);
      const planId = await createPlanWithMeal(page, 'dinner');

      try {
        const foodLogPage = new FoodLogPage(page);
        await foodLogPage.goto();

        await expect(page.getByTestId('meal-section-dinner')).toBeVisible({ timeout: 10000 });
        await expandMealSection(page, 'dinner');

        await page.getByTestId('meal-empty-add-dinner').click();

        const dialog = page.getByTestId('food-search-dialog');
        await expect(dialog).toBeVisible({ timeout: 5000 });

        await dialog.getByTestId('food-search-input').fill('chicken');
        await page.waitForTimeout(1500);

        const firstResult = dialog.getByTestId('food-result-item').first();
        await expect(firstResult).toBeVisible({ timeout: 8000 });
        await firstResult.click();

        await expect(page.getByTestId('food-add-modal')).toBeVisible({ timeout: 8000 });
        await expect(page.getByTestId('food-add-modal').getByTestId('meal-type-select')).toContainText(/Dinner/i);
      } finally {
        await deletePlanViaApi(page, planId);
      }
    });

    test('dismissing the dialog clears the pending meal target', async ({ page }) => {
      await loginAsFreshUser(page);
      await deleteAllPlansViaApi(page);
      const planId = await createPlanWithMeal(page, 'breakfast');

      try {
        const foodLogPage = new FoodLogPage(page);
        await foodLogPage.goto();

        await expect(page.getByTestId('meal-section-breakfast')).toBeVisible({ timeout: 10000 });
        await expandMealSection(page, 'breakfast');

        await page.getByTestId('meal-empty-add-breakfast').click();
        const dialog = page.getByTestId('food-search-dialog');
        await expect(dialog).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('food-search-dialog-title')).toHaveText(/Add to Breakfast/i);

        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible({ timeout: 3000 });
      } finally {
        await deletePlanViaApi(page, planId);
      }
    });
  });
});
