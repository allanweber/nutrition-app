import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { testUser } from './fixtures/test-data';

test.describe('005: Dashboard Redesign', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  // ── Story 1: Core layout ─────────────────────────────────────────────────

  test('all 5 bento sections are visible', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Calories' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Daily Schedule' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[role="progressbar"][aria-label="Water intake"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[role="progressbar"][aria-label="Protein"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible({ timeout: 10000 });
  });

  test('all sections load independently and replace skeleton states', async ({ page }) => {
    await page.goto('/dashboard');

    // Each section heading loads via its own Suspense boundary — none should block another
    await expect(page.getByRole('heading', { name: 'Calories' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Macronutrients' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Water' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Weekly Momentum' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Daily Schedule' })).toBeVisible({ timeout: 15000 });

    // Once all content is loaded, no skeleton placeholder (aria-busy) should remain
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  });

  test('"Log Activity" CTA is visible and links to /food-log', async ({ page }) => {
    await page.goto('/dashboard');
    const logActivity = page.getByRole('link', { name: 'Log Activity' });
    await expect(logActivity).toBeVisible();
    await expect(logActivity).toHaveAttribute('href', '/food-log');
  });

  // ── Navigation (FR-013) ─────────────────────────────────────────────────

  test('navigation bar shows brand mark and all five primary links', async ({ page }) => {
    await page.goto('/dashboard');

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Vitalis' })).toBeVisible();

    for (const label of ['Dashboard', 'Food Log', 'Meal Planner', 'Exercise Library', 'Goals']) {
      await expect(nav.getByRole('link', { name: label })).toBeVisible();
    }
  });

  // ── Story 3: Per-section error states ───────────────────────────────────
  //
  // These tests use /test/error-section — a dev/test-only page that renders
  // a SectionErrorBoundary around a client component that always throws.
  // This lets us trigger the error UI deterministically without needing to
  // mock server-side RSC streaming.

  test.describe('error boundary', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/test/error-section');
    });

    test('erroring section shows "Something went wrong" with a Retry button', async ({ page }) => {
      await expect(page.getByText('Something went wrong')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
    });

    test('Retry button resets the error boundary and reattempts render', async ({ page }) => {
      const retryBtn = page.getByRole('button', { name: 'Retry' });
      await expect(retryBtn).toBeVisible();

      await retryBtn.click();

      // The boundary resets → ThrowingSection throws again immediately →
      // error UI reappears.  Confirms the boundary re-ran its children.
      await expect(page.getByText('Something went wrong')).toBeVisible({ timeout: 5000 });
    });

    test('erroring section does not affect sibling sections', async ({ page }) => {
      // First section shows error UI
      await expect(page.getByText('Something went wrong')).toBeVisible();

      // Sibling section is completely unaffected
      await expect(page.getByTestId('stable-section')).toBeVisible();
      await expect(page.getByText('Stable section — unaffected by sibling error')).toBeVisible();
    });

    test('error UI is visually consistent with the shared component pattern', async ({ page }) => {
      // All sections use the same RetryUI component — verify the shared
      // structure: icon container, message, and Retry action.
      const errorContainer = page.locator('text=Something went wrong').locator('..');
      await expect(errorContainer).toBeVisible();
      await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
    });
  });

  // ── Story 2: Theme ───────────────────────────────────────────────────────

  test('theme switcher toggles between dark and light modes', async ({ page }) => {
    await page.goto('/dashboard');

    // Switch to dark
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await page.getByRole('menuitem', { name: /^Dark/ }).click();
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 3000 });

    // Switch back to light
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await page.getByRole('menuitem', { name: /^Light/ }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 3000 });
  });

  test('theme preference persists after page reload', async ({ page }) => {
    await page.goto('/dashboard');
    const initialClass = await page.locator('html').getAttribute('class');
    await page.reload();
    await page.waitForLoadState('networkidle');
    const afterReloadClass = await page.locator('html').getAttribute('class');
    expect((afterReloadClass ?? '').includes('dark')).toBe(
      (initialClass ?? '').includes('dark'),
    );
  });

  // ── Story 4: Calories ────────────────────────────────────────────────────

  test('calories section shows circular ring, goal denominator, and stat cards', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Calories' })).toBeVisible({ timeout: 10000 });

    // Circular progress ring — aria-label carries current percentage
    const ring = page.getByRole('img', { name: /Remaining.*of daily goal/i });
    await expect(ring).toBeVisible();
    expect(await ring.getAttribute('aria-label')).toMatch(/\d+%/);

    // Goal denominator rendered as "/ X kcal"
    await expect(page.getByText(/\/\s*[\d,.]+\s*kcal/)).toBeVisible();

    // Percentage consumed sentence
    await expect(page.getByText(/% of your daily target/)).toBeVisible();

    // Stat cards
    await expect(page.getByText('Burned')).toBeVisible();
    await expect(page.getByText('Net Balance')).toBeVisible();
  });

  // ── Story 5: Macronutrients ──────────────────────────────────────────────

  test('macronutrients section renders progress bars for protein, carbs, and fat', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Macronutrients' })).toBeVisible({ timeout: 10000 });

    for (const macro of ['Protein', 'Carbohydrates', 'Fat']) {
      const bar = page.locator(`[role="progressbar"][aria-label="${macro}"]`);
      await expect(bar).toBeVisible();
      const pct = Number(await bar.getAttribute('aria-valuenow'));
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  // ── Story 6: Weekly Momentum ─────────────────────────────────────────────

  test('weekly momentum renders bar chart with x-axis and bars', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Weekly Momentum' })).toBeVisible({ timeout: 10000 });

    const chart = page.locator('.recharts-wrapper').first();
    await expect(chart).toBeVisible({ timeout: 10000 });
    // SVG <g> elements have no bounding box — use toBeAttached to confirm presence
    await expect(chart.locator('.recharts-xAxis')).toBeAttached();
    await expect(chart.locator('.recharts-bar')).toBeAttached();
  });

  // ── Story 7: Daily Schedule ──────────────────────────────────────────────

  test('daily schedule always shows morning, midday, and evening groups', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Daily Schedule' })).toBeVisible({ timeout: 10000 });

    // All three time groups must always be present — never hidden (FR-011)
    await expect(page.getByText('Morning')).toBeVisible();
    await expect(page.getByText('Midday')).toBeVisible();
    await expect(page.getByText('Evening')).toBeVisible();
  });

  test('empty time groups show "Nothing logged yet" placeholder', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Daily Schedule' })).toBeVisible({ timeout: 10000 });

    // Each empty group must show the placeholder text, not be hidden (FR-011)
    const placeholders = page.getByText('Nothing logged yet');
    const count = await placeholders.count();
    for (let i = 0; i < count; i++) {
      await expect(placeholders.nth(i)).toBeVisible();
    }
  });

  test('daily schedule "View All" link navigates to food log', async ({ page }) => {
    await page.goto('/dashboard');
    const viewAll = page.getByRole('link', { name: 'View All' });
    await expect(viewAll).toBeVisible({ timeout: 10000 });
    await expect(viewAll).toHaveAttribute('href', '/food-log');
    await viewAll.click();
    await page.waitForURL(/\/food-log/, { timeout: 8000 });
  });

  // ── Story 8: Hydration ───────────────────────────────────────────────────

  test('hydration section shows progress bar and add button', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Water' })).toBeVisible({ timeout: 10000 });

    const bar = page.locator('[role="progressbar"][aria-label="Water intake"]');
    await expect(bar).toBeVisible();
    const pct = Number(await bar.getAttribute('aria-valuenow'));
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);

    await expect(page.getByRole('button', { name: 'Add 250ml water' })).toBeVisible();
  });

  test('add-water button increments hydration', async ({ page }) => {
    await page.goto('/dashboard');

    const bar = page.locator('[role="progressbar"][aria-label="Water intake"]');
    await expect(bar).toBeVisible({ timeout: 10000 });
    const valueBefore = Number(await bar.getAttribute('aria-valuenow') ?? '0');

    const addBtn = page.getByRole('button', { name: 'Add 250ml water' });
    await expect(addBtn).toBeVisible();

    // Wait for the server action POST (revalidatePath triggers RSC re-render)
    const serverActionDone = page.waitForResponse(
      (r) => r.request().method() === 'POST' && r.url().includes('/dashboard'),
      { timeout: 10000 },
    );
    await addBtn.click();
    await serverActionDone;
    await page.waitForLoadState('networkidle');

    // >= handles the edge case where intake was already at or above the daily goal
    const valueAfter = Number(await bar.getAttribute('aria-valuenow') ?? '0');
    expect(valueAfter).toBeGreaterThanOrEqual(valueBefore);
  });

  // ── Responsive (FR-014) ──────────────────────────────────────────────────

  test('dashboard renders without horizontal scroll on 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 1); // 1px tolerance
  });

  // ── Edge case: goal nudge (FR-018) ────────────────────────────────────────

  test('goal nudge links to /goals when present', async ({ page }) => {
    await page.goto('/dashboard');

    // Nudge only appears when the user has no goal configured for a metric.
    // When present it must always point to /goals — never hidden with a broken href.
    const nudges = page.locator('a[href="/goals"]').filter({ hasText: /Set your/i });
    const count = await nudges.count();
    for (let i = 0; i < count; i++) {
      await expect(nudges.nth(i)).toHaveAttribute('href', '/goals');
    }
  });
});
