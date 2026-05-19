import { expect, test, type Page } from '@playwright/test';
import { deleteAllPlansViaApi, deletePlanViaApi } from './helpers/diet-plans';
import { testUser, mealPlannerSeedData, AUTH_FILES } from './fixtures/test-data';
import { LoginPage } from './pages/login.page';
import { MealPlannerPage } from './pages/meal-planner.page';

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password = 'Password123!') {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

const loginAsTestUser = (page: Page) => loginAs(page, testUser.email, testUser.password);

// ── API seeding helpers ───────────────────────────────────────────────────────

interface CreatePlanInput {
  name: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  status: 'active' | 'draft' | 'archived';
  startDate?: string;
}

async function createPlanViaApi(page: Page, data: CreatePlanInput): Promise<string> {
  const res = await page.request.post('/api/diet-plans', {
    data: {
      ...data,
      startDate: data.startDate ?? new Date().toISOString(),
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.plan.id as string;
}

async function createMealViaApi(
  page: Page,
  planId: string,
  mealType: string,
  dayOfWeek: number,
): Promise<string> {
  const res = await page.request.post(`/api/diet-plans/${planId}/meals`, {
    data: { mealType, dayOfWeek },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.meal.id as string;
}

async function patchPlanStatusViaApi(
  page: Page,
  planId: string,
  status: 'active' | 'draft' | 'archived',
): Promise<void> {
  await page.request.patch(`/api/diet-plans/${planId}`, { data: { status } });
}

// Default plan data for API-seeded test plans
const DEFAULT_PLAN: Omit<CreatePlanInput, 'name' | 'status'> = {
  targetCalories: 2000,
  targetProtein: 150,
  targetCarbs: 200,
  targetFat: 70,
};

// ── Block 1: Page structure and empty state ───────────────────────────────────

test.describe('013: Page structure and empty state', () => {
  test.use({ storageState: AUTH_FILES.generalHealth });
  let mp: MealPlannerPage;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    await mp.goto();
  });

  test('page renders heading, carousel, and add-new card', async () => {
    await expect(mp.heading).toBeVisible();
    await expect(mp.planCarousel).toBeVisible();
    await expect(mp.addNewPlanCard).toBeVisible();
  });

  test('empty state message shown when no plans exist', async () => {
    await expect(mp.emptyState).toBeVisible();
    await expect(mp.emptyState).toContainText(/plan your week/i);
  });

  test('DaySelector and DayMealsView are not rendered without a selected plan', async () => {
    await expect(mp.daySelector).not.toBeVisible();
    await expect(mp.dayMealsView).not.toBeVisible();
  });

  test('navigating to /meal-planner without params shows empty state', async ({ page }) => {
    await page.goto('/meal-planner');
    await page.waitForLoadState('networkidle');
    await expect(mp.emptyState).toBeVisible();
  });
});

// ── Block 2: Plan carousel — seeded plans display ─────────────────────────────

test.describe('013: Plan carousel — seeded plans display', () => {
  test.use({ storageState: AUTH_FILES.testUser });
  let mp: MealPlannerPage;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    await mp.goto();
  });

  test('carousel shows at least 3 plan cards (active + draft + archived)', async () => {
    await expect
      .poll(async () => (await mp.getPlanCardIds()).length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(3);
  });

  test('active plan card badge shows "Active Plan"', async () => {
    const ids = await mp.getPlanCardIds();
    let foundActive = false;
    for (const id of ids) {
      const badge = mp.planStatusBadge(id);
      const text = await badge.textContent();
      if (text && /active/i.test(text)) {
        foundActive = true;
        break;
      }
    }
    expect(foundActive).toBe(true);
  });

  test('draft plan card badge shows "Draft"', async () => {
    const ids = await mp.getPlanCardIds();
    let foundDraft = false;
    for (const id of ids) {
      const badge = mp.planStatusBadge(id);
      const text = await badge.textContent();
      if (text && /draft/i.test(text)) {
        foundDraft = true;
        break;
      }
    }
    expect(foundDraft).toBe(true);
  });

  test('archived plan card badge shows "Archived"', async () => {
    const ids = await mp.getPlanCardIds();
    let foundArchived = false;
    for (const id of ids) {
      const badge = mp.planStatusBadge(id);
      const text = await badge.textContent();
      if (text && /archived/i.test(text)) {
        foundArchived = true;
        break;
      }
    }
    expect(foundArchived).toBe(true);
  });

  test('active plan card shows target calories', async () => {
    const ids = await mp.getPlanCardIds();
    let activeId = '';
    for (const id of ids) {
      const text = await mp.planStatusBadge(id).textContent();
      if (text && /active/i.test(text)) {
        activeId = id;
        break;
      }
    }
    expect(activeId).not.toBe('');
    await expect(mp.planTargetCalories(activeId)).toContainText(
      mealPlannerSeedData.activePlanTargetCalories.toLocaleString('en-US'),
    );
  });

  test('active plan card shows plan name', async () => {
    const ids = await mp.getPlanCardIds();
    let activeId = '';
    for (const id of ids) {
      const text = await mp.planStatusBadge(id).textContent();
      if (text && /active/i.test(text)) {
        activeId = id;
        break;
      }
    }
    await expect(mp.planName(activeId)).toContainText(
      mealPlannerSeedData.weightLossActivePlanName,
    );
  });

  test('active plan completeness shows a percentage', async () => {
    const ids = await mp.getPlanCardIds();
    let activeId = '';
    for (const id of ids) {
      const text = await mp.planStatusBadge(id).textContent();
      if (text && /active/i.test(text)) {
        activeId = id;
        break;
      }
    }
    await expect(mp.planCompleteness(activeId)).toHaveText(/%/);
  });

  test('active plan avg daily calories shows a non-zero value', async () => {
    const ids = await mp.getPlanCardIds();
    let activeId = '';
    for (const id of ids) {
      const text = await mp.planStatusBadge(id).textContent();
      if (text && /active/i.test(text)) {
        activeId = id;
        break;
      }
    }
    const text = await mp.planAvgCalories(activeId).textContent();
    expect(text).not.toMatch(/^0\s*kcal$/i);
  });
});

// ── Block 3: Create plan — draft ──────────────────────────────────────────────

test.describe('013: Create plan — draft', () => {
  // Uses shared `mp` / `createdPlanId` variables and mutates the same user state.
  // Keep this block sequential, while allowing other describes to run in parallel.
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: AUTH_FILES.maintenance });
  let mp: MealPlannerPage;
  let createdPlanId: string | null = null;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    await mp.goto();
    createdPlanId = null;
  });

  test.afterEach(async ({ page }) => {
    if (createdPlanId) {
      await deletePlanViaApi(page, createdPlanId);
      createdPlanId = null;
    }
  });

  test('clicking Add New Plan opens NewPlanModal', async () => {
    await mp.addNewPlanCard.click();
    await expect(mp.newPlanModal).toBeVisible({ timeout: 5000 });
    await expect(mp.newPlanModal).toContainText(/create/i);
  });

  test('modal closes on Escape key', async ({ page }) => {
    await mp.addNewPlanCard.click();
    await expect(mp.newPlanModal).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await expect(mp.newPlanModal).not.toBeVisible({ timeout: 5000 });
  });

  test('modal closes on Cancel button', async () => {
    await mp.addNewPlanCard.click();
    await expect(mp.newPlanModal).toBeVisible({ timeout: 5000 });
    await mp.newPlanCancel.click();
    await expect(mp.newPlanModal).not.toBeVisible({ timeout: 5000 });
  });

  test('submitting empty form shows name validation error', async () => {
    await mp.addNewPlanCard.click();
    await expect(mp.newPlanModal).toBeVisible({ timeout: 5000 });
    await mp.newPlanSubmit.click();
    await expect(mp.planNameError).toBeVisible({ timeout: 5000 });
  });

  test('creating a draft plan appears in carousel with Draft badge', async () => {
    const planName = `E2E Draft Plan ${Date.now()}`;
    await mp.addNewPlanCard.click();
    await expect(mp.newPlanModal).toBeVisible({ timeout: 5000 });
    await mp.planNameInput.fill(planName);
    await mp.planTargetCaloriesInput.clear();
    await mp.planTargetCaloriesInput.fill('2000');
    await mp.planTargetProteinInput.clear();
    await mp.planTargetProteinInput.fill('150');
    await mp.planTargetCarbsInput.clear();
    await mp.planTargetCarbsInput.fill('200');
    await mp.planTargetFatInput.clear();
    await mp.planTargetFatInput.fill('70');
    await mp.planStartDateInput.fill('2026-01-01');
    await mp.newPlanSubmit.click();
    await expect(mp.newPlanModal).not.toBeVisible({ timeout: 10000 });

    await expect
      .poll(async () => (await mp.getPlanCardIds()).length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(1);

    const ids = await mp.getPlanCardIds();
    // Pick the newly created plan by name (safer under parallel runs / existing state).
    const createdId = await mp
      .page
      .locator('[data-testid^="plan-card-"]')
      .filter({ hasText: planName })
      .first()
      .getAttribute('data-testid');
    createdPlanId = createdId?.replace('plan-card-', '') ?? ids[0];
    await expect(mp.planStatusBadge(createdPlanId)).toContainText(/draft/i);
  });

  test('new plan is auto-selected after creation — DaySelector becomes visible', async () => {
    const planName = `E2E AutoSelect ${Date.now()}`;
    await mp.addNewPlanCard.click();
    await expect(mp.newPlanModal).toBeVisible({ timeout: 5000 });
    await mp.planNameInput.fill(planName);
    await mp.planTargetCaloriesInput.clear();
    await mp.planTargetCaloriesInput.fill('2000');
    await mp.planTargetProteinInput.clear();
    await mp.planTargetProteinInput.fill('150');
    await mp.planTargetCarbsInput.clear();
    await mp.planTargetCarbsInput.fill('200');
    await mp.planTargetFatInput.clear();
    await mp.planTargetFatInput.fill('70');
    await mp.planStartDateInput.fill('2026-01-01');
    await mp.newPlanSubmit.click();
    await expect(mp.newPlanModal).not.toBeVisible({ timeout: 10000 });
    await expect(mp.daySelector).toBeVisible({ timeout: 10000 });
    await expect(mp.dayMealsView).toBeVisible({ timeout: 10000 });

    const ids = await mp.getPlanCardIds();
    createdPlanId = ids[0];
  });

  test('nutrition goal defaults pre-fill macro fields for testUser', async ({ page }) => {
    // testUser (weightLoss) has nutrition goals, so open modal and check pre-fill
    await loginAsTestUser(page);
    await mp.goto();
    await mp.addNewPlanCard.click();
    await expect(mp.newPlanModal).toBeVisible({ timeout: 5000 });
    const caloriesValue = await mp.planTargetCaloriesInput.inputValue();
    expect(caloriesValue).not.toBe('');
    expect(Number(caloriesValue)).toBeGreaterThan(0);
    await mp.newPlanCancel.click();
    // No plan was created, no cleanup needed
  });
});

