import { expect, type Page } from '@playwright/test';

/** Wait for debounced search + results (landing or in-app). */
export async function typeFoodSearch(
  page: Page,
  query: string,
  opts?: { inputTestId?: string },
) {
  const inputTestId = opts?.inputTestId ?? 'food-search-input';
  const searchInput = page.getByTestId(inputTestId);

  await expect(searchInput).toBeVisible({ timeout: 20_000 });
  await searchInput.click();
  // pressSequentially avoids a race where fill() triggers outside-click handlers that close the dropdown.
  await searchInput.pressSequentially(query, { delay: 40 });

  if (query.length >= 3) {
    await Promise.race([
      page.getByTestId('food-result-item').first().waitFor({ state: 'visible', timeout: 25_000 }),
      page.getByTestId('search-empty').waitFor({ state: 'visible', timeout: 25_000 }),
      page.getByTestId('search-error').waitFor({ state: 'visible', timeout: 25_000 }),
    ]);
  } else {
    await page.waitForTimeout(300);
  }
}

/** Landing search sits below the fold; scroll before interacting. */
export async function typeLandingFoodSearch(page: Page, query: string) {
  await page.getByTestId('landing-search-section').scrollIntoViewIfNeeded();
  await typeFoodSearch(page, query);
}
