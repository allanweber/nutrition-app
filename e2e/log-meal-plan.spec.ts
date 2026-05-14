import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { addDays, format, startOfWeek } from 'date-fns';
import { AUTH_FILES } from './fixtures/test-data';
import { FoodLogPage } from './pages/food-log.page';

function plannerDateForTest(testInfo: TestInfo): string {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const s = testInfo.titlePath.join('|');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  // App `getDbDayOfWeek` uses ISO Mon=1 … Sun=7. Seeded weight-loss plan rows use 1–6 only
  // (dayOfWeek=0 in seed is unused; nothing is stored as 7). Avoid Sunday so the day has plan slots.
  return format(addDays(monday, h % 6), 'yyyy-MM-dd');
}

async function freezeClientTimeAfter18(page: Page, dateStr: string) {
  await page.addInitScript(({ isoString }) => {
    const RealDate = Date;
    const fixedTime = new RealDate(isoString);

    class MockDate extends RealDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(fixedTime.getTime());
          return;
        }

        super(...(args as ConstructorParameters<typeof Date>));
      }

      static now() {
        return fixedTime.getTime();
      }
    }

    MockDate.parse = RealDate.parse;
    MockDate.UTC = RealDate.UTC;
    MockDate.prototype = RealDate.prototype;
    // @ts-expect-error overriding Date in the browser for deterministic E2E coverage
    window.Date = MockDate;
    // @ts-expect-error overriding Date in the browser for deterministic E2E coverage
    globalThis.Date = MockDate;
  }, { isoString: `${dateStr}T19:00:00` });
}

async function clearBannerDismissState(page: Page) {
  await page.evaluate(() => {
    const keysToRemove: string[] = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith('vitalis-plan-banner-')) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  });
}

async function clearFoodLogsForDate(page: Page, date: string) {
  const response = await page.request.get(`/api/food-logs?date=${date}`);
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  for (const log of body.logs as Array<{ id: string }>) {
    const deleteResponse = await page.request.delete(`/api/food-logs/${log.id}`);
    expect(deleteResponse.ok()).toBeTruthy();
  }
}

test.describe('Meal planner integration banner and actions', () => {
  test.use({ storageState: AUTH_FILES.testUser });

  test.beforeEach(async ({ page }) => {
    const plannerDate = plannerDateForTest(test.info());
    const foodLogPage = new FoodLogPage(page);
    await freezeClientTimeAfter18(page, plannerDate);
    await foodLogPage.goto(plannerDate);
    await clearBannerDismissState(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('shows the planner banner and persists dismissal for the selected date', async ({ page }) => {
    const plannerDate = plannerDateForTest(test.info());
    const foodLogPage = new FoodLogPage(page);
    await clearFoodLogsForDate(page, plannerDate);
    await foodLogPage.goto(plannerDate);
    await clearBannerDismissState(page);
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(foodLogPage.mealPlanBanner).toBeVisible();
    await expect(foodLogPage.mealPlanBanner).toContainText(/balanced weight loss/i);

    await foodLogPage.mealPlanBannerDismiss.click();
    await expect(foodLogPage.mealPlanBanner).not.toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(foodLogPage.mealPlanBanner).not.toBeVisible();
  });

  test('add-all logs the plan and hides planner prompts once covered', async ({ page }) => {
    const plannerDate = plannerDateForTest(test.info());
    const foodLogPage = new FoodLogPage(page);
    await foodLogPage.goto(plannerDate);
    await clearBannerDismissState(page);
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(foodLogPage.mealPlanBanner).toBeVisible();
    await foodLogPage.logAllMealsButton.click();
    await expect(foodLogPage.logMealsModal).toBeVisible();
    await expect(foodLogPage.logMealsModal).toContainText(/select one of the options above to continue\./i);
    await foodLogPage.logMealsAddButton.click();
    await expect(foodLogPage.logMealsModal).not.toBeVisible({ timeout: 10000 });

    const firstRowCount = await page.locator('[data-testid^="food-log-"]').count();
    expect(firstRowCount).toBeGreaterThan(0);

    await expect(foodLogPage.mealPlanBanner).not.toBeVisible();
    await expect(page.locator('[data-testid^="meal-plan-addon-"]')).toHaveCount(0);
  });

  test('per-meal log plan hides that meal addon once planned foods are logged', async ({ page }) => {
    const plannerDate = plannerDateForTest(test.info());
    const foodLogPage = new FoodLogPage(page);
    await foodLogPage.goto(plannerDate);
    await clearBannerDismissState(page);
    await page.reload();
    await page.waitForLoadState('networkidle');

    const addon = page.locator('[data-testid^="meal-plan-addon-"]').first();
    await expect(addon).toBeVisible();

    const addonTestId = await addon.getAttribute('data-testid');
    const mealType = addonTestId?.replace('meal-plan-addon-', '');

    expect(mealType).toBeTruthy();

    await foodLogPage.logPlanButton(mealType!).click();
    await expect.poll(async () => foodLogPage.mealRows(mealType!).count(), { timeout: 10000 }).toBeGreaterThan(0);
    await expect(page.locator(`[data-testid="meal-plan-addon-${mealType}"]`)).toHaveCount(0);
  });
});

test.describe('Meal planner integration without active plan', () => {
  test.use({ storageState: AUTH_FILES.generalHealth });

  test('does not show the banner or meal addons', async ({ page }) => {
    const plannerMonday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const foodLogPage = new FoodLogPage(page);
    await foodLogPage.goto(plannerMonday);

    await expect(foodLogPage.mealPlanBanner).not.toBeVisible();
    await expect(page.locator('[data-testid^="meal-plan-addon-"]')).toHaveCount(0);
  });
});