// ── Block 4: Create plan — active, no conflict ────────────────────────────────

test.describe('013: Create plan — active, no conflict', () => {
  test.use({ storageState: AUTH_FILES.fatLoss });
  let mp: MealPlannerPage;
  let createdPlanId: string | null = null;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    await mp.goto();
    createdPlanId = null;
  });

  test.afterEach(async ({ page }) => {
    if (createdPlanId) {
      await deletePlanViaApi(page, createdPlanId);
      createdPlanId = null;
    }
  });

  test('activating plan when no active exists skips conflict dialog', async () => {
    const planName = `E2E Active No Conflict ${Date.now()}`;
    await mp.addNewPlanCard.click();
    await expect(mp.newPlanModal).toBeVisible({ timeout: 5000 });
    await mp.planNameInput.fill(planName);
    await mp.planTargetCaloriesInput.clear();
    await mp.planTargetCaloriesInput.fill('2000');
    await mp.planTargetProteinInput.clear();
    await mp.planTargetProteinInput.fill('150');
    await mp.planTargetCarbsInput.clear();
    await mp.planTargetCarbsInput.fill('200');
    await mp.planTargetFatInput.clear();
    await mp.planTargetFatInput.fill('70');
    await mp.planStartDateInput.fill('2026-01-01');
    await mp.planStatusActive.click();
    await mp.newPlanSubmit.click();

    // Conflict dialog must NOT appear
    await expect(mp.conflictDialog).not.toBeVisible({ timeout: 3000 });
    await expect(mp.newPlanModal).not.toBeVisible({ timeout: 10000 });

    await expect
      .poll(async () => (await mp.getPlanCardIds()).length, { timeout: 10000 })
      .toBe(1);

    const ids = await mp.getPlanCardIds();
    createdPlanId = ids[0];
    await expect(mp.planStatusBadge(createdPlanId)).toContainText(/active/i);
  });
});

// ── Block 5: Create plan — active, conflict ───────────────────────────────────

