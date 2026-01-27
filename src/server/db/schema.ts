import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'individual',
  'professional',
  'admin',
]);
export const mealTypeEnum = pgEnum('meal_type', [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'morning_snack',
  'afternoon_snack',
  'evening_snack',
  'pre_workout',
  'post_workout',
  'other',
]);
export const goalTypeEnum = pgEnum('goal_type', [
  'weight_loss',
  'maintenance',
  'weight_gain',
  'muscle_gain',
  'fat_loss',
  'performance',
  'general_health',
]);
export const verificationStatusEnum = pgEnum('verification_status', [
  'pending',
  'verified',
  'rejected',
]);

// Users table (Better Auth compatible)
// NOTE: nutritionGoals jsonb removed - use nutrition_goals table instead
export const users = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    image: varchar('image', { length: 500 }),
    role: userRoleEnum('role').notNull().default('individual'),
    emailVerified: boolean('email_verified').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('users_email_idx').on(table.email)],
);

// Professional verification table
export const professionalVerification = pgTable(
  'professional_verification',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    licenseNumber: varchar('license_number', { length: 100 }),
    specialization: text('specialization'),
    credentials: jsonb('credentials'),
    verificationStatus: verificationStatusEnum('verification_status')
      .notNull()
      .default('pending'),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('professional_verification_user_id_idx').on(table.userId)],
);

// Foods table (consolidated - includes custom foods)
// CHANGES:
// - Removed: upc, metadata, photoUrl
// - Added: isRaw, isCustom, userId (for custom foods ownership)
export const foods = pgTable(
  'foods',
  {
    id: serial('id').primaryKey(),
    sourceId: varchar('source_id', { length: 100 }), // External source ID (e.g., USDA FDC ID, OFF product code)
    source: varchar('source', { length: 100 }).notNull().default('user_custom'),
    name: varchar('name', { length: 500 }).notNull(),
    brandName: varchar('brand_name', { length: 500 }),
    servingQty: decimal('serving_qty', { precision: 10, scale: 2 }),
    servingUnit: varchar('serving_unit', { length: 100 }),
    servingWeightGrams: decimal('serving_weight_grams', {
      precision: 10,
      scale: 2,
    }),
    calories: decimal('calories', { precision: 10, scale: 2 }),
    protein: decimal('protein', { precision: 10, scale: 2 }),
    carbs: decimal('carbs', { precision: 10, scale: 2 }),
    fat: decimal('fat', { precision: 10, scale: 2 }),
    fiber: decimal('fiber', { precision: 10, scale: 2 }),
    sugar: decimal('sugar', { precision: 10, scale: 2 }),
    sodium: decimal('sodium', { precision: 10, scale: 2 }),
    fullNutrients: jsonb('full_nutrients'),
    isRaw: boolean('is_raw').default(false), // NEW: is raw/unprocessed food
    isCustom: boolean('is_custom').default(false), // NEW: user-created food
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }), // NEW: owner for custom foods (nullable)
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('foods_name_idx').on(table.name),
    index('foods_source_id_idx').on(table.sourceId),
    index('foods_source_idx').on(table.source),
    index('foods_user_id_idx').on(table.userId),
    index('foods_is_custom_idx').on(table.isCustom),
  ],
);

