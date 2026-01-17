import { 
  pgTable, 
  serial, 
  text, 
  varchar, 
  integer, 
  decimal, 
  boolean, 
  timestamp, 
  jsonb,
  pgEnum,
  index
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Enums
export const userRoleEnum = pgEnum('user_role', ['individual', 'professional', 'admin']);
export const mealTypeEnum = pgEnum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack']);
export const goalTypeEnum = pgEnum('goal_type', ['weight_loss', 'maintenance', 'weight_gain']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'verified', 'rejected']);

// Users table (Better Auth compatible)
export const users = pgTable('user', {
  id: text('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  image: varchar('image', { length: 500 }),
  role: userRoleEnum('role').notNull().default('individual'),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

// Professional verification table
export const professionalVerification = pgTable('professional_verification', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  licenseNumber: varchar('license_number', { length: 100 }),
  specialization: text('specialification'),
  credentials: jsonb('credentials'),
  verificationStatus: verificationStatusEnum('verification_status').notNull().default('pending'),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('professional_verification_user_id_idx').on(table.userId),
}));

// Foods table (cached from Nutritionix)
export const foods = pgTable('foods', {
  id: serial('id').primaryKey(),
  nutritionixId: varchar('nutritionix_id', { length: 100 }).unique(),
  name: varchar('name', { length: 500 }).notNull(),
  brandName: varchar('brand_name', { length: 500 }),
  servingQty: decimal('serving_qty', { precision: 10, scale: 2 }),
  servingUnit: varchar('serving_unit', { length: 100 }),
  servingWeightGrams: decimal('serving_weight_grams', { precision: 10, scale: 2 }),
  calories: decimal('calories', { precision: 10, scale: 2 }),
  protein: decimal('protein', { precision: 10, scale: 2 }),
  carbs: decimal('carbs', { precision: 10, scale: 2 }),
  fat: decimal('fat', { precision: 10, scale: 2 }),
  fiber: decimal('fiber', { precision: 10, scale: 2 }),
  sugar: decimal('sugar', { precision: 10, scale: 2 }),
  sodium: decimal('sodium', { precision: 10, scale: 2 }),
  fullNutrients: jsonb('full_nutrients'),
  photoUrl: varchar('photo_url', { length: 500 }),
  upc: varchar('upc', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('foods_name_idx').on(table.name),
  nutritionixIdIdx: index('foods_nutritionix_id_idx').on(table.nutritionixId),
  upcIdx: index('foods_upc_idx').on(table.upc),
}));

// Food logs table
export const foodLogs = pgTable('food_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  foodId: integer('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }),
  quantity: varchar('quantity', { length: 50 }).notNull(),
  servingUnit: varchar('serving_unit', { length: 100 }),
  mealType: mealTypeEnum('meal_type').notNull(),
  consumedAt: timestamp('consumed_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('food_logs_user_id_idx').on(table.userId),
  foodIdIdx: index('food_logs_food_id_idx').on(table.foodId),
  consumedAtIdx: index('food_logs_consumed_at_idx').on(table.consumedAt),
}));

// Nutrition goals table
export const nutritionGoals = pgTable('nutrition_goals', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  goalType: goalTypeEnum('goal_type').notNull(),
  targetCalories: decimal('target_calories', { precision: 10, scale: 2 }),
  targetProtein: decimal('target_protein', { precision: 10, scale: 2 }),
  targetCarbs: decimal('target_carbs', { precision: 10, scale: 2 }),
  targetFat: decimal('target_fat', { precision: 10, scale: 2 }),
  targetFiber: decimal('target_fiber', { precision: 10, scale: 2 }),
  targetSodium: decimal('target_sodium', { precision: 10, scale: 2 }),
  activityLevel: varchar('activity_level', { length: 50 }),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('nutrition_goals_user_id_idx').on(table.userId),
}));

