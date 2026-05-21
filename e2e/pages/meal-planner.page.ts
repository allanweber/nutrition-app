import { type Page, type Locator } from '@playwright/test';

export class MealPlannerPage {
  readonly page: Page;

  // ── Layout ────────────────────────────────────────────────
  readonly heading: Locator;
  readonly emptyState: Locator;

  // ── PlanCarousel ──────────────────────────────────────────
  readonly planCarousel: Locator;
  readonly addNewPlanCard: Locator;

  // ── NewPlanModal ──────────────────────────────────────────
  readonly newPlanModal: Locator;
  readonly planNameInput: Locator;
  readonly planDescriptionInput: Locator;
  readonly planTargetCaloriesInput: Locator;
  readonly planTargetProteinInput: Locator;
  readonly planTargetCarbsInput: Locator;
  readonly planTargetFatInput: Locator;
  readonly planStartDateInput: Locator;
  readonly planEndDateInput: Locator;
  readonly planStatusActive: Locator;
  readonly planStatusDraft: Locator;
  readonly planStatusArchived: Locator;
  readonly newPlanCancel: Locator;
  readonly newPlanSubmit: Locator;
  readonly editPlanSubmit: Locator;
  readonly planNameError: Locator;

  // ── Conflict AlertDialog ──────────────────────────────────
  readonly conflictDialog: Locator;
  readonly conflictConfirm: Locator;
  readonly conflictCancel: Locator;
  readonly conflictDescription: Locator;

  // ── DaySelector / DayMealsView ────────────────────────────
  readonly daySelector: Locator;
  readonly dayMealsView: Locator;
  readonly dayMealsHeading: Locator;
  readonly addMealButton: Locator;
  readonly addMealCard: Locator;
  readonly copyDayButton: Locator;
  readonly copyDayPopover: Locator;

  // ── MealModal ─────────────────────────────────────────────
  readonly mealModal: Locator;
  readonly mealModalTitle: Locator;
  readonly mealTypeSelect: Locator;
  readonly mealFoodSearch: Locator;
  readonly mealItemsList: Locator;
  readonly mealSummaryKcal: Locator;
  readonly mealSummaryProtein: Locator;
  readonly mealSummaryCarbs: Locator;
  readonly mealSummaryFat: Locator;
  readonly mealModalCancel: Locator;
  readonly mealModalSave: Locator;

  // ── Delete dialogs ────────────────────────────────────────
  readonly planDeleteConfirm: Locator;
  readonly planDeleteCancel: Locator;
  readonly mealDeleteConfirm: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByTestId('meal-planner-heading');
    this.emptyState = page.getByTestId('meal-planner-empty-state');

    this.planCarousel = page.getByTestId('plan-carousel');
    this.addNewPlanCard = page.getByTestId('add-new-plan-card');

    this.newPlanModal = page.getByTestId('new-plan-modal');
    this.planNameInput = page.getByTestId('plan-name-input');
    this.planDescriptionInput = page.getByTestId('plan-description-input');
    this.planTargetCaloriesInput = page.getByTestId('plan-target-calories-input');
    this.planTargetProteinInput = page.getByTestId('plan-target-protein-input');
    this.planTargetCarbsInput = page.getByTestId('plan-target-carbs-input');
    this.planTargetFatInput = page.getByTestId('plan-target-fat-input');
    this.planStartDateInput = page.getByTestId('plan-start-date-input');
    this.planEndDateInput = page.getByTestId('plan-end-date-input');
    this.planStatusActive = page.getByTestId('plan-status-active');
    this.planStatusDraft = page.getByTestId('plan-status-draft');
    this.planStatusArchived = page.getByTestId('plan-status-archived');
    this.newPlanCancel = page.getByTestId('new-plan-cancel');
    this.newPlanSubmit = page.getByTestId('new-plan-submit');
    this.editPlanSubmit = page.getByTestId('edit-plan-submit');
    this.planNameError = page.getByTestId('plan-name-error');

    this.conflictDialog = page.getByTestId('activate-conflict-dialog');
    this.conflictConfirm = page.getByTestId('activate-conflict-confirm');
    this.conflictCancel = page.getByTestId('activate-conflict-cancel');
    this.conflictDescription = page.getByTestId('activate-conflict-description');

    this.daySelector = page.getByTestId('day-selector');
    this.dayMealsView = page.getByTestId('day-meals-view');
    this.dayMealsHeading = page.getByTestId('day-meals-heading');
    this.addMealButton = page.getByTestId('add-meal-button');
    this.addMealCard = page.getByTestId('add-meal-card');
    this.copyDayButton = page.getByTestId('copy-day-button');
    this.copyDayPopover = page.getByTestId('copy-day-popover');

