/**
 * Test data fixtures for E2E tests
 * These credentials match the seed data created by npm run db:seed
 */

// Seed user accounts - all use password: Password123!
export const seedUsers = {
  weightLoss: {
    name: 'Alex Weight Loss',
    email: 'user.weight-loss@example.com',
    password: 'Password123!',
    goal: 'weight_loss',
  },
  maintenance: {
    name: 'Jordan Maintenance',
    email: 'user.maintenance@example.com',
    password: 'Password123!',
    goal: 'maintenance',
  },
  weightGain: {
    name: 'Sam Weight Gain',
    email: 'user.weight-gain@example.com',
    password: 'Password123!',
    goal: 'weight_gain',
  },
  muscleGain: {
    name: 'Chris Muscle Gain',
    email: 'user.muscle-gain@example.com',
    password: 'Password123!',
    goal: 'muscle_gain',
  },
  fatLoss: {
    name: 'Taylor Fat Loss',
    email: 'user.fat-loss@example.com',
    password: 'Password123!',
    goal: 'fat_loss',
  },
  performance: {
    name: 'Morgan Performance',
    email: 'user.performance@example.com',
    password: 'Password123!',
    goal: 'performance',
  },
  generalHealth: {
    name: 'Casey General Health',
    email: 'user.general-health@example.com',
    password: 'Password123!',
    goal: 'general_health',
  },
  professional1: {
    name: 'Dr. Sarah Wilson',
    email: 'dr.sarah.wilson@example.com',
    password: 'Password123!',
    role: 'professional',
  },
  professional2: {
    name: 'Mark Thompson, RD',
    email: 'mark.nutritionist@example.com',
    password: 'Password123!',
    role: 'professional',
  },

  // Dedicated account for password reset/change password tests.
  // Do not use this email in any other tests.
  resetPassword: {
    name: 'Reset Password Test User',
    email: 'reset-pwd-test@mail.com',
    password: 'Password123!',
    goal: 'maintenance',
  },
};

// Default test user for most tests (has food logs and goals)
export const testUser = seedUsers.weightLoss;

// Dedicated user for password reset/change password flows
export const resetPasswordUser = seedUsers.resetPassword;

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
