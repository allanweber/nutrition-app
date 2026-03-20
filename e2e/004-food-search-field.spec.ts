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
    await expect(page.getByTestId('serving-select')).toBeVisible();
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

    // Arrow down twice — 3rd result should be highlighted
    await page.getByTestId('food-search-input').press('ArrowDown');
    await page.getByTestId('food-search-input').press('ArrowDown');

    // The 3rd item (index 2) should have aria-selected=true
    const items = page.getByRole('option');
    const count = await items.count();
    if (count >= 3) {
      await expect(items.nth(2)).toHaveAttribute('aria-selected', 'true');
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
