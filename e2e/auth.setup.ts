/**
 * Auth setup — runs once before chromium tests.
 * Uses Better Auth API sign-in (no UI) for speed and stability on Next dev server.
 */

import fs from 'fs';
import path from 'path';
import { expect, test as setup, type APIRequestContext } from '@playwright/test';
import { seedUsers, AUTH_FILES } from './fixtures/test-data';

setup.setTimeout(60_000);

const AUTH_DIR = path.join(process.cwd(), 'e2e/.auth');
fs.mkdirSync(AUTH_DIR, { recursive: true });

async function loginAndSave(
  request: APIRequestContext,
  email: string,
  password: string,
  filePath: string,
) {
  const res = await request.post('/api/auth/sign-in/email', {
    data: { email, password },
    headers: { 'Content-Type': 'application/json' },
  });

  expect(res.ok(), `Login failed for ${email}: ${res.status()} ${await res.text()}`).toBeTruthy();

  await request.storageState({ path: filePath });
}

setup('authenticate dashboard user', async ({ request }) => {
  await loginAndSave(
    request,
    seedUsers.dashboard.email,
    seedUsers.dashboard.password,
    AUTH_FILES.dashboard,
  );
});

setup('authenticate food log user', async ({ request }) => {
  await loginAndSave(
    request,
    seedUsers.foodLog.email,
    seedUsers.foodLog.password,
    AUTH_FILES.foodLog,
  );
});

setup('authenticate meal planner user', async ({ request }) => {
  await loginAndSave(
    request,
    seedUsers.mealPlanner.email,
    seedUsers.mealPlanner.password,
    AUTH_FILES.mealPlanner,
  );
});

setup('authenticate my foods user', async ({ request }) => {
  await loginAndSave(
    request,
    seedUsers.myFoods.email,
    seedUsers.myFoods.password,
    AUTH_FILES.myFoods,
  );
});