// Diet plans table
export const dietPlans = pgTable('diet_plans', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: text('client_id').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  targetCalories: decimal('target_calories', { precision: 10, scale: 2 }),
  targetProtein: decimal('target_protein', { precision: 10, scale: 2 }),
  targetCarbs: decimal('target_carbs', { precision: 10, scale: 2 }),
  targetFat: decimal('target_fat', { precision: 10, scale: 2 }),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('diet_plans_user_id_idx').on(table.userId),
  clientIdIdx: index('diet_plans_client_id_idx').on(table.clientId),
}));

// Diet plan meals table
export const dietPlanMeals = pgTable('diet_plan_meals', {
  id: serial('id').primaryKey(),
  dietPlanId: integer('diet_plan_id').notNull().references(() => dietPlans.id, { onDelete: 'cascade' }),
  foodId: integer('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }),
  mealType: mealTypeEnum('meal_type').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  servingUnit: varchar('serving_unit', { length: 100 }),
  dayOfWeek: integer('day_of_week'), // 0-6 (Sunday to Saturday)
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  dietPlanIdIdx: index('diet_plan_meals_diet_plan_id_idx').on(table.dietPlanId),
  foodIdIdx: index('diet_plan_meals_food_id_idx').on(table.foodId),
}));

// Custom foods table
export const customFoods = pgTable('custom_foods', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 500 }).notNull(),
  brandName: varchar('brand_name', { length: 500 }),
  servingQty: decimal('serving_qty', { precision: 10, scale: 2 }).notNull(),
  servingUnit: varchar('serving_unit', { length: 100 }).notNull(),
  calories: decimal('calories', { precision: 10, scale: 2 }).notNull(),
  protein: decimal('protein', { precision: 10, scale: 2 }),
  carbs: decimal('carbs', { precision: 10, scale: 2 }),
  fat: decimal('fat', { precision: 10, scale: 2 }),
  fiber: decimal('fiber', { precision: 10, scale: 2 }),
  sugar: decimal('sugar', { precision: 10, scale: 2 }),
  sodium: decimal('sodium', { precision: 10, scale: 2 }),
  photoUrl: varchar('photo_url', { length: 500 }),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('custom_foods_user_id_idx').on(table.userId),
  nameIdx: index('custom_foods_name_idx').on(table.name),
}));

// Better Auth schema tables
export const sessions = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  tokenIdx: index('sessions_token_idx').on(table.token),
}));

export const accounts = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: varchar('provider_id', { length: 50 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('accounts_user_id_idx').on(table.userId),
  providerIdIdx: index('accounts_provider_id_idx').on(table.providerId),
}));

export const verifications = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  identifierIdx: index('verifications_identifier_idx').on(table.identifier),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertFoodSchema = createInsertSchema(foods);
export const selectFoodSchema = createSelectSchema(foods);
export const insertFoodLogSchema = createInsertSchema(foodLogs);
export const selectFoodLogSchema = createSelectSchema(foodLogs);
export const insertNutritionGoalSchema = createInsertSchema(nutritionGoals);
export const selectNutritionGoalSchema = createSelectSchema(nutritionGoals);
export const insertDietPlanSchema = createInsertSchema(dietPlans);
export const selectDietPlanSchema = createSelectSchema(dietPlans);
export const insertDietPlanMealSchema = createInsertSchema(dietPlanMeals);
export const selectDietPlanMealSchema = createSelectSchema(dietPlanMeals);
export const insertCustomFoodSchema = createInsertSchema(customFoods);
export const selectCustomFoodSchema = createSelectSchema(customFoods);

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Food = typeof foods.$inferSelect;
export type NewFood = typeof foods.$inferInsert;
export type FoodLog = typeof foodLogs.$inferSelect;
export type NewFoodLog = typeof foodLogs.$inferInsert;
export type NutritionGoal = typeof nutritionGoals.$inferSelect;
export type NewNutritionGoal = typeof nutritionGoals.$inferInsert;
export type DietPlan = typeof dietPlans.$inferSelect;
export type NewDietPlan = typeof dietPlans.$inferInsert;
export type DietPlanMeal = typeof dietPlanMeals.$inferSelect;
export type NewDietPlanMeal = typeof dietPlanMeals.$inferInsert;
export type CustomFood = typeof customFoods.$inferSelect;
export type NewCustomFood = typeof customFoods.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;