test.describe('013: Create plan — active, conflict with existing active plan', () => {
  // Mutates the same seeded active plan for testUser — keep serial within this block only.
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: AUTH_FILES.testUser });
  let mp: MealPlannerPage;
  let newPlanId: string | null = null;
  let originalActivePlanId: string | null = null;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    await mp.goto();
    // Record the current active plan ID for cleanup
    await expect
      .poll(async () => (await mp.getPlanCardIds()).length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(3);
    const ids = await mp.getPlanCardIds();
    for (const id of ids) {
      const text = await mp.planStatusBadge(id).textContent();
      if (text && /active/i.test(text)) {
        originalActivePlanId = id;
        break;
      }
    }
  });

  test.afterEach(async ({ page }) => {
    // Delete the newly created plan if it exists
    if (newPlanId) {
      await deletePlanViaApi(page, newPlanId);
      newPlanId = null;
    }
    // Restore the original active plan's status if it was archived
    if (originalActivePlanId) {
      await patchPlanStatusViaApi(page, originalActivePlanId, 'active');
    }
  });

  test('activating new plan when active plan exists shows conflict AlertDialog', async () => {
    await mp.addNewPlanCard.click();
    await expect(mp.newPlanModal).toBeVisible({ timeout: 5000 });
    await mp.planNameInput.fill(`E2E Conflict ${Date.now()}`);
    await mp.planTargetCaloriesInput.clear();
    await mp.planTargetCaloriesInput.fill('2000');
    await mp.planTargetProteinInput.clear();
    await mp.planTargetProteinInput.fill('150');
    await mp.planTargetCarbsInput.clear();
    await mp.planTargetCarbsInput.fill('200');
    await mp.planTargetFatInput.clear();
    await mp.planTargetFatInput.fill('70');
    await mp.planStartDateInput.fill('2026-01-01');
    await mp.planStatusActive.click();
    await mp.newPlanSubmit.click();
    await expect(mp.conflictDialog).toBeVisible({ timeout: 5000 });
    await mp.conflictCancel.click();
    await expect(mp.conflictDialog).not.toBeVisible({ timeout: 5000 });
  });

  test('conflict description mentions the existing active plan name', async () => {
    await mp.addNewPlanCard.click();
    await expect(mp.newPlanModal).toBeVisible({ timeout: 5000 });
    await mp.planNameInput.fill(`E2E Conflict Desc ${Date.now()}`);
    await mp.planTargetCaloriesInput.clear();
    await mp.planTargetCaloriesInput.fill('2000');
    await mp.planTargetProteinInput.clear();
    await mp.planTargetProteinInput.fill('150');
    await mp.planTargetCarbsInput.clear();
    await mp.planTargetCarbsInput.fill('200');
    await mp.planTargetFatInput.clear();
    await mp.planTargetFatInput.fill('70');
    await mp.planStartDateInput.fill('2026-01-01');
    await mp.planStatusActive.click();
    await mp.newPlanSubmit.click();
    await expect(mp.conflictDialog).toBeVisible({ timeout: 5000 });
    await expect(mp.conflictDescription).toContainText(
      mealPlannerSeedData.weightLossActivePlanName,
    );
    await mp.conflictCancel.click();
  });

  test('cancelling conflict keeps original plan active', async () => {
    await mp.addNewPlanCard.click();
    await expect(mp.newPlanModal).toBeVisible({ timeout: 5000 });
    await mp.planNameInput.fill(`E2E Conflict Cancel ${Date.now()}`);
    await mp.planTargetCaloriesInput.clear();
    await mp.planTargetCaloriesInput.fill('2000');
    await mp.planTargetProteinInput.clear();
    await mp.planTargetProteinInput.fill('150');
    await mp.planTargetCarbsInput.clear();
    await mp.planTargetCarbsInput.fill('200');
    await mp.planTargetFatInput.clear();
    await mp.planTargetFatInput.fill('70');
    await mp.planStartDateInput.fill('2026-01-01');
    await mp.planStatusActive.click();
    await mp.newPlanSubmit.click();
    await expect(mp.conflictDialog).toBeVisible({ timeout: 5000 });
    await mp.conflictCancel.click();
    await expect(mp.conflictDialog).not.toBeVisible({ timeout: 5000 });
    // Original active plan badge must still be active
    await expect(mp.planStatusBadge(originalActivePlanId!)).toContainText(/active/i);
  });

  test('confirming conflict archives old plan and activates new one', async () => {
    const planName = `E2E Conflict Confirm ${Date.now()}`;
    await mp.addNewPlanCard.click();
    await expect(mp.newPlanModal).toBeVisible({ timeout: 5000 });
    await mp.planNameInput.fill(planName);
    await mp.planTargetCaloriesInput.clear();
    await mp.planTargetCaloriesInput.fill('2000');
    await mp.planTargetProteinInput.clear();
    await mp.planTargetProteinInput.fill('150');
    await mp.planTargetCarbsInput.clear();
    await mp.planTargetCarbsInput.fill('200');
    await mp.planTargetFatInput.clear();
    await mp.planTargetFatInput.fill('70');
    await mp.planStartDateInput.fill('2026-01-01');
    await mp.planStatusActive.click();
    await mp.newPlanSubmit.click();
    await expect(mp.conflictDialog).toBeVisible({ timeout: 5000 });
    await mp.conflictConfirm.click();
    await expect(mp.conflictDialog).not.toBeVisible({ timeout: 10000 });

    // Find new plan ID from carousel
    await expect
      .poll(async () => (await mp.getPlanCardIds()).length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(4);
    const ids = await mp.getPlanCardIds();
    for (const id of ids) {
      if (id !== originalActivePlanId) {
        const text = await mp.planStatusBadge(id).textContent();
        if (text && /active/i.test(text)) {
          newPlanId = id;
          break;
        }
      }
    }
    expect(newPlanId).not.toBeNull();
    // New plan is active
    await expect(mp.planStatusBadge(newPlanId!)).toContainText(/active/i);
    // Original plan is now archived
    await expect(mp.planStatusBadge(originalActivePlanId!)).toContainText(/archived/i);
  });
});

// ── Block 6: Plan status updates via dropdown ─────────────────────────────────

