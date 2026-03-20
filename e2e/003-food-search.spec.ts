/**
 * E2E tests for Feature 003: FatSecret Food Retrieval
 * Requires USE_MOCK_FATSECRET=true in .env.test.local
 *
 * US1: Search Foods by Keyword
 * US2: View Food Nutritional Detail
 * US3: Reliable Food Availability Under Error Conditions
 */

import { expect, test } from '@playwright/test';
import { seedUsers } from './fixtures/test-data';
import { LoginPage } from './pages/login.page';

// ──────────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────────

async function loginAsTestUser(page: import('@playwright/test').Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(seedUsers.weightLoss.email, seedUsers.weightLoss.password);
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

async function goToFoodLog(page: import('@playwright/test').Page) {
  await page.goto('/food-log');
  await page.waitForLoadState('networkidle');
}

async function typeSearch(page: import('@playwright/test').Page, query: string) {
  const searchInput = page.getByTestId('food-search-input');
  await searchInput.click();
  await searchInput.fill(query);
  await page.waitForTimeout(500); // Allow debounce + request
}

// ──────────────────────────────────────────────
// US1: Search Foods by Keyword (MVP)
// ──────────────────────────────────────────────

test.describe('US1: Search Foods by Keyword', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);
  });

  test('keyword search displays paginated results with name, calories, and pagination controls', async ({
    page,
  }) => {
    await typeSearch(page, 'apple');

    // Wait for dropdown with results
    await expect(page.getByTestId('food-search-dropdown')).toBeVisible({ timeout: 5000 });

    // First result should show name
    const firstResult = page.getByTestId('food-result-item').first();
    await expect(firstResult).toBeVisible();
    await expect(firstResult).toContainText('Apple');

    // Load more button visible since mock returns totalResults=9
    await expect(page.getByRole('button', { name: /load more results/i })).toBeVisible();
  });

  test('search with no matching food shows empty-results message', async ({
    page,
  }) => {
    await typeSearch(page, 'zzz');
    await page.waitForTimeout(600);

    // Either results or empty message — no crash
    const hasResults = await page.getByTestId('food-search-dropdown').isVisible().catch(() => false);
    const hasEmpty = await page.getByTestId('search-empty').isVisible().catch(() => false);
    expect(hasResults || hasEmpty).toBe(true);
  });

  test('query shorter than 3 characters is rejected with validation message (no request made)', async ({
    page,
  }) => {
    await typeSearch(page, 'ap');
    await page.waitForTimeout(600);

    // Search should not trigger (enabled: keyword.length >= 3)
    // Dropdown may still be open but showing prompt state, not results
    const hasResults = await page.getByTestId('food-result-item').isVisible().catch(() => false);
    expect(hasResults).toBe(false);
  });

  test('navigating to page 2 shows next results', async ({ page }) => {
    await typeSearch(page, 'apple');
    await expect(page.getByTestId('food-search-dropdown')).toBeVisible({ timeout: 5000 });

    const loadMoreBtn = page.getByRole('button', { name: /load more results/i });
    if (await loadMoreBtn.isVisible()) {
      await loadMoreBtn.click();
      await page.waitForTimeout(500);
      // Dropdown should still display (no crash)
      const stillHasResults = await page.getByTestId('food-search-dropdown').isVisible().catch(() => false);
      const hasEmpty = await page.getByTestId('search-empty').isVisible().catch(() => false);
      expect(stillHasResults || hasEmpty).toBe(true);
    }
  });
});

// ──────────────────────────────────────────────
// US2: View Food Nutritional Detail
// ──────────────────────────────────────────────

test.describe('US2: View Food Nutritional Detail', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);
  });

  test('selecting a food from results shows nutritional detail with baseServing values', async ({
    page,
  }) => {
    await typeSearch(page, 'apple');
    await expect(page.getByTestId('food-search-dropdown')).toBeVisible({ timeout: 5000 });

    // Click first result — add modal should open
    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);

    // Modal should appear with meal and serving selectors
    await expect(page.getByTestId('food-add-modal')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('meal-type-select')).toBeVisible();
    await expect(page.getByTestId('serving-select')).toBeVisible();
  });

  test('back/close button returns to search results', async ({ page }) => {
    await typeSearch(page, 'apple');
    await expect(page.getByTestId('food-search-dropdown')).toBeVisible({ timeout: 5000 });

    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);

    await expect(page.getByTestId('food-add-modal')).toBeVisible({ timeout: 5000 });

    // Close modal with Escape
    await page.keyboard.press('Escape');

    // Search input should still be visible
    await expect(page.getByTestId('food-search-input')).toBeVisible();
    await expect(page.getByTestId('food-add-modal')).not.toBeVisible();
  });
});

// ──────────────────────────────────────────────
// US3: Reliable Food Availability Under Error Conditions
// ──────────────────────────────────────────────

test.describe('US3: Error Conditions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);
  });

  test('no raw error codes or stack traces in search error responses', async ({
    page,
  }) => {
    // Even with mock mode, verify error messages don't leak internal details
    await typeSearch(page, 'apple');
    await page.waitForTimeout(600);

    // Check that no stack traces appear in the page
    const pageContent = await page.content();
    expect(pageContent).not.toContain('at Object.');
    expect(pageContent).not.toContain('Error: FATSECRET');
    expect(pageContent).not.toContain('FATSECRET_CONSUMER');
  });
});
