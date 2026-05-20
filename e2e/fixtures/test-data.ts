/**

 * Test data fixtures for E2E tests

 * These credentials match the seed data created by npm run db:seed

 */



// Seed user accounts - all use password: Password123!

//

// Keep this list intentionally small and feature-segregated to avoid

// cross-test collisions under Playwright parallelism.

export const seedUsers = {

  dashboard: {

    name: 'E2E Dashboard User',

    email: 'e2e.dashboard@example.com',

    password: 'Password123!',

  },

  foodLog: {

    name: 'E2E Food Log User',

    email: 'e2e.foodlog@example.com',

    password: 'Password123!',

  },

  mealPlanner: {

    name: 'E2E Meal Planner User',

    email: 'e2e.mealplanner@example.com',

    password: 'Password123!',

  },

  myFoods: {

    name: 'E2E My Foods User',

    email: 'e2e.myfoods@example.com',

    password: 'Password123!',

  },

};



// Back-compat: some helpers still import `testUser`.

export const testUser = seedUsers.foodLog;



// User for signup tests (not in seed, will be created fresh)

export const newUser = {

  name: 'New Test User',

  email: `new-user-${Date.now()}@example.com`,

  password: 'NewUserPassword123!',

};



// Invalid credentials for negative tests

export const invalidCredentials = {

  email: 'nonexistent@example.com',

  password: 'WrongPassword123!',

};



// Route paths

export const routes = {

  home: '/',

  login: '/login',

  signup: '/signup',

  dashboard: '/dashboard',

  foodLog: '/food-log',

  goals: '/goals',

  profile: '/profile',

  settings: '/settings',

  mealPlanner: '/meal-planner',

};



// Auth state file paths (written by auth.setup.ts, consumed by test files)

export const AUTH_FILES = {

  dashboard: 'e2e/.auth/dashboard.json',

  foodLog: 'e2e/.auth/foodLog.json',

  mealPlanner: 'e2e/.auth/mealPlanner.json',

  myFoods: 'e2e/.auth/myFoods.json',

};



// Sample foods from seed data

export const sampleFoods = [

  'Apple, raw',

  'Banana, raw',

  'Chicken Breast, grilled',

  'Brown Rice, cooked',

  'Eggs, scrambled',

  'Oatmeal, cooked',

  'Salmon, baked',

  'Mixed Green Salad with dressing',

  'Greek Yogurt, plain',

  'Almonds, raw',

];