// Food photos table (NEW - 1:1 relation with foods)
// Stores thumbnail and high-resolution photo URLs separately
export const foodPhotos = pgTable(
  'food_photos',
  {
    id: serial('id').primaryKey(),
    foodId: integer('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'cascade' })
      .unique(),
    thumb: varchar('thumb', { length: 500 }), // Thumbnail URL
    highres: varchar('highres', { length: 500 }), // High-resolution URL
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('food_photos_food_id_idx').on(table.foodId)],
);

// Food alternative measures table (NEW - 1:many relation with foods)
// Allows calculating nutrients for different serving sizes
// Formula: multiplier = alt_measure.serving_weight / food.servingWeightGrams
//          adjusted_nutrient = food.nutrient * multiplier
export const foodAltMeasures = pgTable(
  'food_alt_measures',
  {
    id: serial('id').primaryKey(),
    foodId: integer('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'cascade' }),
    servingWeight: decimal('serving_weight', {
      precision: 10,
      scale: 2,
    }).notNull(), // Weight in grams
    measure: varchar('measure', { length: 100 }).notNull(), // e.g., "cup", "tbsp", "slice"
    seq: integer('seq').default(1), // Display order
    qty: decimal('qty', { precision: 10, scale: 2 }).notNull().default('1'), // Quantity (e.g., 1, 0.5)
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('food_alt_measures_food_id_idx').on(table.foodId)],
);

// Food logs table
export const foodLogs = pgTable(
  'food_logs',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    foodId: integer('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'cascade' }),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
    servingUnit: varchar('serving_unit', { length: 100 }),
    mealType: mealTypeEnum('meal_type').notNull(),
    consumedAt: timestamp('consumed_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('food_logs_user_id_idx').on(table.userId),
    index('food_logs_food_id_idx').on(table.foodId),
    index('food_logs_consumed_at_idx').on(table.consumedAt),
  ],
);

// Nutrition goals table
export const nutritionGoals = pgTable(
  'nutrition_goals',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    goalType: goalTypeEnum('goal_type').notNull(),

    // Wizard input snapshot (normalized)
    ageYears: integer('age_years'),
    sex: varchar('sex', { length: 20 }),
    heightCm: decimal('height_cm', { precision: 10, scale: 2 }),
    weightKg: decimal('weight_kg', { precision: 10, scale: 2 }),
    activityMultiplier: decimal('activity_multiplier', {
      precision: 6,
      scale: 3,
    }),
    goalRateKgPerWeek: decimal('goal_rate_kg_per_week', {
      precision: 6,
      scale: 3,
    }),

    // Preset + rule snapshot
    macroPresetId: varchar('macro_preset_id', { length: 50 }),
    proteinGPerKg: decimal('protein_g_per_kg', { precision: 6, scale: 2 }),

    // Calculation snapshot
    bmrCalories: decimal('bmr_calories', { precision: 10, scale: 2 }),
    tdeeCalories: decimal('tdee_calories', { precision: 10, scale: 2 }),
    recommendedTargets: jsonb('recommended_targets'),
    wasManuallyOverridden: boolean('was_manually_overridden').default(false),
    calorieAdjustmentStrategy: varchar('calorie_adjustment_strategy', {
      length: 30,
    }),

    // Raw/original wizard inputs (store-all)
    inputUnitSystem: varchar('input_unit_system', { length: 10 }),
    wizardInputs: jsonb('wizard_inputs'),

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
  },
  (table) => [
    index('nutrition_goals_user_id_idx').on(table.userId),
    index('nutrition_goals_user_start_date_idx').on(
      table.userId,
      table.startDate,
    ),
    index('nutrition_goals_user_end_date_idx').on(table.userId, table.endDate),
  ],
);

// Body check-ins table (goal feedback history)
export const bodyCheckins = pgTable(
  'body_checkins',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    goalId: integer('goal_id').references(() => nutritionGoals.id, {
      onDelete: 'set null',
    }),
    checkInDate: timestamp('check_in_date').notNull(),

    inputUnitSystem: varchar('input_unit_system', { length: 10 }),
    weightKg: decimal('weight_kg', { precision: 10, scale: 2 }).notNull(),
    rawWeight: jsonb('raw_weight'),

    photos: jsonb('photos'),
    skinfoldsMm: jsonb('skinfolds_mm'),
    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('body_checkins_user_id_idx').on(table.userId),
    index('body_checkins_user_check_in_date_idx').on(
      table.userId,
      table.checkInDate,
    ),
    index('body_checkins_goal_id_check_in_date_idx').on(
      table.goalId,
      table.checkInDate,
    ),
  ],
);

// Diet plans table
export const dietPlans = pgTable(
  'diet_plans',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clientId: text('client_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
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
  },
  (table) => [
    index('diet_plans_user_id_idx').on(table.userId),
    index('diet_plans_client_id_idx').on(table.clientId),
  ],
);

// Diet plan meals table
export const dietPlanMeals = pgTable(
  'diet_plan_meals',
  {
    id: serial('id').primaryKey(),
    dietPlanId: integer('diet_plan_id')
      .notNull()
      .references(() => dietPlans.id, { onDelete: 'cascade' }),
    foodId: integer('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'cascade' }),
    mealType: mealTypeEnum('meal_type').notNull(),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
    servingUnit: varchar('serving_unit', { length: 100 }),
    dayOfWeek: integer('day_of_week'), // 0-6 (Sunday to Saturday)
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('diet_plan_meals_diet_plan_id_idx').on(table.dietPlanId),
    index('diet_plan_meals_food_id_idx').on(table.foodId),
  ],
);

// Better Auth schema tables
export const sessions = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_token_idx').on(table.token),
  ],
);

export const accounts = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
  },
  (table) => [
    index('accounts_user_id_idx').on(table.userId),
    index('accounts_provider_id_idx').on(table.providerId),
  ],
);

export const verifications = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: varchar('identifier', { length: 255 }).notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)],
);

export const emailVerificationChallenges = pgTable(
  'email_verification_challenge',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
      .unique(),
    email: varchar('email', { length: 255 }).notNull(),
    codeHash: text('code_hash').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    sentCountHour: integer('sent_count_hour').notNull().default(0),
    sentCountWindowStart: timestamp('sent_count_window_start')
      .notNull()
      .defaultNow(),
    lastSentAt: timestamp('last_sent_at').notNull().defaultNow(),
    failedCountWindow: integer('failed_count_window').notNull().default(0),
    failedCountWindowStart: timestamp('failed_count_window_start')
      .notNull()
      .defaultNow(),
    lockedUntil: timestamp('locked_until'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('email_verification_challenge_user_id_idx').on(table.userId),
    index('email_verification_challenge_email_idx').on(table.email),
  ],
);

