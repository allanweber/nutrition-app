/**
 * Auth setup — runs once before any test project that depends on it.
 * Logs in each seed user and saves the browser storage state to a file.
 * Tests then restore that state via `test.use({ storageState })` so
 * they skip the login round-trip entirely.
 */

import fs from 'fs';
import path from 'path';
import { test as setup } from '@playwright/test';
import { seedUsers, testUser, AUTH_FILES } from './fixtures/test-data';

// Ensure the .auth directory exists before any setup test writes to it
const AUTH_DIR = path.join(process.cwd(), 'e2e/.auth');
fs.mkdirSync(AUTH_DIR, { recursive: true });

async function loginAndSave(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
  filePath: string,
) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('submit-button').click();
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await page.context().storageState({ path: filePath });
}

setup('authenticate testUser (weightLoss)', async ({ page }) => {
  await loginAndSave(page, testUser.email, testUser.password, AUTH_FILES.testUser);
});

setup('authenticate generalHealth', async ({ page }) => {
  await loginAndSave(
    page,
    seedUsers.generalHealth.email,
    seedUsers.generalHealth.password,
    AUTH_FILES.generalHealth,
  );
});

setup('authenticate professional1', async ({ page }) => {
  await loginAndSave(
    page,
    seedUsers.professional1.email,
    seedUsers.professional1.password,
    AUTH_FILES.professional1,
  );
});

setup('authenticate muscleGain', async ({ page }) => {
  await loginAndSave(
    page,
    seedUsers.muscleGain.email,
    seedUsers.muscleGain.password,
    AUTH_FILES.muscleGain,
  );
});