test.describe('013: Plan status updates via dropdown', () => {
  // This block mutates plan statuses and uses shared variables; keep sequential.
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: AUTH_FILES.weightGain });
  let mp: MealPlannerPage;
  let planId: string;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    planId = await createPlanViaApi(page, {
      name: 'Status Test Plan',
      status: 'draft',
      ...DEFAULT_PLAN,
    });
    await mp.goto();
    await expect
      .poll(async () => (await mp.getPlanCardIds()).length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(1);
  });

  test.afterEach(async ({ page }) => {
    await deletePlanViaApi(page, planId);
  });

  test('options menu opens with 4 items', async () => {
    await mp.planMenuTrigger(planId).click();
    await expect(mp.planMenuSetActive(planId)).toBeVisible();
    await expect(mp.planMenuSetDraft(planId)).toBeVisible();
    await expect(mp.planMenuArchive(planId)).toBeVisible();
    await expect(mp.planMenuDelete(planId)).toBeVisible();
  });

  test('"Set Draft" is disabled when plan is already draft', async ({ page }) => {
    await mp.planMenuTrigger(planId).click();
    const setDraftItem = mp.planMenuSetDraft(planId);
    await expect(setDraftItem).toBeVisible();
    // Item should be disabled (aria-disabled or disabled attribute)
    const isDisabled =
      (await setDraftItem.getAttribute('aria-disabled')) === 'true' ||
      (await setDraftItem.isDisabled());
    expect(isDisabled).toBe(true);
    await page.keyboard.press('Escape');
  });

  test('archiving a plan updates badge to "Archived"', async () => {
    await mp.planMenuTrigger(planId).click();
    await mp.planMenuArchive(planId).click();
    await expect(mp.planStatusBadge(planId)).toContainText(/archived/i, { timeout: 5000 });
  });

  test('setting archived plan to active (no conflict) updates badge to "Active Plan"', async () => {
    // First archive it
    await mp.planMenuTrigger(planId).click();
    await mp.planMenuArchive(planId).click();
    await expect(mp.planStatusBadge(planId)).toContainText(/archived/i, { timeout: 5000 });
    // Now set active — no other active plan for this isolated user
    await mp.planMenuTrigger(planId).click();
    await mp.planMenuSetActive(planId).click();
    await expect(mp.conflictDialog).not.toBeVisible({ timeout: 3000 });
    await expect(mp.planStatusBadge(planId)).toContainText(/active/i, { timeout: 5000 });
  });

  test('setting draft to active when another active plan exists triggers conflict', async ({
    page,
  }) => {
    const activePlanId = await createPlanViaApi(page, {
      name: 'Second Active Plan',
      status: 'active',
      ...DEFAULT_PLAN,
    });
    await mp.goto();
    await expect
      .poll(async () => (await mp.getPlanCardIds()).length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(2);

    await mp.planMenuTrigger(planId).click();
    await mp.planMenuSetActive(planId).click();
    await expect(mp.conflictDialog).toBeVisible({ timeout: 5000 });
    await mp.conflictCancel.click();

    // Cleanup second plan
    await deletePlanViaApi(page, activePlanId);
  });
});

// ── Block 7: Delete plan ──────────────────────────────────────────────────────

test.describe('013: Delete plan', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: AUTH_FILES.professional1 });
  let mp: MealPlannerPage;
  let planId: string;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    await deleteAllPlansViaApi(page);
    planId = await createPlanViaApi(page, {
      name: 'Delete Me Plan',
      status: 'draft',
      ...DEFAULT_PLAN,
    });
    await mp.goto();
    await expect
      .poll(async () => (await mp.getPlanCardIds()).length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(1);
  });

  test.afterEach(async ({ page }) => {
    // Best-effort cleanup if plan wasn't deleted in the test
    try {
      await deletePlanViaApi(page, planId);
    } catch {
      // Plan may have already been deleted by the test
    }
  });

  test('clicking Delete in dropdown opens confirmation AlertDialog', async () => {
    await mp.planMenuTrigger(planId).click();
    await mp.planMenuDelete(planId).click();
    await expect(mp.planDeleteConfirmInCard(planId)).toBeVisible({ timeout: 5000 });
  });

  test('cancelling delete dialog keeps plan in carousel', async () => {
    await mp.planMenuTrigger(planId).click();
    await mp.planMenuDelete(planId).click();
    await expect(mp.planDeleteConfirmInCard(planId)).toBeVisible({ timeout: 5000 });
    await mp.planCard(planId).getByTestId('plan-delete-cancel').click();
    await expect(mp.planCard(planId)).toBeVisible({ timeout: 5000 });
  });

  test('confirming delete removes plan card from carousel', async () => {
    await mp.planMenuTrigger(planId).click();
    await mp.planMenuDelete(planId).click();
    await expect(mp.planDeleteConfirmInCard(planId)).toBeVisible({ timeout: 5000 });
    await mp.planDeleteConfirmInCard(planId).click();
    await expect(mp.planCard(planId)).not.toBeVisible({ timeout: 10000 });
  });

  test('deleting the only plan shows empty state', async () => {
    await mp.planMenuTrigger(planId).click();
    await mp.planMenuDelete(planId).click();
    await expect(mp.planDeleteConfirmInCard(planId)).toBeVisible({ timeout: 5000 });
    await mp.planDeleteConfirmInCard(planId).click();
    await expect(mp.planCard(planId)).not.toBeVisible({ timeout: 10000 });
    await expect(mp.emptyState).toBeVisible({ timeout: 15000 });
  });

  test('deleting selected plan auto-selects next plan if one exists', async ({ page }) => {
    const secondPlanId = await createPlanViaApi(page, {
      name: 'Second Plan',
      status: 'draft',
      ...DEFAULT_PLAN,
    });
    await mp.goto();
    await expect
      .poll(async () => (await mp.getPlanCardIds()).length, { timeout: 10000 })
      .toBe(2);

    // Click first plan to select it, then delete it
    await mp.planCard(planId).click();
    await expect(mp.daySelector).toBeVisible({ timeout: 5000 });
    await mp.planMenuTrigger(planId).click();
    await mp.planMenuDelete(planId).click();
    await mp.planDeleteConfirmInCard(planId).click();
    await expect(mp.planCard(planId)).not.toBeVisible({ timeout: 10000 });
    // DaySelector should still be visible (second plan auto-selected)
    await expect(mp.daySelector).toBeVisible({ timeout: 5000 });

    await deletePlanViaApi(page, secondPlanId);
  });
});

// ── Block 8: Plan selection and day selector ──────────────────────────────────

test.describe('013: Plan selection and day selector', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: AUTH_FILES.testUser });
  let mp: MealPlannerPage;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    await mp.goto();
    await expect
      .poll(async () => (await mp.getPlanCardIds()).length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(3);
  });

  test('clicking a plan card shows DaySelector and DayMealsView', async () => {
    const ids = await mp.getPlanCardIds();
    await mp.planCard(ids[0]).click();
    await expect(mp.daySelector).toBeVisible({ timeout: 5000 });
    await expect(mp.dayMealsView).toBeVisible({ timeout: 5000 });
  });

  test('active plan is auto-selected on page load', async () => {
    await expect(mp.daySelector).toBeVisible({ timeout: 10000 });
    await expect(mp.dayMealsView).toBeVisible({ timeout: 10000 });
  });

  test('DaySelector renders exactly 7 day buttons', async () => {
    for (let day = 1; day <= 7; day++) {
      await expect(mp.dayButton(day)).toBeVisible({ timeout: 5000 });
    }
  });

  test('clicking a day button updates DayMealsView heading', async () => {
    await mp.dayButton(3).click();
    await expect(mp.dayMealsHeading).toContainText(/wednesday/i, { timeout: 10000 });
  });

  test('URL updates with planId and day params after selection', async ({ page }) => {
    const ids = await mp.getPlanCardIds();
    await mp.planCard(ids[1]).click();
    await mp.dayButton(5).click();
    await expect(page).toHaveURL(/planId=/, { timeout: 5000 });
    await expect(page).toHaveURL(/day=5/, { timeout: 5000 });
  });

  test('days with seeded meals show non-zero calorie totals', async () => {
    // Active plan has meals on Monday (seed day 1 = DaySelector button 1)
    const caloriesText = await mp.dayCalories(1).textContent({ timeout: 5000 });
    expect(caloriesText).not.toMatch(/^0\s/);
  });
});

