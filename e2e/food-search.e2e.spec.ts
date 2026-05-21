import { expect, test } from '@playwright/test';
import { AUTH_FILES } from './fixtures/test-data';
import { typeFoodSearch } from './helpers/food-search';

test.describe('Food search (golden path)', () => {
  test.use({ storageState: AUTH_FILES.foodLog });

  test('search → open add modal → close', async ({ page }) => {
    await page.route('**/api/foods/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              id: 'aaaaaaaa-aaaa-7aaa-aaaa-aaaaaaaaaaaa',
              fatSecretId: '12345',
              name: 'Apple, raw',
              brandName: null,
              foodType: 'Generic',
              thumbnail: null,
              calories: 52,
              isLocal: true,
            },
          ],
          pagination: { page: 1, totalResults: 1, maxResults: 10 },
        }),
      });
    });

    await page.route('**/api/foods/detail*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          food: {
            id: 'aaaaaaaa-aaaa-7aaa-aaaa-aaaaaaaaaaaa',
            name: 'Apple, raw',
            brandName: null,
            foodType: 'Generic',
            foodUrl: null,
            baseServing: {
              calories: 52,
              protein: 0.3,
              carbs: 13.8,
              fat: 0.2,
              fiber: 2.4,
              sugar: 10.4,
              sodium: 1,
            },
            servings: [],
            images: null,
          },
        }),
      });
    });

    await page.goto('/food-log', { waitUntil: 'domcontentloaded' });
    await typeFoodSearch(page, 'apple');
    await page.getByTestId('food-result-item').first().click();

    await expect(page.getByTestId('food-add-modal')).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('food-add-modal')).not.toBeVisible();
  });
});
