import { expect, test } from '@playwright/test';
import { AUTH_FILES } from './fixtures/test-data';
import { typeFoodSearch } from './helpers/food-search';

test.describe('Food log (golden path)', () => {
  test.use({ storageState: AUTH_FILES.foodLog });

  test('search seeded food → add → row appears', async ({ page }) => {
    await page.goto('/food-log', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('food-search-input')).toBeVisible({ timeout: 20_000 });

    const logRows = page.locator('[data-testid^="food-log-"]');
    const before = await logRows.count();

    // Uses real seeded catalog (Apple, Chicken, Eggs) — no mocked food IDs.
    await typeFoodSearch(page, 'apple');
    await page.getByTestId('food-result-item').first().click();

    await expect(page.getByTestId('food-add-modal')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('add-food-button').click();

    await expect(logRows).toHaveCount(before + 1, { timeout: 20_000 });
  });
});