    this.mealModal = page.getByTestId('meal-modal');
    this.mealModalTitle = page.getByTestId('meal-modal-title');
    this.mealTypeSelect = page.getByTestId('meal-type-select');
    this.mealFoodSearch = page.getByTestId('meal-food-search');
    this.mealItemsList = page.getByTestId('meal-items-list');
    this.mealSummaryKcal = page.getByTestId('meal-summary-kcal');
    this.mealSummaryProtein = page.getByTestId('meal-summary-protein');
    this.mealSummaryCarbs = page.getByTestId('meal-summary-carbs');
    this.mealSummaryFat = page.getByTestId('meal-summary-fat');
    this.mealModalCancel = page.getByTestId('meal-modal-cancel');
    this.mealModalSave = page.getByTestId('meal-modal-save');

    this.planDeleteConfirm = page.getByTestId('plan-delete-confirm');
    this.planDeleteCancel = page.getByTestId('plan-delete-cancel');
    this.mealDeleteConfirm = page.getByTestId('meal-delete-confirm');
  }

  async goto() {
    await this.page.goto('/meal-planner');
    await this.page.waitForLoadState('networkidle');
  }

  // ── Scoped per-ID locators ────────────────────────────────

  planCard(planId: string): Locator {
    return this.page.getByTestId(`plan-card-${planId}`);
  }

  planStatusBadge(planId: string): Locator {
    return this.page.getByTestId(`plan-status-badge-${planId}`);
  }

  planName(planId: string): Locator {
    return this.page.getByTestId(`plan-name-${planId}`);
  }

  planTargetCalories(planId: string): Locator {
    return this.page.getByTestId(`plan-target-calories-${planId}`);
  }

  planAvgCalories(planId: string): Locator {
    return this.page.getByTestId(`plan-avg-calories-${planId}`);
  }

  planCompleteness(planId: string): Locator {
    return this.page.getByTestId(`plan-completeness-${planId}`);
  }

  planMenuTrigger(planId: string): Locator {
    return this.page.getByTestId(`plan-menu-trigger-${planId}`);
  }

  planMenuSetActive(planId: string): Locator {
    return this.page.getByTestId(`plan-menu-set-active-${planId}`);
  }

  planMenuSetDraft(planId: string): Locator {
    return this.page.getByTestId(`plan-menu-set-draft-${planId}`);
  }

  planMenuArchive(planId: string): Locator {
    return this.page.getByTestId(`plan-menu-archive-${planId}`);
  }

  planMenuDelete(planId: string): Locator {
    return this.page.getByTestId(`plan-menu-delete-${planId}`);
  }

  planMenuEdit(planId: string): Locator {
    return this.page.getByTestId(`plan-menu-edit-${planId}`);
  }

  planMenuDuplicate(planId: string): Locator {
    return this.page.getByTestId(`plan-menu-duplicate-${planId}`);
  }

  planDeleteConfirmInCard(planId: string): Locator {
    return this.planCard(planId).getByTestId('plan-delete-confirm');
  }

  dayButton(n: number): Locator {
    return this.page.getByTestId(`day-button-${n}`);
  }

  dayCalories(n: number): Locator {
    return this.page.getByTestId(`day-calories-${n}`);
  }

  mealCard(mealId: string): Locator {
    return this.page.getByTestId(`meal-card-${mealId}`);
  }

  mealDeleteBtn(mealId: string): Locator {
    return this.page.getByTestId(`meal-delete-btn-${mealId}`);
  }

  mealTotalCalories(mealId: string): Locator {
    return this.page.getByTestId(`meal-total-calories-${mealId}`);
  }

  mealItemRow(itemId: string): Locator {
    return this.page.getByTestId(`meal-item-row-${itemId}`);
  }

  mealItemQtyInput(index: number): Locator {
    return this.page.getByTestId(`meal-item-qty-input-${index}`);
  }

  mealItemMeasureSelect(index: number): Locator {
    return this.page.getByTestId(`meal-item-measure-select-${index}`);
  }

  mealItemRemove(index: number): Locator {
    return this.page.getByTestId(`meal-item-remove-${index}`);
  }

  copyFromDay(n: number): Locator {
    return this.page.getByTestId(`copy-from-day-${n}`);
  }

  copyMealBtn(mealId: string): Locator {
    return this.page.getByTestId(`copy-meal-btn-${mealId}`);
  }

  copyMealPopover(): Locator {
    return this.page.getByTestId('copy-meal-popover');
  }

  copyToMealType(mealType: string): Locator {
    return this.page.getByTestId(`copy-to-meal-type-${mealType}`);
  }

  // ── Bulk ID helpers ───────────────────────────────────────

  async getPlanCardIds(): Promise<string[]> {
    const cards = this.page.locator('[data-testid^="plan-card-"]');
    const count = await cards.count();
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const testId = await cards.nth(i).getAttribute('data-testid');
      if (testId) ids.push(testId.replace('plan-card-', ''));
    }
    return ids;
  }

  async getMealCardIds(): Promise<string[]> {
    const cards = this.page.locator('[data-testid^="meal-card-"]');
    const count = await cards.count();
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const testId = await cards.nth(i).getAttribute('data-testid');
      if (testId) ids.push(testId.replace('meal-card-', ''));
    }
    return ids;
  }
}
