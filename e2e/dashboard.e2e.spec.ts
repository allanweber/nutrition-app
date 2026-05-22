import { expect, test } from '@playwright/test';
import { AUTH_FILES } from './fixtures/test-data';

test.describe('Dashboard (smoke)', () => {
  test.use({ storageState: AUTH_FILES.dashboard });

  test('loads key sections', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('region', { name: /^Calories\b/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Daily Schedule' })).toBeVisible({ timeout: 20_000 });
  });

  test('weekly summary period toggle updates the control state', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    const summary = page.getByTestId('weekly-summary');
    await expect(summary.getByRole('heading', { name: 'Weekly summary' })).toBeVisible({
      timeout: 20_000,
    });

    const calendarWeek = summary.getByRole('radio', {
      name: /Calendar week, Monday through Sunday/i,
    });
    const lastSevenDays = summary.getByRole('radio', {
      name: /Last seven days, rolling window/i,
    });

    await expect(calendarWeek).toBeVisible();
    await expect(lastSevenDays).toBeVisible();

    await lastSevenDays.click();
    await expect(lastSevenDays).toBeChecked();

    await calendarWeek.click();
    await expect(calendarWeek).toBeChecked();
  });
});

