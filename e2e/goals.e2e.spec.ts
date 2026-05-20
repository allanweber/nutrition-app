import { expect, test } from '@playwright/test';
import { AUTH_FILES } from './fixtures/test-data';

test.describe('Goals (golden path)', () => {
  test.use({ storageState: AUTH_FILES.dashboard });

  test('loads goals form and shows calculator CTA', async ({ page }) => {
    await page.goto('/goals', { waitUntil: 'domcontentloaded' });

    const open = page.getByRole('button', { name: /open calculator/i });
    await expect(open).toBeVisible({ timeout: 20_000 });
  });
});

