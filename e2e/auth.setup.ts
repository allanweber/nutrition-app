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
  // Defensive: ensure no leftover cookies if the runner ever shares a context between setup tests.
  await page.context().clearCookies();

  // `networkidle` is flaky with Next.js dev (HMR, SSE, React Query). Wait for UI instead.
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const emailInput = page.getByTestId('email-input');
  await emailInput.waitFor({ state: 'visible' });

  await emailInput.fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('submit-button').click();

  // Dev server gets slower after several cold compilations; allow extra headroom for CI.
  await page.waitForURL(/\/dashboard(\/|$|\?)/, { timeout: 60_000 });
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

setup('authenticate professional2', async ({ page }) => {
  await loginAndSave(
    page,
    seedUsers.professional2.email,
    seedUsers.professional2.password,
    AUTH_FILES.professional2,
  );
});

setup('authenticate maintenance', async ({ page }) => {
  await loginAndSave(
    page,
    seedUsers.maintenance.email,
    seedUsers.maintenance.password,
    AUTH_FILES.maintenance,
  );
});

setup('authenticate fatLoss', async ({ page }) => {
  await loginAndSave(page, seedUsers.fatLoss.email, seedUsers.fatLoss.password, AUTH_FILES.fatLoss);
});

setup('authenticate weightGain', async ({ page }) => {
  await loginAndSave(
    page,
    seedUsers.weightGain.email,
    seedUsers.weightGain.password,
    AUTH_FILES.weightGain,
  );
});

setup('authenticate performance', async ({ page }) => {
  await loginAndSave(
    page,
    seedUsers.performance.email,
    seedUsers.performance.password,
    AUTH_FILES.performance,
  );
});

setup('authenticate mealPlannerA', async ({ page }) => {
  await loginAndSave(
    page,
    seedUsers.mealPlannerA.email,
    seedUsers.mealPlannerA.password,
    AUTH_FILES.mealPlannerA,
  );
});

setup('authenticate mealPlannerB', async ({ page }) => {
  await loginAndSave(
    page,
    seedUsers.mealPlannerB.email,
    seedUsers.mealPlannerB.password,
    AUTH_FILES.mealPlannerB,
  );
});
