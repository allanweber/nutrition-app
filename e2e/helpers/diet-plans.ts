import { expect, type Page } from '@playwright/test';

/** Plan deletes can cascade many rows; allow extra time under parallel E2E load. */
const API_DELETE_TIMEOUT_MS = 30_000;

export async function deletePlanViaApi(page: Page, planId: string): Promise<void> {
  const res = await page.request.delete(`/api/diet-plans/${planId}`, {
    timeout: API_DELETE_TIMEOUT_MS,
  });
  expect(res.ok()).toBeTruthy();
}

export async function deleteAllPlansViaApi(page: Page): Promise<void> {
  const res = await page.request.get('/api/diet-plans');
  if (!res.ok()) return;
  const body = await res.json();
  for (const plan of (body.plans ?? []) as Array<{ id: string }>) {
    await deletePlanViaApi(page, plan.id);
  }
}
