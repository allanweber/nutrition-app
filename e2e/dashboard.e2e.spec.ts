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
});

