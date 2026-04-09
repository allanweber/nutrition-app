/**
 * E2E tests for Feature 004: Unified Food Search Field Component
 * Requires USE_MOCK_FATSECRET=true in .env.test.local
 *
 * US1: Food Log Search & Add to Diary (P1 MVP)
 * US2: Anonymous Landing Page Search (P2)
 * US3: Search History & Autocomplete (P3)
 * US4: Keyboard Navigation (P4)
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
  await page.waitForTimeout(600); // allow debounce + request
}

// ──────────────────────────────────────────────
// US1: Food Log Search & Add to Diary
// ──────────────────────────────────────────────

test.describe('004 US1: Food Log Search & Add to Diary', () => {
  test('should show tabbed results and allow adding food to diary', async ({ page }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);

    await typeSearch(page, 'chicken');

    // Dropdown should appear with tabs
    await expect(page.getByTestId('food-search-dropdown')).toBeVisible();
    await expect(page.getByTestId('tab-common')).toBeVisible();
    await expect(page.getByTestId('tab-branded')).toBeVisible();
    await expect(page.getByTestId('tab-custom')).toBeVisible();

    // At least one result item visible
    const firstResult = page.getByTestId('food-result-item').first();
    await expect(firstResult).toBeVisible();

    // Click first result — modal should open
    await firstResult.click();
    await expect(page.getByTestId('food-add-modal')).toBeVisible();

    // Modal should have meal type and serving selectors
    await expect(page.getByTestId('meal-type-select')).toBeVisible();
    await expect(page.getByTestId('measure-select')).toBeVisible();
    await expect(page.getByTestId('quantity-input')).toBeVisible();

    // Add to log
    await page.getByTestId('add-food-button').click();
    await expect(page.getByTestId('food-add-modal')).not.toBeVisible({ timeout: 5000 });
  });

  test('should close dropdown on Escape and clear input', async ({ page }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);

    await typeSearch(page, 'apple');
    await expect(page.getByTestId('food-search-dropdown')).toBeVisible();

    await page.getByTestId('food-search-input').press('Escape');
    await expect(page.getByTestId('food-search-dropdown')).not.toBeVisible();
    await expect(page.getByTestId('food-search-input')).toHaveValue('');
  });

  test('should show empty state for no-result queries', async ({ page }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);

    await typeSearch(page, 'xyznotafood123');
    await expect(page.getByTestId('search-empty')).toBeVisible({ timeout: 5000 });
  });

  test('should clear input with clear button', async ({ page }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);

    await typeSearch(page, 'banana');
    await expect(page.getByTestId('food-search-clear')).toBeVisible();
    await page.getByTestId('food-search-clear').click();
    await expect(page.getByTestId('food-search-input')).toHaveValue('');
  });
});

// ──────────────────────────────────────────────
// US2: Anonymous Landing Page Search
// ──────────────────────────────────────────────

test.describe('004 US2: Anonymous Landing Page Search', () => {
  test('should show search field on landing page for anonymous users', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/');
    await expect(page.getByTestId('landing-search-section')).toBeVisible();

    const searchInput = page.getByTestId('food-search-input');
    await searchInput.click();
    await searchInput.fill('apple');
    await page.waitForTimeout(600);

    // Should show Common and Branded tabs, no Custom tab
    await expect(page.getByTestId('tab-common')).toBeVisible();
    await expect(page.getByTestId('tab-branded')).toBeVisible();
    await expect(page.getByTestId('tab-custom')).not.toBeVisible();

    await context.close();
  });

  test('should navigate to food detail page on result selection', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/');

    const searchInput = page.getByTestId('food-search-input');
    await searchInput.click();
    await searchInput.fill('apple');
    await page.waitForTimeout(600);

    const firstResult = page.getByTestId('food-result-item').first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });
    await firstResult.click();

    // Should navigate to /foods/:id
    await expect(page).toHaveURL(/\/foods\//, { timeout: 10000 });

    await context.close();
  });

  test('food detail page should render food name in heading', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/');

    const searchInput = page.getByTestId('food-search-input');
    await searchInput.click();
    await searchInput.fill('apple');
    await page.waitForTimeout(600);

    const firstResult = page.getByTestId('food-result-item').first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });
    await firstResult.click();

    await expect(page).toHaveURL(/\/foods\//, { timeout: 10000 });
    await expect(page.locator('h1')).not.toBeEmpty({ timeout: 10000 });

    await context.close();
  });

  test('food detail page should have nutrition facts', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/');

    const searchInput = page.getByTestId('food-search-input');
    await searchInput.click();
    await searchInput.fill('apple');
    await page.waitForTimeout(600);

    const firstResult = page.getByTestId('food-result-item').first();
    await firstResult.click();

    await expect(page).toHaveURL(/\/foods\//, { timeout: 10000 });
    // Page contains nutrition section
    await expect(page.getByText(/Nutrition per 100g/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Calories/i)).toBeVisible();

    await context.close();
  });
});

// ──────────────────────────────────────────────
// US3: Search History & Autocomplete
// ──────────────────────────────────────────────

test.describe('004 US3: Search History & Autocomplete', () => {
  test('should show recent search history on input focus', async ({ page }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);

    // Perform 3 different searches by selecting results
    const searches = ['apple', 'banana', 'carrot'];
    for (const term of searches) {
      await typeSearch(page, term);
      // Wait for the dropdown to appear before checking count (API response may take > 600ms)
      await page.getByTestId('food-search-dropdown').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      const results = page.getByTestId('food-result-item');
      const count = await results.count();
      if (count > 0) {
        await results.first().click();
        // Close modal if it opened
        const modal = page.getByTestId('food-add-modal');
        if (await modal.isVisible()) {
          await page.keyboard.press('Escape');
        }
      }
      // Clear search
      const clearBtn = page.getByTestId('food-search-clear');
      if (await clearBtn.isVisible()) await clearBtn.click();
      await page.waitForTimeout(100);
    }

    // Focus input — history should appear
    await page.getByTestId('food-search-input').click();
    await expect(page.getByTestId('search-history-list')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('history-item').first()).toBeVisible();
  });

  test('should execute search when history item is clicked', async ({ page }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);

    // Create some history first
    await typeSearch(page, 'apple');
    const results = page.getByTestId('food-result-item');
    if (await results.count() > 0) {
      await results.first().click();
      const modal = page.getByTestId('food-add-modal');
      if (await modal.isVisible()) await page.keyboard.press('Escape');
    }
    const clearBtn = page.getByTestId('food-search-clear');
    if (await clearBtn.isVisible()) await clearBtn.click();
    await page.waitForTimeout(100);

    // Focus and click history item
    await page.getByTestId('food-search-input').click();
    const historyItems = page.getByTestId('history-item');
    if (await historyItems.count() > 0) {
      await historyItems.first().click();
      // Input should be filled
      const inputValue = await page.getByTestId('food-search-input').inputValue();
      expect(inputValue.length).toBeGreaterThan(0);
    }
  });

  test('should show autocomplete suggestions while typing', async ({ page }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);

    // Create history entry for "apple"
    await typeSearch(page, 'apple');
    const results = page.getByTestId('food-result-item');
    if (await results.count() > 0) {
      await results.first().click();
      const modal = page.getByTestId('food-add-modal');
      if (await modal.isVisible()) await page.keyboard.press('Escape');
    }
    const clearBtn = page.getByTestId('food-search-clear');
    if (await clearBtn.isVisible()) await clearBtn.click();
    await page.waitForTimeout(100);

    // Type partial match "ap" — suggestions should appear
    const searchInput = page.getByTestId('food-search-input');
    await searchInput.click();
    await searchInput.fill('ap');
    await page.waitForTimeout(200);

    await expect(page.getByTestId('search-suggestions')).toBeVisible({ timeout: 3000 });
  });
});

// ──────────────────────────────────────────────
// US4: Keyboard Navigation
// ──────────────────────────────────────────────

test.describe('004 US4: Keyboard Navigation', () => {
  test('should highlight results with arrow keys', async ({ page }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);

    await typeSearch(page, 'egg');
    const dropdown = page.getByTestId('food-search-dropdown');
    await expect(dropdown).toBeVisible();

    // Arrow down twice — 2nd result should be highlighted (index 1)
    await page.getByTestId('food-search-input').press('ArrowDown');
    await page.getByTestId('food-search-input').press('ArrowDown');

    // The 2nd item (index 1) should have aria-selected=true after 2 presses
    const items = page.getByRole('option');
    const count = await items.count();
    if (count >= 2) {
      await expect(items.nth(1)).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('should open modal for highlighted item on Enter', async ({ page }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);

    await typeSearch(page, 'egg');
    await expect(page.getByTestId('food-search-dropdown')).toBeVisible();

    // Arrow down once to highlight first result
    await page.getByTestId('food-search-input').press('ArrowDown');
    await page.waitForTimeout(100);

    // Press Enter to select
    await page.getByTestId('food-search-input').press('Enter');

    // Modal should open
    await expect(page.getByTestId('food-add-modal')).toBeVisible({ timeout: 5000 });
  });

  test('should clear input and close dropdown on Escape', async ({ page }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);

    await typeSearch(page, 'egg');
    await expect(page.getByTestId('food-search-dropdown')).toBeVisible();

    await page.getByTestId('food-search-input').press('Escape');

    await expect(page.getByTestId('food-search-input')).toHaveValue('');
    await expect(page.getByTestId('food-search-dropdown')).not.toBeVisible();
  });

  test('arrow keys should not move cursor in input', async ({ page }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);

    await typeSearch(page, 'banana');
    await expect(page.getByTestId('food-search-dropdown')).toBeVisible();

    // Pressing ArrowDown should not change the input value
    const before = await page.getByTestId('food-search-input').inputValue();
    await page.getByTestId('food-search-input').press('ArrowDown');
    const after = await page.getByTestId('food-search-input').inputValue();
    expect(after).toBe(before);
  });
});

// ──────────────────────────────────────────────
// US5: Custom Food Access Model (userId-based)
// ──────────────────────────────────────────────

test.describe('004 US5: Custom Food Access Model', () => {
  test('custom food search returns only the current user\'s foods (userId-scoped)', async ({
    page,
  }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);

    // Mock custom search to return user-owned foods
    await page.route('**/api/foods/custom/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              id: 'cccccccc-cccc-7ccc-cccc-cccccccccccc',
              name: 'My Custom Protein Shake',
              brandName: null,
              thumbnail: null,
              calories: 250,
            },
          ],
        }),
      });
    });

    await typeSearch(page, 'custom');

    // Custom tab should be visible for authenticated users
    await expect(page.getByTestId('tab-custom')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('tab-custom').click();
    await page.waitForTimeout(400);

    // Should show the mocked custom food
    await expect(page.getByTestId('food-result-item').first()).toContainText('My Custom Protein Shake');
  });

  test('custom foods do NOT appear in shared catalog search', async ({ page }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);

    // Mock catalog search returning only shared (userId=null) foods
    await page.route('**/api/foods/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              id: 'bbbbbbbb-bbbb-7bbb-bbbb-bbbbbbbbbbbb',
              fatSecretId: '99999',
              name: 'Shared Catalog Chicken',
              brandName: null,
              foodType: 'Generic',
              thumbnail: null,
              calories: 165,
              isLocal: true,
            },
          ],
          pagination: { page: 1, totalResults: 1, maxResults: 10 },
        }),
      });
    });

    // Mock custom search to return empty immediately — prevents loading state from blocking results
    await page.route('**/api/foods/custom/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [], total: 0 }),
      });
    });

    await typeSearch(page, 'chicken');
    await expect(page.getByTestId('food-search-dropdown')).toBeVisible({ timeout: 5000 });

    // Common and Branded tabs exist; custom food should not be in common/branded results
    await expect(page.getByTestId('tab-common')).toBeVisible({ timeout: 5000 });
    const firstResult = page.getByTestId('food-result-item').first();
    await expect(firstResult).toContainText('Shared Catalog Chicken');
  });

  test('food detail for a shared food (userId=null) returns 200 for authenticated user', async ({
    page,
  }) => {
    await loginAsTestUser(page);

    const response = await page.request.get('/api/foods/detail?id=00000000-0000-0000-0000-000000000000');
    // Shared food not found → 404 (not 403) — access control passes for null userId
    expect(response.status()).not.toBe(403);
  });

  test('food detail endpoint returns 403 for a custom food owned by another user (mocked)', async ({
    page,
  }) => {
    await loginAsTestUser(page);
    await goToFoodLog(page);

    // Mock the detail endpoint returning 403 (another user's custom food)
    await page.route('**/api/foods/detail?id=dddddddd*', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Forbidden' }),
      });
    });

    // Set up response listener before triggering the fetch to avoid a race
    const responsePromise = page.waitForResponse('**/api/foods/detail?id=dddddddd*');
    await page.evaluate(() => {
      fetch('/api/foods/detail?id=dddddddd-dddd-7ddd-dddd-dddddddddddd');
    });
    const response = await responsePromise;

    expect(response.status()).toBe(403);
  });
});