// ── Block 9: Add meal — create mode ──────────────────────────────────────────

test.describe('013: Add meal — create mode', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: AUTH_FILES.professional2 });
  let mp: MealPlannerPage;
  let planId: string;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    planId = await createPlanViaApi(page, {
      name: 'Add Meal Test Plan',
      status: 'draft',
      ...DEFAULT_PLAN,
    });
    await mp.goto();
    await expect
      .poll(async () => (await mp.getPlanCardIds()).length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(1);
    await mp.planCard(planId).click();
    await expect(mp.daySelector).toBeVisible({ timeout: 5000 });
    await mp.dayButton(1).click();
  });

  test.afterEach(async ({ page }) => {
    await deletePlanViaApi(page, planId);
  });

  test('clicking Add Meal button opens MealModal in create mode', async () => {
    await mp.addMealButton.click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await expect(mp.mealModalTitle).toContainText(/create/i);
  });

  test('dashed Add Meal card also opens MealModal', async () => {
    await mp.addMealCard.click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
  });

  test('MealModal has type select, food search, cancel and save buttons', async () => {
    await mp.addMealButton.click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await expect(mp.mealTypeSelect).toBeVisible();
    await expect(mp.mealFoodSearch).toBeVisible();
    await expect(mp.mealModalCancel).toBeVisible();
    await expect(mp.mealModalSave).toBeVisible();
  });

  test('Save button is disabled until a food is added', async () => {
    await mp.addMealButton.click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await expect(mp.mealModalSave).toBeDisabled();
  });

  test('searching food shows result items', async ({ page }) => {
    await mp.addMealButton.click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await mp.mealFoodSearch.fill('chicken');
    await page.waitForTimeout(600);
    await expect(page.getByTestId('food-result-item').first()).toBeVisible({ timeout: 10000 });
  });

  test('selecting a food adds it to items list and enables save', async ({ page }) => {
    await mp.addMealButton.click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await mp.mealFoodSearch.fill('chicken');
    await page.waitForTimeout(600);
    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);
    await expect(mp.mealItemsList).toBeVisible({ timeout: 5000 });
    await expect(mp.mealModalSave).toBeEnabled({ timeout: 5000 });
  });

  test('meal summary shows kcal > 0 after adding a food', async ({ page }) => {
    await mp.addMealButton.click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await mp.mealFoodSearch.fill('chicken');
    await page.waitForTimeout(600);
    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);
    const kcalText = await mp.mealSummaryKcal.textContent({ timeout: 5000 });
    expect(Number(kcalText?.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0);
  });

  test('changing quantity updates the summary kcal', async ({ page }) => {
    await mp.addMealButton.click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await mp.mealFoodSearch.fill('chicken');
    await page.waitForTimeout(600);
    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);
    const initialKcal = await mp.mealSummaryKcal.textContent({ timeout: 5000 });
    await mp.mealItemQtyInput(0).clear();
    await mp.mealItemQtyInput(0).fill('500');
    await mp.mealItemQtyInput(0).blur();
    await page.waitForTimeout(300);
    const updatedKcal = await mp.mealSummaryKcal.textContent({ timeout: 5000 });
    expect(updatedKcal).not.toBe(initialKcal);
  });

  test('removing item via X button disables save again', async ({ page }) => {
    await mp.addMealButton.click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await mp.mealFoodSearch.fill('chicken');
    await page.waitForTimeout(600);
    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);
    await expect(mp.mealModalSave).toBeEnabled({ timeout: 5000 });
    await mp.mealItemRemove(0).click();
    await expect(mp.mealModalSave).toBeDisabled({ timeout: 5000 });
  });

  test('Cancel closes modal without creating a meal card', async ({ page }) => {
    await mp.addMealButton.click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await mp.mealFoodSearch.fill('chicken');
    await page.waitForTimeout(600);
    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);
    await mp.mealModalCancel.click();
    await expect(mp.mealModal).not.toBeVisible({ timeout: 5000 });
    const mealIds = await mp.getMealCardIds();
    expect(mealIds).toHaveLength(0);
  });

  test('submitting modal creates a MealCard in DayMealsView', async ({ page }) => {
    await mp.addMealButton.click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await mp.mealFoodSearch.fill('chicken');
    await page.getByTestId('food-result-item').first().waitFor({ state: 'visible', timeout: 7000 });
    await page.getByTestId('food-result-item').first().click();
    await expect(mp.mealModalSave).toBeEnabled({ timeout: 5000 });
    await mp.mealModalSave.click();
    await expect(mp.mealModal).not.toBeVisible({ timeout: 10000 });
    await expect
      .poll(async () => (await mp.getMealCardIds()).length, { timeout: 10000 })
      .toBe(1);
  });

  test('created meal card shows correct meal type label', async ({ page }) => {
    await mp.addMealButton.click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    // Change meal type to Lunch before searching
    await mp.mealTypeSelect.click();
    await page.getByRole('option', { name: /lunch/i }).click();
    await mp.mealFoodSearch.fill('chicken');
    await page.waitForTimeout(600);
    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);
    await mp.mealModalSave.click();
    await expect(mp.mealModal).not.toBeVisible({ timeout: 10000 });
    const ids = await mp.getMealCardIds();
    expect(ids.length).toBe(1);
    await expect(mp.mealCard(ids[0])).toContainText(/lunch/i);
  });

  test('created meal card footer shows non-zero total calories', async ({ page }) => {
    await mp.addMealButton.click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await mp.mealFoodSearch.fill('chicken');
    await page.waitForTimeout(600);
    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);
    await mp.mealModalSave.click();
    await expect(mp.mealModal).not.toBeVisible({ timeout: 10000 });
    const ids = await mp.getMealCardIds();
    await expect
      .poll(
        async () => {
          const kcalText = await mp.mealTotalCalories(ids[0]).textContent({ timeout: 5000 });
          return Number(kcalText?.replace(/[^0-9.]/g, '') || 0);
        },
        { timeout: 10000 },
      )
      .toBeGreaterThan(0);
  });
});

// ── Block 10: Edit meal ───────────────────────────────────────────────────────