export const securityEvents = pgTable(
  'security_event',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    email: varchar('email', { length: 255 }),
    type: varchar('type', { length: 64 }).notNull(),
    ip: varchar('ip', { length: 64 }),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('security_event_user_id_created_at_idx').on(
      table.userId,
      table.createdAt,
    ),
    index('security_event_type_created_at_idx').on(table.type, table.createdAt),
  ],
);

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  foodLogs: many(foodLogs),
  nutritionGoals: many(nutritionGoals),
  bodyCheckins: many(bodyCheckins),
  dietPlans: many(dietPlans),
  customFoods: many(foods), // Custom foods owned by user
  professionalVerification: many(professionalVerification),
}));

export const foodsRelations = relations(foods, ({ one, many }) => ({
  photo: one(foodPhotos, {
    fields: [foods.id],
    references: [foodPhotos.foodId],
  }),
  altMeasures: many(foodAltMeasures),
  foodLogs: many(foodLogs),
  dietPlanMeals: many(dietPlanMeals),
  user: one(users, {
    fields: [foods.userId],
    references: [users.id],
  }),
}));

export const foodPhotosRelations = relations(foodPhotos, ({ one }) => ({
  food: one(foods, {
    fields: [foodPhotos.foodId],
    references: [foods.id],
  }),
}));

export const foodAltMeasuresRelations = relations(
  foodAltMeasures,
  ({ one }) => ({
    food: one(foods, {
      fields: [foodAltMeasures.foodId],
      references: [foods.id],
    }),
  }),
);

export const foodLogsRelations = relations(foodLogs, ({ one }) => ({
  user: one(users, {
    fields: [foodLogs.userId],
    references: [users.id],
  }),
  food: one(foods, {
    fields: [foodLogs.foodId],
    references: [foods.id],
  }),
}));

export const nutritionGoalsRelations = relations(nutritionGoals, ({ one }) => ({
  user: one(users, {
    fields: [nutritionGoals.userId],
    references: [users.id],
  }),
}));

export const bodyCheckinsRelations = relations(bodyCheckins, ({ one }) => ({
  user: one(users, {
    fields: [bodyCheckins.userId],
    references: [users.id],
  }),
  goal: one(nutritionGoals, {
    fields: [bodyCheckins.goalId],
    references: [nutritionGoals.id],
  }),
}));

export const dietPlansRelations = relations(dietPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [dietPlans.userId],
    references: [users.id],
  }),
  client: one(users, {
    fields: [dietPlans.clientId],
    references: [users.id],
  }),
  meals: many(dietPlanMeals),
}));

export const dietPlanMealsRelations = relations(dietPlanMeals, ({ one }) => ({
  dietPlan: one(dietPlans, {
    fields: [dietPlanMeals.dietPlanId],
    references: [dietPlans.id],
  }),
  food: one(foods, {
    fields: [dietPlanMeals.foodId],
    references: [foods.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const professionalVerificationRelations = relations(
  professionalVerification,
  ({ one }) => ({
    user: one(users, {
      fields: [professionalVerification.userId],
      references: [users.id],
    }),
  }),
);

// ============================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertFoodSchema = createInsertSchema(foods);
export const selectFoodSchema = createSelectSchema(foods);
export const insertFoodPhotoSchema = createInsertSchema(foodPhotos);
export const selectFoodPhotoSchema = createSelectSchema(foodPhotos);
export const insertFoodAltMeasureSchema = createInsertSchema(foodAltMeasures);
export const selectFoodAltMeasureSchema = createSelectSchema(foodAltMeasures);
export const insertFoodLogSchema = createInsertSchema(foodLogs);
export const selectFoodLogSchema = createSelectSchema(foodLogs);
export const insertNutritionGoalSchema = createInsertSchema(nutritionGoals);
export const selectNutritionGoalSchema = createSelectSchema(nutritionGoals);
export const insertBodyCheckinSchema = createInsertSchema(bodyCheckins);
export const selectBodyCheckinSchema = createSelectSchema(bodyCheckins);
export const insertDietPlanSchema = createInsertSchema(dietPlans);
export const selectDietPlanSchema = createSelectSchema(dietPlans);
export const insertDietPlanMealSchema = createInsertSchema(dietPlanMeals);
export const selectDietPlanMealSchema = createSelectSchema(dietPlanMeals);

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Food = typeof foods.$inferSelect;
export type NewFood = typeof foods.$inferInsert;
export type FoodPhoto = typeof foodPhotos.$inferSelect;
export type NewFoodPhoto = typeof foodPhotos.$inferInsert;
export type FoodAltMeasure = typeof foodAltMeasures.$inferSelect;
export type NewFoodAltMeasure = typeof foodAltMeasures.$inferInsert;
export type FoodLog = typeof foodLogs.$inferSelect;
export type NewFoodLog = typeof foodLogs.$inferInsert;
export type NutritionGoal = typeof nutritionGoals.$inferSelect;
export type NewNutritionGoal = typeof nutritionGoals.$inferInsert;
export type BodyCheckin = typeof bodyCheckins.$inferSelect;
export type NewBodyCheckin = typeof bodyCheckins.$inferInsert;
export type DietPlan = typeof dietPlans.$inferSelect;
export type NewDietPlan = typeof dietPlans.$inferInsert;
export type DietPlanMeal = typeof dietPlanMeals.$inferSelect;
export type NewDietPlanMeal = typeof dietPlanMeals.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
