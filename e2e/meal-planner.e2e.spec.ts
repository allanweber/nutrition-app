import { expect, test } from '@playwright/test';
import { AUTH_FILES } from './fixtures/test-data';
import { MealPlannerPage } from './pages/meal-planner.page';
import { deletePlanViaApi } from './helpers/diet-plans';

test.describe('Meal planner (minimal E2E)', () => {
  test.use({ storageState: AUTH_FILES.mealPlanner });

  test('create plan via UI and auto-select it', async ({ page }) => {
    const mp = new MealPlannerPage(page);
    await mp.goto();

    await mp.addNewPlanCard.click();
    await expect(mp.newPlanModal).toBeVisible({ timeout: 10_000 });

    const planName = `E2E Plan ${Date.now()}`;
    await mp.planNameInput.fill(planName);
    await mp.planTargetCaloriesInput.fill('2000');
    await mp.planTargetProteinInput.fill('150');
    await mp.planTargetCarbsInput.fill('220');
    await mp.planTargetFatInput.fill('70');

    await mp.newPlanSubmit.click();

    // New plan should become selected → day selector and meals view appear
    await expect(mp.daySelector).toBeVisible({ timeout: 15_000 });
    await expect(mp.dayMealsView).toBeVisible({ timeout: 15_000 });

    // Cleanup: delete plan via API by name (plan cards don't expose data-selected).
    const listRes = await page.request.get('/api/diet-plans');
    expect(listRes.ok()).toBeTruthy();
    const body = (await listRes.json()) as { plans: Array<{ id: string; name: string }> };
    const created = body.plans.find((p) => p.name === planName);
    if (created) {
      await deletePlanViaApi(page, created.id);
    }
  });

  test('copy day populates target day meals', async ({ page }) => {
    const mp = new MealPlannerPage(page);

    // Create plan + a meal on day 1 via API for deterministic copy behavior.
    const createPlanRes = await page.request.post('/api/diet-plans', {
      data: {
        name: `Copy Day Plan ${Date.now()}`,
        status: 'draft',
        startDate: new Date().toISOString(),
        targetCalories: 2000,
        targetProtein: 150,
        targetCarbs: 220,
        targetFat: 70,
      },
    });
    expect(createPlanRes.ok()).toBeTruthy();
    const { plan } = (await createPlanRes.json()) as { plan: { id: string } };

    const createMealRes = await page.request.post(`/api/diet-plans/${plan.id}/meals`, {
      data: { mealType: 'breakfast', dayOfWeek: 1 },
    });
    expect(createMealRes.ok()).toBeTruthy();

    await mp.goto();
    await mp.planCard(plan.id).click();
    await expect(mp.daySelector).toBeVisible({ timeout: 10_000 });

    // Navigate to day 3 (Wednesday) so it starts empty
    await mp.dayButton(3).click();

    await expect(mp.copyDayButton).toBeVisible({ timeout: 10_000 });
    await mp.copyDayButton.click();
    await expect(mp.copyDayPopover).toBeVisible({ timeout: 10_000 });

    await mp.copyFromDay(1).click();

    // Target day should now have at least 1 meal card
    await expect
      .poll(async () => (await mp.getMealCardIds()).length, { timeout: 15_000 })
      .toBeGreaterThan(0);

    await deletePlanViaApi(page, plan.id);
  });

  test('edit plan via card menu', async ({ page }) => {
    const mp = new MealPlannerPage(page);
    const originalName = `E2E Edit Plan ${Date.now()}`;
    const updatedName = `${originalName} Updated`;

    const createPlanRes = await page.request.post('/api/diet-plans', {
      data: {
        name: originalName,
        status: 'draft',
        startDate: new Date().toISOString(),
        targetCalories: 2000,
        targetProtein: 150,
        targetCarbs: 220,
        targetFat: 70,
      },
    });
    expect(createPlanRes.ok()).toBeTruthy();
    const { plan } = (await createPlanRes.json()) as { plan: { id: string } };

    await mp.goto();
    await mp.planCard(plan.id).click();
    await mp.planMenuTrigger(plan.id).click();
    await mp.planMenuEdit(plan.id).click();

    await expect(mp.newPlanModal).toBeVisible({ timeout: 10_000 });
    await expect(mp.planNameInput).toHaveValue(originalName);

    await mp.planNameInput.fill(updatedName);
    await mp.editPlanSubmit.click();

    await expect(mp.planName(plan.id)).toHaveText(updatedName, { timeout: 15_000 });

    await deletePlanViaApi(page, plan.id);
  });

  test('duplicate plan via card menu copies meals', async ({ page }) => {
    const mp = new MealPlannerPage(page);
    const planName = `E2E Dup Plan ${Date.now()}`;
    const copyName = `${planName} (Copy)`;

    const createPlanRes = await page.request.post('/api/diet-plans', {
      data: {
        name: planName,
        status: 'draft',
        startDate: new Date().toISOString(),
        targetCalories: 2000,
        targetProtein: 150,
        targetCarbs: 220,
        targetFat: 70,
      },
    });
    expect(createPlanRes.ok()).toBeTruthy();
    const { plan } = (await createPlanRes.json()) as { plan: { id: string } };

    const createMealRes = await page.request.post(`/api/diet-plans/${plan.id}/meals`, {
      data: { mealType: 'breakfast', dayOfWeek: 1 },
    });
    expect(createMealRes.ok()).toBeTruthy();

    await mp.goto();
    await mp.planCard(plan.id).click();
    await mp.planMenuTrigger(plan.id).click();
    await mp.planMenuDuplicate(plan.id).click();

    let copyId: string | undefined;
    await expect
      .poll(async () => {
        const listRes = await page.request.get('/api/diet-plans');
        const body = (await listRes.json()) as { plans: Array<{ id: string; name: string }> };
        const copy = body.plans.find((p) => p.name === copyName);
        copyId = copy?.id;
        return copyId;
      }, { timeout: 15_000 })
      .toBeTruthy();

    await expect(mp.planStatusBadge(copyId!)).toHaveText('Draft', { timeout: 10_000 });
    await mp.planCard(copyId!).click();
    await expect(mp.dayMealsView).toBeVisible({ timeout: 10_000 });
    await expect
      .poll(async () => (await mp.getMealCardIds()).length, { timeout: 15_000 })
      .toBeGreaterThan(0);

    await deletePlanViaApi(page, plan.id);
    await deletePlanViaApi(page, copyId!);
  });

  test('duplicate plan API returns draft copy', async ({ page }) => {
    const planName = `E2E Dup API ${Date.now()}`;

    const createPlanRes = await page.request.post('/api/diet-plans', {
      data: {
        name: planName,
        status: 'active',
        startDate: new Date().toISOString(),
        targetCalories: 2000,
        targetProtein: 150,
        targetCarbs: 220,
        targetFat: 70,
      },
    });
    expect(createPlanRes.ok()).toBeTruthy();
    const { plan } = (await createPlanRes.json()) as { plan: { id: string } };

    const dupRes = await page.request.post(`/api/diet-plans/${plan.id}/duplicate`);
    expect(dupRes.status()).toBe(201);
    const { plan: copy } = (await dupRes.json()) as { plan: { id: string; name: string; status: string } };
    expect(copy.status).toBe('draft');
    expect(copy.name).toBe(`${planName} (Copy)`);

    await deletePlanViaApi(page, plan.id);
    await deletePlanViaApi(page, copy.id);
  });
});