test.describe('013: Edit meal', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: AUTH_FILES.muscleGain });
  let mp: MealPlannerPage;
  let planId: string;
  let mealId: string;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    planId = await createPlanViaApi(page, {
      name: 'Edit Meal Test Plan',
      status: 'draft',
      ...DEFAULT_PLAN,
    });
    mealId = await createMealViaApi(page, planId, 'breakfast', 1);
    await mp.goto();
    await mp.planCard(planId).click();
    await expect(mp.daySelector).toBeVisible({ timeout: 5000 });
    await mp.dayButton(1).click();
    await expect
      .poll(async () => (await mp.getMealCardIds()).length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(1);
  });

  test.afterEach(async ({ page }) => {
    await deletePlanViaApi(page, planId);
  });

  test('clicking a MealCard opens MealModal in edit mode', async () => {
    await mp.mealCard(mealId).click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await expect(mp.mealModalTitle).toContainText(/edit/i);
  });

  test('edit modal pre-fills existing meal type', async () => {
    await mp.mealCard(mealId).click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await expect(mp.mealTypeSelect).toContainText(/breakfast/i);
  });

  test('adding food in edit mode and saving persists the item', async ({ page }) => {
    await mp.mealCard(mealId).click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await mp.mealFoodSearch.fill('apple');
    await page.waitForTimeout(600);
    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);
    await mp.mealModalSave.click();
    await expect(mp.mealModal).not.toBeVisible({ timeout: 10000 });
    // Reopen and check item is still there
    await mp.page.reload();
    await mp.planCard(planId).click();
    await mp.dayButton(1).click();
    await mp.mealCard(mealId).click();
    await expect(mp.mealItemsList).toBeVisible({ timeout: 5000 });
    await mp.mealModalCancel.click();
  });

  test('changing meal type and saving updates the card label', async ({ page }) => {
    await mp.mealCard(mealId).click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await mp.mealTypeSelect.click();
    await page.getByRole('option', { name: /lunch/i }).click();
    // Add a food so save is enabled
    await mp.mealFoodSearch.fill('apple');
    await page.waitForTimeout(600);
    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);
    await mp.mealModalSave.click();
    await expect(mp.mealModal).not.toBeVisible({ timeout: 10000 });
    await expect(mp.mealCard(mealId)).toContainText(/lunch/i);
  });
});

// ── Block 11: Delete meal ─────────────────────────────────────────────────────

test.describe('013: Delete meal', () => {
  test.use({ storageState: AUTH_FILES.performance });
  let mp: MealPlannerPage;
  let planId: string;
  let mealId: string;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    planId = await createPlanViaApi(page, {
      name: 'Delete Meal Test Plan',
      status: 'draft',
      ...DEFAULT_PLAN,
    });
    mealId = await createMealViaApi(page, planId, 'dinner', 1);
    await mp.goto();
    await mp.planCard(planId).click();
    await expect(mp.daySelector).toBeVisible({ timeout: 5000 });
    await mp.dayButton(1).click();
    await expect
      .poll(async () => (await mp.getMealCardIds()).length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(1);
  });

  test.afterEach(async ({ page }) => {
    await deletePlanViaApi(page, planId);
  });

  test('clicking delete icon opens confirmation dialog', async () => {
    await mp.mealDeleteBtn(mealId).click();
    await expect(mp.mealDeleteConfirm).toBeVisible({ timeout: 5000 });
  });

  test('cancelling keeps meal card visible', async ({ page }) => {
    await mp.mealDeleteBtn(mealId).click();
    await expect(mp.mealDeleteConfirm).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(mp.mealCard(mealId)).toBeVisible({ timeout: 5000 });
  });

  test('confirming removes meal card from view', async () => {
    await mp.mealDeleteBtn(mealId).click();
    await expect(mp.mealDeleteConfirm).toBeVisible({ timeout: 5000 });
    await mp.mealDeleteConfirm.click();
    await expect(mp.mealCard(mealId)).not.toBeVisible({ timeout: 10000 });
  });

  test('after deleting all meals day shows 0 meal cards', async () => {
    await mp.mealDeleteBtn(mealId).click();
    await expect(mp.mealDeleteConfirm).toBeVisible({ timeout: 5000 });
    await mp.mealDeleteConfirm.click();
    await expect
      .poll(
        async () => (await mp.page.locator('[data-testid^="meal-card-"]').count()),
        { timeout: 10000 },
      )
      .toBe(0);
  });
});

// ── Block 12: Item quantity update ────────────────────────────────────────────

test.describe('013: Item quantity update', () => {
  test.use({ storageState: AUTH_FILES.muscleGain });
  let mp: MealPlannerPage;
  let planId: string;
  let mealId: string;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    planId = await createPlanViaApi(page, {
      name: 'Qty Update Test Plan',
      status: 'draft',
      ...DEFAULT_PLAN,
    });
    mealId = await createMealViaApi(page, planId, 'lunch', 1);
    await mp.goto();
    await mp.planCard(planId).click();
    await expect(mp.daySelector).toBeVisible({ timeout: 5000 });
    await mp.dayButton(1).click();
    // Open edit modal and add a food item
    await mp.mealCard(mealId).click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await mp.mealFoodSearch.fill('chicken');
    await page.waitForTimeout(600);
    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);
  });

  test.afterEach(async ({ page }) => {
    await deletePlanViaApi(page, planId);
  });

  test('increasing quantity increases summary kcal', async ({ page }) => {
    const initialKcal = await mp.mealSummaryKcal.textContent({ timeout: 5000 });
    await mp.mealItemQtyInput(0).clear();
    await mp.mealItemQtyInput(0).fill('500');
    await mp.mealItemQtyInput(0).blur();
    await page.waitForTimeout(300);
    const newKcal = await mp.mealSummaryKcal.textContent({ timeout: 5000 });
    expect(Number(newKcal?.replace(/[^0-9.]/g, ''))).toBeGreaterThan(
      Number(initialKcal?.replace(/[^0-9.]/g, '')),
    );
    await mp.mealModalCancel.click();
  });

  test('decreasing quantity decreases summary kcal', async ({ page }) => {
    // First set a high quantity
    await mp.mealItemQtyInput(0).clear();
    await mp.mealItemQtyInput(0).fill('300');
    await mp.mealItemQtyInput(0).blur();
    await page.waitForTimeout(300);
    const highKcal = await mp.mealSummaryKcal.textContent({ timeout: 5000 });
    // Now reduce
    await mp.mealItemQtyInput(0).clear();
    await mp.mealItemQtyInput(0).fill('50');
    await mp.mealItemQtyInput(0).blur();
    await page.waitForTimeout(300);
    const lowKcal = await mp.mealSummaryKcal.textContent({ timeout: 5000 });
    expect(Number(lowKcal?.replace(/[^0-9.]/g, ''))).toBeLessThan(
      Number(highKcal?.replace(/[^0-9.]/g, '')),
    );
    await mp.mealModalCancel.click();
  });
});

// ── Block 13: Copy day ────────────────────────────────────────────────────────

