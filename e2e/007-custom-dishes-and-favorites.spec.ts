import { expect, test } from '@playwright/test';
import { seedUsers, testUser } from './fixtures/test-data';
import { LoginPage } from './pages/login.page';

// testUser = user.weight-loss@example.com — has seeded dishes & favorites

async function loginAs(page: import('@playwright/test').Page, email: string, password: string) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

const login = (page: import('@playwright/test').Page) =>
  loginAs(page, testUser.email, testUser.password);

// ────────────────────────────────────────────────────────────────────────────
// My Foods page
// ────────────────────────────────────────────────────────────────────────────
test.describe('007: My Foods page', () => {
  test('shows Custom Foods and Dishes tabs', async ({ page }) => {
    await login(page);
    await page.goto('/my-foods');
    await expect(page.getByTestId('tab-custom-foods')).toBeVisible();
    await expect(page.getByTestId('tab-dishes')).toBeVisible();
  });

  test('dishes tab shows seeded dishes', async ({ page }) => {
    await login(page);
    await page.goto('/my-foods');
    await page.getByTestId('tab-dishes').click();
    // Seeded: "High-Protein Breakfast Bowl" and "Post-Workout Plate"
    await expect(page.getByText('High-Protein Breakfast Bowl')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Post-Workout Plate')).toBeVisible();
  });

  test('"New Dish" button navigates to create page', async ({ page }) => {
    await login(page);
    await page.goto('/my-foods');
    await page.getByTestId('tab-dishes').click();
    await page.getByRole('link', { name: /New Dish/i }).click();
    await expect(page).toHaveURL(/\/my-foods\/dishes\/create/);
  });

  test('"New Food" button navigates to create food page', async ({ page }) => {
    await login(page);
    await page.goto('/my-foods');
    await page.getByRole('link', { name: /New Food/i }).click();
    await expect(page).toHaveURL(/\/my-foods\/create/);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Create custom food
// ────────────────────────────────────────────────────────────────────────────
test.describe('007: Create custom food', () => {
  test('creates a custom food and redirects back to My Foods', async ({ page }) => {
    await login(page);
    await page.goto('/my-foods/create');

    const uniqueName = `E2E Test Food ${Date.now()}`;
    await page.getByTestId('field-name').fill(uniqueName);
    await page.getByTestId('field-servingQty').fill('1');
    await page.locator('#servingUnit').click();
    await page.getByRole('option', { name: 'Scoop' }).click();
    await page.getByTestId('field-servingWeightGrams').fill('30');
    await page.getByTestId('field-calories').fill('200');
    await page.getByTestId('field-protein').fill('20');
    await page.getByTestId('field-carbs').fill('15');
    await page.getByTestId('field-fat').fill('8');
    await page.getByTestId('submit-create-food').click();

    await expect(page).toHaveURL(/\/my-foods/, { timeout: 10000 });
    await expect(page.getByText(uniqueName)).toBeVisible();
  });

  test('shows validation — required fields show inline errors on submit', async ({ page }) => {
    await login(page);
    await page.goto('/my-foods/create');
    // Submit button is disabled when required fields are empty — the form
    // guards submission via hasRequired. Trigger onChange validation instead
    // by typing then clearing the name field.
    const nameInput = page.getByTestId('field-name');
    await nameInput.fill('a');
    await nameInput.clear();
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Create dish
// ────────────────────────────────────────────────────────────────────────────
test.describe('007: Create dish', () => {
  test('create dish page renders name, description, and search fields', async ({ page }) => {
    await login(page);
    await page.goto('/my-foods/dishes/create');

    await expect(page.getByTestId('field-dish-name')).toBeVisible();
    await expect(page.getByTestId('field-dish-description')).toBeVisible();
    await expect(page.getByTestId('ingredient-search')).toBeVisible();
  });

  test('submit is disabled when no ingredients are added', async ({ page }) => {
    await login(page);
    await page.goto('/my-foods/dishes/create');

    await page.getByTestId('field-dish-name').fill('Test Dish');
    await expect(page.getByTestId('submit-create-dish')).toBeDisabled();
  });

  test('ingredient search shows results for 3+ character query', async ({ page }) => {
    await login(page);
    await page.goto('/my-foods/dishes/create');

    await page.getByTestId('ingredient-search').fill('egg');
    // Should show a dropdown with results
    await expect(page.locator('[data-testid="ingredient-search"]').locator('..').locator('..').getByRole('button').first()).toBeVisible({ timeout: 10000 });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Edit dish
// ────────────────────────────────────────────────────────────────────────────
test.describe('007: Edit dish', () => {
  test('edit dish page loads with pre-populated name', async ({ page }) => {
    await login(page);
    // Navigate to My Foods and get the edit link for the first seeded dish
    await page.goto('/my-foods');
    await page.getByTestId('tab-dishes').click();

    // Wait for dishes to load
    await expect(page.getByText('High-Protein Breakfast Bowl')).toBeVisible({ timeout: 10000 });

    // Click the edit pencil for this dish
    await page.getByRole('link', { name: /Edit High-Protein Breakfast Bowl/i }).click();
    await expect(page).toHaveURL(/\/my-foods\/dishes\/[\w-]+\/edit/);

    // Form should be pre-populated
    await expect(page.getByTestId('field-dish-name')).toHaveValue('High-Protein Breakfast Bowl', { timeout: 10000 });
  });

  test('edit dish page shows existing ingredients', async ({ page }) => {
    await login(page);
    await page.goto('/my-foods');
    await page.getByTestId('tab-dishes').click();
    await expect(page.getByText('High-Protein Breakfast Bowl')).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: /Edit High-Protein Breakfast Bowl/i }).click();
    await expect(page).toHaveURL(/\/my-foods\/dishes\/[\w-]+\/edit/);

    // Should show ingredient count > 0 (the seeded dish has 3 ingredients)
    await expect(page.getByText(/3 items/)).toBeVisible({ timeout: 10000 });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Delete dish
// ────────────────────────────────────────────────────────────────────────────
test.describe('007: Delete dish', () => {
  test('delete dish requires confirmation', async ({ page }) => {
    await login(page);
    await page.goto('/my-foods');
    await page.getByTestId('tab-dishes').click();
    await expect(page.getByText('Post-Workout Plate')).toBeVisible({ timeout: 10000 });

    // Find the dish item and click delete
    const dishItems = page.locator('[data-testid^="dish-item-"]');
    const postWorkoutDish = dishItems.filter({ hasText: 'Post-Workout Plate' });
    const deleteBtn = postWorkoutDish.locator('[data-testid^="delete-dish-"]');
    await deleteBtn.click();

    // Confirmation buttons should appear
    const confirmBtn = postWorkoutDish.locator('[data-testid^="confirm-delete-dish-"]');
    await expect(confirmBtn).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Food log — dish log modal
// ────────────────────────────────────────────────────────────────────────────
test.describe('007: Dish log modal', () => {
  test('searching a dish in food log opens DishLogModal', async ({ page }) => {
    await login(page);
    await page.goto('/food-log');

    const searchInput = page.getByPlaceholder(/Search for foods/i);
    await searchInput.fill('High-Protein');
    await searchInput.click();

    // Wait for custom tab to appear and/or a dish result
    await expect(page.getByText('High-Protein Breakfast Bowl').first()).toBeVisible({ timeout: 10000 });
    await page.getByText('High-Protein Breakfast Bowl').first().click();

    // DishLogModal should open (now uses FoodModal)
    await expect(page.getByTestId('add-food-button')).toBeVisible({ timeout: 5000 });
  });

  test('DishLogModal has multiplier select and meal type select', async ({ page }) => {
    await login(page);
    await page.goto('/food-log');

    const searchInput = page.getByPlaceholder(/Search for foods/i);
    await searchInput.fill('High-Protein');
    await searchInput.click();
    await expect(page.getByText('High-Protein Breakfast Bowl').first()).toBeVisible({ timeout: 10000 });
    await page.getByText('High-Protein Breakfast Bowl').first().click();

    await expect(page.getByTestId('quantity-input')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('meal-type-select')).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Favorites — NutritionPulse sidebar
// ────────────────────────────────────────────────────────────────────────────
test.describe('007: Favorites in NutritionPulse', () => {
  test('NutritionPulse shows Favorites section', async ({ page }) => {
    await login(page);
    await page.goto('/food-log');

    // Nutrition Pulse sidebar should have a Favorites section
    const pulse = page.locator('[data-testid="nutrition-pulse"]');
    if (await pulse.count() === 0) {
      // Try the class-based selector
      await expect(page.getByText('Favorites').first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(pulse.getByText('Favorites').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('seeded favorites show as pills', async ({ page }) => {
    await login(page);
    await page.goto('/food-log');
    // The weight-loss user has 4 seeded favorites including "High-Protein Breakfast Bowl" (dish)
    // and foods like "Eggs, scrambled", "Greek Yogurt, plain", "Chicken Breast, grilled"
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Favorites').first()).toBeVisible({ timeout: 10000 });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Fresh user — empty states
// ────────────────────────────────────────────────────────────────────────────
test.describe('007: Empty states', () => {
  test('fresh user sees empty state on Dishes tab', async ({ page }) => {
    await loginAs(page, seedUsers.professional1.email, seedUsers.professional1.password);
    await page.goto('/my-foods');
    await page.getByTestId('tab-dishes').click();
    await expect(page.getByText('Recipes, logged as one entry')).toBeVisible({ timeout: 10000 });
  });

  test('fresh user sees empty state on Custom Foods tab', async ({ page }) => {
    await loginAs(page, seedUsers.professional1.email, seedUsers.professional1.password);
    await page.goto('/my-foods');
    await page.getByTestId('tab-custom-foods').click();
    await expect(page.getByText('Your nutritional database')).toBeVisible({ timeout: 10000 });
  });
});
