export const testUsers = {
  newUser: {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
  },
  existingUser: {
    name: 'Existing User',
    email: 'existing@example.com',
    password: 'ExistingPassword123!',
  },
};

export const invalidCredentials = {
  email: 'invalid@example.com',
  password: 'wrongpassword',
};

export const routes = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  foodLog: '/food-log',
  goals: '/goals',
};