test.describe('013: Copy day', () => {
  test.use({ storageState: AUTH_FILES.mealPlannerA });
  let mp: MealPlannerPage;
  let planId: string;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    planId = await createPlanViaApi(page, {
      name: 'Copy Day Test Plan',
      status: 'draft',
      ...DEFAULT_PLAN,
    });
    // Create a meal on day 1 (Monday) so Copy Day has a source
    await createMealViaApi(page, planId, 'breakfast', 1);
    await mp.goto();
    await mp.planCard(planId).click();
    await expect(mp.daySelector).toBeVisible({ timeout: 5000 });
    // Navigate to day 3 (Wednesday) which has no meals — Copy Day button should be visible
    await mp.dayButton(3).click();
  });

  test.afterEach(async ({ page }) => {
    await deletePlanViaApi(page, planId);
  });

  test('Copy Day button is visible when another day has meals', async () => {
    await expect(mp.copyDayButton).toBeVisible({ timeout: 5000 });
  });

  test('clicking Copy Day button opens the popover', async () => {
    await mp.copyDayButton.click();
    await expect(mp.copyDayPopover).toBeVisible({ timeout: 5000 });
  });

  test('Copy Day popover shows at least one source day option', async ({ page }) => {
    await mp.copyDayButton.click();
    await expect(mp.copyDayPopover).toBeVisible({ timeout: 5000 });
    // Day 1 has a meal, so it should appear
    const anyDayOption = page.locator('[data-testid^="copy-from-day-"]').first();
    await expect(anyDayOption).toBeVisible({ timeout: 5000 });
  });

  test('copying from day 1 populates current day with meal cards', async () => {
    await mp.copyDayButton.click();
    await expect(mp.copyDayPopover).toBeVisible({ timeout: 5000 });
    await mp.copyFromDay(1).click();
    await expect
      .poll(async () => (await mp.getMealCardIds()).length, { timeout: 10000 })
      .toBeGreaterThan(0);
  });

  test('copy replaces existing meals on target day', async ({ page }) => {
    // Also add a meal on day 1 to have 2 meals there
    await createMealViaApi(page, planId, 'lunch', 1);
    // Add a meal on day 3 (target) so it has 1 meal before copy
    await createMealViaApi(page, planId, 'dinner', 3);
    await mp.goto();
    await mp.planCard(planId).click();
    await mp.dayButton(3).click();
    await expect
      .poll(async () => (await mp.getMealCardIds()).length, { timeout: 10000 })
      .toBe(1);

    // Copy from day 1 (has 2 meals) to day 3 (currently 1 meal)
    await mp.copyDayButton.click();
    await expect(mp.copyDayPopover).toBeVisible({ timeout: 5000 });
    await mp.copyFromDay(1).click();

    // Day 3 should now have 2 meals (same as day 1)
    await expect
      .poll(async () => (await mp.getMealCardIds()).length, { timeout: 10000 })
      .toBe(2);
  });
});

// ── Block 14: Plan completeness ───────────────────────────────────────────────

test.describe('013: Plan completeness', () => {
  test.use({ storageState: AUTH_FILES.testUser });
  let mp: MealPlannerPage;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    await mp.goto();
    await expect
      .poll(async () => (await mp.getPlanCardIds()).length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(3);
  });

  test('fully-populated active plan shows completeness > 0%', async () => {
    const ids = await mp.getPlanCardIds();
    let activeId = '';
    for (const id of ids) {
      const text = await mp.planStatusBadge(id).textContent();
      if (text && /active/i.test(text)) {
        activeId = id;
        break;
      }
    }
    const completenessText = await mp.planCompleteness(activeId).textContent({ timeout: 5000 });
    const value = Number(completenessText?.replace(/[^0-9.]/g, ''));
    expect(value).toBeGreaterThan(0);
  });

  test('draft plan with partial week shows lower completeness than active plan', async () => {
    const ids = await mp.getPlanCardIds();
    let activeId = '';
    let draftId = '';
    for (const id of ids) {
      const text = await mp.planStatusBadge(id).textContent();
      if (text && /active/i.test(text)) activeId = id;
      if (text && /draft/i.test(text)) draftId = id;
    }
    const activeText = await mp.planCompleteness(activeId).textContent({ timeout: 5000 });
    const draftText = await mp.planCompleteness(draftId).textContent({ timeout: 5000 });
    const activeValue = Number(activeText?.replace(/[^0-9.]/g, ''));
    const draftValue = Number(draftText?.replace(/[^0-9.]/g, ''));
    expect(activeValue).toBeGreaterThanOrEqual(draftValue);
  });
});

// ── Block 15: URL parameter persistence ──────────────────────────────────────

test.describe('013: URL parameter persistence', () => {
  test.use({ storageState: AUTH_FILES.testUser });
  let mp: MealPlannerPage;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    await mp.goto();
    await expect
      .poll(async () => (await mp.getPlanCardIds()).length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(3);
  });

  test('loading /meal-planner?planId=X&day=3 pre-selects plan and day', async ({ page }) => {
    // Get the active plan ID from the carousel
    const ids = await mp.getPlanCardIds();
    let activeId = '';
    for (const id of ids) {
      const text = await mp.planStatusBadge(id).textContent();
      if (text && /active/i.test(text)) {
        activeId = id;
        break;
      }
    }
    // Navigate directly with params
    await page.goto(`/meal-planner?planId=${activeId}&day=3`);
    await page.waitForLoadState('networkidle');
    await expect(mp.dayMealsHeading).toContainText(/wednesday/i, { timeout: 10000 });
  });

  test('selecting a day updates the URL with day param', async ({ page }) => {
    await mp.dayButton(5).click();
    await expect(page).toHaveURL(/day=5/, { timeout: 5000 });
  });
});

// ── Block 16: Seeded meal card detail ─────────────────────────────────────────

test.describe('013: Seeded meal card detail', () => {
  test.use({ storageState: AUTH_FILES.testUser });
  let mp: MealPlannerPage;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    await mp.goto();
    // Wait for active plan to auto-select
    await expect(mp.daySelector).toBeVisible({ timeout: 10000 });
    // Select Monday (day 1) — seed has meals for dayOfWeek=1
    await mp.dayButton(1).click();
    await expect
      .poll(async () => (await mp.getMealCardIds()).length, { timeout: 10000 })
      .toBeGreaterThan(0);
  });

  test('seeded day shows meal cards with food item rows', async ({ page }) => {
    const itemRows = page.locator('[data-testid^="meal-item-row-"]');
    await expect
      .poll(async () => await itemRows.count(), { timeout: 10000 })
      .toBeGreaterThan(0);
  });

  test('MealCard footer shows non-zero calories for meals with items', async () => {
    const ids = await mp.getMealCardIds();
    const kcalText = await mp.mealTotalCalories(ids[0]).textContent({ timeout: 5000 });
    expect(Number(kcalText?.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0);
  });
});

// ── Block 17: Copy meal ───────────────────────────────────────────────────────

