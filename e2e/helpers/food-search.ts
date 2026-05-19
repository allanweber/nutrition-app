import { expect, type Page } from '@playwright/test';

/** Wait for debounced search + dropdown results (landing or in-app). */
export async function typeFoodSearch(page: Page, query: string) {
  const searchInput = page.getByTestId('food-search-input');
  await searchInput.click();
  await searchInput.fill(query);
  await expect(page.getByTestId('food-search-dropdown')).toBeVisible({ timeout: 5000 });

  if (query.length >= 3) {
    await Promise.race([
      page.getByTestId('food-result-item').first().waitFor({ state: 'visible', timeout: 7000 }),
      page.getByTestId('search-empty').waitFor({ state: 'visible', timeout: 7000 }),
      page.getByTestId('search-error').waitFor({ state: 'visible', timeout: 7000 }),
    ]);
  } else {
    await page.waitForTimeout(250);
  }
}

/** Landing search sits below the fold; scroll before interacting. */
export async function typeLandingFoodSearch(page: Page, query: string) {
  await page.getByTestId('landing-search-section').scrollIntoViewIfNeeded();
  await typeFoodSearch(page, query);
}
