import { expect, test, type Page } from '@playwright/test';
import { AUTH_FILES } from './fixtures/test-data';
import { typeFoodSearch } from './helpers/food-search';

/** Number inputs need click + blur so TanStack Form picks up values (fill alone can leave servingQty empty). */
async function fillNumberField(page: Page, testId: string, value: string) {
  const input = page.getByTestId(testId);
  await input.click();
  await input.fill(value);
  await input.blur();
}

/** TanStack controlled text fields — retry until value sticks (fill alone can be lost on re-render). */
async function fillTextField(page: Page, testId: string, value: string) {
  const input = page.getByTestId(testId);
  for (let attempt = 0; attempt < 3; attempt++) {
    await input.click();
    await input.clear();
    await input.pressSequentially(value, { delay: 8 });
    await input.blur();
    if ((await input.inputValue()) === value) return;
    await page.waitForTimeout(150);
  }
  await expect(input).toHaveValue(value);
}

/** Required on submit — Radix Select portal can be slow; keyboard fallback selects first unit (g). */
async function selectServingUnitGrams(page: Page) {
  const combobox = page.getByRole('combobox', { name: /Serving Unit/i });
  await combobox.scrollIntoViewIfNeeded();
  await combobox.click();

  const gramsOption = page.getByRole('option', { name: 'Grams (g)' });
  const optionVisible = await gramsOption
    .waitFor({ state: 'visible', timeout: 8_000 })
    .then(() => true)
    .catch(() => false);

  if (optionVisible) {
    await gramsOption.click();
  } else {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  }

  await expect(combobox).toContainText(/Grams/i, { timeout: 8_000 });
}

test.describe('My Foods — golden paths', () => {
  // Same storageState user — avoid parallel create flows colliding.
  test.describe.configure({ mode: 'serial' });
  test.use({ storageState: AUTH_FILES.myFoods });

  test('create custom food → appears in list', async ({ page }) => {
    await page.goto('/my-foods/create', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('field-name')).toBeVisible({ timeout: 20_000 });

    const uniqueName = `E2E Custom Food ${Date.now()}`;
    await fillNumberField(page, 'field-servingQty', '1');
    await selectServingUnitGrams(page);
    await fillNumberField(page, 'field-servingWeightGrams', '30');
    await fillNumberField(page, 'field-calories', '200');
    await fillNumberField(page, 'field-protein', '20');
    await fillNumberField(page, 'field-carbs', '15');
    await fillNumberField(page, 'field-fat', '8');
    await fillTextField(page, 'field-name', uniqueName);

    const submit = page.getByTestId('submit-create-food');
    await expect(submit).toBeEnabled({ timeout: 20_000 });
    await expect(page.getByText('Serving unit is required')).not.toBeVisible();
    await submit.click();

    await expect(page).toHaveURL(/\/my-foods(\?|$)/, { timeout: 30_000 });
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 15_000 });
  });

  test('create dish with one ingredient → appears in list', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/my-foods/dishes/create', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('field-dish-name')).toBeVisible({ timeout: 20_000 });

    const uniqueName = `E2E Dish ${Date.now()}`;

    await typeFoodSearch(page, 'apple', { inputTestId: 'ingredient-search' });
    await page.getByTestId('food-result-item').first().click();

    // Ingredient row + nutrition hydration must finish before submit enables.
    await expect(page.getByText(/1 item/i)).toBeVisible({ timeout: 20_000 });

    await fillTextField(page, 'field-dish-name', uniqueName);

    const submit = page.getByTestId('submit-create-dish');
    await expect(submit).toBeEnabled({ timeout: 30_000 });
    await submit.click();

    await expect(page).toHaveURL(/\/my-foods\?tab=dishes/, { timeout: 60_000 });
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 15_000 });
  });
});