test.describe('013: Copy meal', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: AUTH_FILES.mealPlannerB });
  let mp: MealPlannerPage;
  let planId: string;
  let mealId: string;

  test.beforeEach(async ({ page }) => {
    mp = new MealPlannerPage(page);
    planId = await createPlanViaApi(page, {
      name: 'Copy Meal Test Plan',
      status: 'draft',
      ...DEFAULT_PLAN,
    });
    mealId = await createMealViaApi(page, planId, 'breakfast', 1);
    await mp.goto();
    await mp.planCard(planId).click();
    await expect(mp.daySelector).toBeVisible({ timeout: 5000 });
    await mp.dayButton(1).click();
    await expect
      .poll(async () => (await mp.getMealCardIds()).length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(1);
  });

  test.afterEach(async ({ page }) => {
    await deletePlanViaApi(page, planId);
  });

  test('copy meal button is visible in the meal card header', async () => {
    await expect(mp.copyMealBtn(mealId)).toBeVisible({ timeout: 5000 });
  });

  test('clicking copy meal button opens the popover', async () => {
    await mp.copyMealBtn(mealId).click();
    await expect(mp.copyMealPopover()).toBeVisible({ timeout: 5000 });
  });

  test('popover does not include the source meal type', async () => {
    await mp.copyMealBtn(mealId).click();
    await expect(mp.copyMealPopover()).toBeVisible({ timeout: 5000 });
    // breakfast is the source — it must not appear as a copy target
    await expect(mp.copyToMealType('breakfast')).not.toBeVisible();
  });

  test('popover shows other meal types as options', async () => {
    await mp.copyMealBtn(mealId).click();
    await expect(mp.copyMealPopover()).toBeVisible({ timeout: 5000 });
    await expect(mp.copyToMealType('lunch')).toBeVisible();
    await expect(mp.copyToMealType('dinner')).toBeVisible();
  });

  test('copying to a new meal type creates that meal card on the same day', async ({ page }) => {
    // Add a food to the source breakfast meal so there is something to copy
    await mp.mealCard(mealId).click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await mp.mealFoodSearch.fill('chicken');
    await page.waitForTimeout(600);
    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);
    await mp.mealModalSave.click();
    await expect(mp.mealModal).not.toBeVisible({ timeout: 10000 });

    // Now copy breakfast → lunch
    await mp.copyMealBtn(mealId).click();
    await expect(mp.copyMealPopover()).toBeVisible({ timeout: 5000 });
    await mp.copyToMealType('lunch').click();

    // A new lunch meal card should appear
    await expect
      .poll(async () => (await mp.getMealCardIds()).length, { timeout: 10000 })
      .toBe(2);

    // Verify a card with "lunch" label is present
    const ids = await mp.getMealCardIds();
    const lunchCard = ids.find((id) => id !== mealId);
    expect(lunchCard).toBeDefined();
    await expect(mp.mealCard(lunchCard!)).toContainText(/lunch/i);
  });

  test('copied meal card shows non-zero calories matching the source', async ({ page }) => {
    // Add food to source meal
    await mp.mealCard(mealId).click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await mp.mealFoodSearch.fill('chicken');
    await page.waitForTimeout(600);
    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);
    await mp.mealModalSave.click();
    await expect(mp.mealModal).not.toBeVisible({ timeout: 10000 });

    // Record source calories after the meal card footer refreshes.
    await expect
      .poll(
        async () => {
          const text = await mp.mealTotalCalories(mealId).textContent({ timeout: 5000 });
          return Number(text?.replace(/[^0-9.]/g, '') || 0);
        },
        { timeout: 10000 },
      )
      .toBeGreaterThan(0);
    const sourceKcal = (await mp.mealTotalCalories(mealId).textContent({ timeout: 5000 }))?.trim() ?? '';

    // Copy breakfast → dinner
    await mp.copyMealBtn(mealId).click();
    await expect(mp.copyMealPopover()).toBeVisible({ timeout: 5000 });
    await mp.copyToMealType('dinner').click();

    await expect
      .poll(async () => (await mp.getMealCardIds()).length, { timeout: 10000 })
      .toBe(2);

    const ids = await mp.getMealCardIds();
    const dinnerMealId = ids.find((id) => id !== mealId)!;

    await expect
      .poll(
        async () => {
          const text = await mp.mealTotalCalories(dinnerMealId).textContent({ timeout: 5000 });
          return text?.trim() ?? null;
        },
        { timeout: 10000 },
      )
      .toBe(sourceKcal);
  });

  test('copying to an existing meal replaces its contents', async ({ page }) => {
    // Create a separate lunch meal with its own food
    const lunchMealId = await createMealViaApi(page, planId, 'lunch', 1);
    await mp.goto();
    await mp.planCard(planId).click();
    await mp.dayButton(1).click();
    await expect
      .poll(async () => (await mp.getMealCardIds()).length, { timeout: 10000 })
      .toBe(2);

    // Add food to breakfast (source)
    await mp.mealCard(mealId).click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await mp.mealFoodSearch.fill('chicken');
    await page.waitForTimeout(600);
    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);
    await mp.mealModalSave.click();
    await expect(mp.mealModal).not.toBeVisible({ timeout: 10000 });

    await expect
      .poll(
        async () => {
          const text = await mp.mealTotalCalories(mealId).textContent({ timeout: 5000 });
          return Number(text?.replace(/[^0-9.]/g, '') || 0);
        },
        { timeout: 10000 },
      )
      .toBeGreaterThan(0);
    const sourceKcal = Number(
      ((await mp.mealTotalCalories(mealId).textContent({ timeout: 5000 })) ?? '').replace(/[^0-9.]/g, '') || 0,
    );

    // Add different food to lunch (target) — it should be replaced after copy
    await mp.mealCard(lunchMealId).click();
    await expect(mp.mealModal).toBeVisible({ timeout: 5000 });
    await mp.mealFoodSearch.fill('apple');
    await page.waitForTimeout(600);
    await page.getByTestId('food-result-item').first().click();
    await page.waitForTimeout(500);
    await mp.mealModalSave.click();
    await expect(mp.mealModal).not.toBeVisible({ timeout: 10000 });

    // Copy breakfast → lunch (replace)
    await mp.copyMealBtn(mealId).click();
    await expect(mp.copyMealPopover()).toBeVisible({ timeout: 5000 });
    await mp.copyToMealType('lunch').click();

    // Meal count stays at 2 (lunch was replaced, not added)
    await expect
      .poll(async () => (await mp.getMealCardIds()).length, { timeout: 10000 })
      .toBe(2);

    // Lunch calories now match breakfast (same food was copied)
    await expect
      .poll(
        async () => {
          const text = await mp.mealTotalCalories(lunchMealId).textContent({ timeout: 5000 });
          return Number(text?.replace(/[^0-9.]/g, '') || 0);
        },
        { timeout: 15000 },
      )
      .toBe(sourceKcal);
  });
});

// ── Block 18: Auth redirect ───────────────────────────────────────────────────

test.describe('013: Auth redirect', () => {
  test('unauthenticated access to /meal-planner redirects to /login', async ({ page }) => {
    await page.goto('/meal-planner');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
