import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { uuidv7 } from 'uuidv7';

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

// Registration verification tables (for email verification, password reset, etc.)
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
// Main application tables
// ============================================

export const foods = pgTable(
  'foods',
  {
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    sourceId: varchar('source_id', { length: 100 }),
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
    foodType: varchar('food_type', { length: 50 }),
    fullNutrients: jsonb('full_nutrients'),
    isRaw: boolean('is_raw').default(false),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('foods_name_idx').on(table.name),
    index('foods_source_id_idx').on(table.sourceId),
    index('foods_source_idx').on(table.source),
    index('foods_user_id_idx').on(table.userId),
  ],
);

export const foodPhotos = pgTable(
  'food_photos',
  {
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    foodId: uuid('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'cascade' })
      .unique(),
    thumb: varchar('thumb', { length: 500 }), // Thumbnail URL (72×72)
    medium: varchar('medium', { length: 500 }), // Medium URL (400×400)
    highres: varchar('highres', { length: 500 }), // High-resolution URL (1024×1024)
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('food_photos_food_id_idx').on(table.foodId)],
);

export const foodAltMeasures = pgTable(
  'food_alt_measures',
  {
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    foodId: uuid('food_id')
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


export const foodLogMeals = pgTable(
  'food_log_meals',
  {
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mealType: mealTypeEnum('meal_type').notNull(),
    consumedAt: timestamp('consumed_at').notNull(),
    sourceDietPlanMealGroupId: uuid('source_diet_plan_meal_group_id').references(
      () => dietPlanMeals.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('food_log_meals_user_id_idx').on(table.userId),
    index('food_log_meals_user_consumed_at_idx').on(table.userId, table.consumedAt),
    index('food_log_meals_user_meal_type_consumed_at_idx').on(
      table.userId,
      table.mealType,
      table.consumedAt,
    ),
  ],
);

export const foodLogItems = pgTable(
  'food_log_items',
  {
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    mealId: uuid('meal_id')
      .notNull()
      .references(() => foodLogMeals.id, { onDelete: 'cascade' }),
    foodId: uuid('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'cascade' }),
    altMeasureId: uuid('alt_measure_id').references(() => foodAltMeasures.id, { onDelete: 'set null' }),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
    dishLogGroupId: uuid('dish_log_group_id'), // nullable, no FK — correlator for dish log events
    dishNameSnapshot: varchar('dish_name_snapshot', { length: 500 }), // dish name at log time
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('food_log_items_meal_id_idx').on(table.mealId),
    index('food_log_items_food_id_idx').on(table.foodId),
    index('food_log_items_dish_log_group_id_idx').on(table.dishLogGroupId),
  ],
);

// Nutrition goals table
export const nutritionGoals = pgTable(
  'nutrition_goals',
  {
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    goalType: goalTypeEnum('goal_type').notNull(),
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
    targetHydrationMl: integer('target_hydration_ml').notNull().default(2500),
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
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    goalId: uuid('goal_id').references(() => nutritionGoals.id, {
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
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    clientId: text('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
    index('diet_plans_client_id_idx').on(table.clientId),
  ],
);

// Diet plan meals table (meal slot container: one row per mealType+dayOfWeek within a plan)
export const dietPlanMeals = pgTable(
  'diet_plan_meals',
  {
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    dietPlanId: uuid('diet_plan_id')
      .notNull()
      .references(() => dietPlans.id, { onDelete: 'cascade' }),
    mealType: mealTypeEnum('meal_type').notNull(),
    dayOfWeek: integer('day_of_week'),
    scheduledAt: timestamp('scheduled_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('diet_plan_meals_diet_plan_id_idx').on(table.dietPlanId),
    index('diet_plan_meals_plan_day_meal_type_idx').on(
      table.dietPlanId,
      table.dayOfWeek,
      table.mealType,
    ),
  ],
);

export const dietPlanMealItems = pgTable(
  'diet_plan_meal_items',
  {
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    groupId: uuid('group_id')
      .notNull()
      .references(() => dietPlanMeals.id, { onDelete: 'cascade' }),
    foodId: uuid('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'cascade' }),
    altMeasureId: uuid('alt_measure_id').references(() => foodAltMeasures.id, { onDelete: 'set null' }),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('diet_plan_meal_items_group_id_idx').on(table.groupId),
    index('diet_plan_meal_items_food_id_idx').on(table.foodId),
  ],
);


// Custom dishes table
export const customDishes = pgTable(
  'custom_dishes',
  {
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 500 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('custom_dishes_user_id_idx').on(table.userId),
    index('custom_dishes_name_idx').on(table.name),
  ],
);

export const customDishIngredients = pgTable(
  'custom_dish_ingredients',
  {
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    dishId: uuid('dish_id')
      .notNull()
      .references(() => customDishes.id, { onDelete: 'cascade' }),
    foodId: uuid('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'cascade' }),
    altMeasureId: uuid('alt_measure_id').references(() => foodAltMeasures.id, { onDelete: 'set null' }),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(), // grams
    seq: integer('seq').default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('custom_dish_ingredients_dish_id_idx').on(table.dishId),
    index('custom_dish_ingredients_food_id_idx').on(table.foodId),
  ],
);

export const dishPhotos = pgTable(
  'dish_photos',
  {
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    dishId: uuid('dish_id')
      .notNull()
      .references(() => customDishes.id, { onDelete: 'cascade' })
      .unique(),
    thumb: varchar('thumb', { length: 500 }), // ~300px, JPEG 65%
    highres: varchar('highres', { length: 500 }), // ~900px, JPEG 85%
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('dish_photos_dish_id_idx').on(table.dishId)],
);

export const favorites = pgTable(
  'favorites',
  {
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    foodId: uuid('food_id').references(() => foods.id, { onDelete: 'cascade' }),
    dishId: uuid('dish_id').references(() => customDishes.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('favorites_user_id_idx').on(table.userId),
    unique('favorites_user_food_unique').on(table.userId, table.foodId),
    unique('favorites_user_dish_unique').on(table.userId, table.dishId),
  ],
);

// Hydration logs table — one row per user per calendar date
export const hydrationLogs = pgTable(
  'hydration_logs',
  {
    id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv7()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    totalMl: integer('total_ml').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('hydration_logs_user_date_idx').on(table.userId, table.date),
    unique('hydration_logs_user_date_unique').on(table.userId, table.date),
  ],
);

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  foodLogMeals: many(foodLogMeals),
  nutritionGoals: many(nutritionGoals),
  bodyCheckins: many(bodyCheckins),
  dietPlans: many(dietPlans),
  customFoods: many(foods), // Custom foods owned by user
  hydrationLogs: many(hydrationLogs),
  customDishes: many(customDishes),
  favorites: many(favorites),
}));

export const foodsRelations = relations(foods, ({ one, many }) => ({
  photo: one(foodPhotos, {
    fields: [foods.id],
    references: [foodPhotos.foodId],
  }),
  altMeasures: many(foodAltMeasures),
  foodLogItems: many(foodLogItems),
  dietPlanMealItems: many(dietPlanMealItems),
  user: one(users, {
    fields: [foods.userId],
    references: [users.id],
  }),
}));

export const foodLogMealsRelations = relations(foodLogMeals, ({ one, many }) => ({
  user: one(users, {
    fields: [foodLogMeals.userId],
    references: [users.id],
  }),
  sourceDietPlanMeal: one(dietPlanMeals, {
    fields: [foodLogMeals.sourceDietPlanMealGroupId],
    references: [dietPlanMeals.id],
  }),
  items: many(foodLogItems),
}));

export const foodLogItemsRelations = relations(foodLogItems, ({ one }) => ({
  meal: one(foodLogMeals, {
    fields: [foodLogItems.mealId],
    references: [foodLogMeals.id],
  }),
  food: one(foods, {
    fields: [foodLogItems.foodId],
    references: [foods.id],
  }),
  altMeasure: one(foodAltMeasures, {
    fields: [foodLogItems.altMeasureId],
    references: [foodAltMeasures.id],
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
  ({ one, many }) => ({
    food: one(foods, {
      fields: [foodAltMeasures.foodId],
      references: [foods.id],
    }),
    foodLogItems: many(foodLogItems),
    dietPlanMealItems: many(dietPlanMealItems),
  }),
);

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
  client: one(users, {
    fields: [dietPlans.clientId],
    references: [users.id],
  }),
  meals: many(dietPlanMeals),
}));

export const dietPlanMealsRelations = relations(dietPlanMeals, ({ one, many }) => ({
  dietPlan: one(dietPlans, {
    fields: [dietPlanMeals.dietPlanId],
    references: [dietPlans.id],
  }),
  items: many(dietPlanMealItems),
  foodLogMeals: many(foodLogMeals),
}));

export const dietPlanMealItemsRelations = relations(dietPlanMealItems, ({ one }) => ({
  group: one(dietPlanMeals, {
    fields: [dietPlanMealItems.groupId],
    references: [dietPlanMeals.id],
  }),
  food: one(foods, {
    fields: [dietPlanMealItems.foodId],
    references: [foods.id],
  }),
  altMeasure: one(foodAltMeasures, {
    fields: [dietPlanMealItems.altMeasureId],
    references: [foodAltMeasures.id],
  }),
}));

export const hydrationLogsRelations = relations(hydrationLogs, ({ one }) => ({
  user: one(users, {
    fields: [hydrationLogs.userId],
    references: [users.id],
  }),
}));

export const customDishesRelations = relations(customDishes, ({ one, many }) => ({
  user: one(users, {
    fields: [customDishes.userId],
    references: [users.id],
  }),
  ingredients: many(customDishIngredients),
  favorites: many(favorites),
  photo: one(dishPhotos, {
    fields: [customDishes.id],
    references: [dishPhotos.dishId],
  }),
}));

export const dishPhotosRelations = relations(dishPhotos, ({ one }) => ({
  dish: one(customDishes, {
    fields: [dishPhotos.dishId],
    references: [customDishes.id],
  }),
}));

export const customDishIngredientsRelations = relations(customDishIngredients, ({ one }) => ({
  dish: one(customDishes, {
    fields: [customDishIngredients.dishId],
    references: [customDishes.id],
  }),
  food: one(foods, {
    fields: [customDishIngredients.foodId],
    references: [foods.id],
  }),
  altMeasure: one(foodAltMeasures, {
    fields: [customDishIngredients.altMeasureId],
    references: [foodAltMeasures.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  food: one(foods, {
    fields: [favorites.foodId],
    references: [foods.id],
  }),
  dish: one(customDishes, {
    fields: [favorites.dishId],
    references: [customDishes.id],
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
export const insertFoodLogMealSchema = createInsertSchema(foodLogMeals);
export const selectFoodLogMealSchema = createSelectSchema(foodLogMeals);
export const insertFoodLogItemSchema = createInsertSchema(foodLogItems);
export const selectFoodLogItemSchema = createSelectSchema(foodLogItems);
export const insertNutritionGoalSchema = createInsertSchema(nutritionGoals);
export const selectNutritionGoalSchema = createSelectSchema(nutritionGoals);
export const insertBodyCheckinSchema = createInsertSchema(bodyCheckins);
export const selectBodyCheckinSchema = createSelectSchema(bodyCheckins);
export const insertDietPlanSchema = createInsertSchema(dietPlans);
export const selectDietPlanSchema = createSelectSchema(dietPlans);
export const insertDietPlanMealSchema = createInsertSchema(dietPlanMeals);
export const selectDietPlanMealSchema = createSelectSchema(dietPlanMeals);
export const insertDietPlanMealItemSchema = createInsertSchema(dietPlanMealItems);
export const selectDietPlanMealItemSchema = createSelectSchema(dietPlanMealItems);
export const insertHydrationLogSchema = createInsertSchema(hydrationLogs);
export const selectHydrationLogSchema = createSelectSchema(hydrationLogs);
export const insertCustomDishSchema = createInsertSchema(customDishes);
export const selectCustomDishSchema = createSelectSchema(customDishes);
export const insertCustomDishIngredientSchema = createInsertSchema(customDishIngredients);
export const selectCustomDishIngredientSchema = createSelectSchema(customDishIngredients);
export const insertFavoriteSchema = createInsertSchema(favorites);
export const selectFavoriteSchema = createSelectSchema(favorites);
export const insertDishPhotoSchema = createInsertSchema(dishPhotos);
export const selectDishPhotoSchema = createSelectSchema(dishPhotos);

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
export type FoodLogMeal = typeof foodLogMeals.$inferSelect;
export type NewFoodLogMeal = typeof foodLogMeals.$inferInsert;
export type FoodLogItem = typeof foodLogItems.$inferSelect;
export type NewFoodLogItem = typeof foodLogItems.$inferInsert;
export type NutritionGoal = typeof nutritionGoals.$inferSelect;
export type NewNutritionGoal = typeof nutritionGoals.$inferInsert;
export type BodyCheckin = typeof bodyCheckins.$inferSelect;
export type NewBodyCheckin = typeof bodyCheckins.$inferInsert;
export type DietPlan = typeof dietPlans.$inferSelect;
export type NewDietPlan = typeof dietPlans.$inferInsert;
export type DietPlanMeal = typeof dietPlanMeals.$inferSelect;
export type NewDietPlanMeal = typeof dietPlanMeals.$inferInsert;
export type DietPlanMealItem = typeof dietPlanMealItems.$inferSelect;
export type NewDietPlanMealItem = typeof dietPlanMealItems.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
export type HydrationLog = typeof hydrationLogs.$inferSelect;
export type NewHydrationLog = typeof hydrationLogs.$inferInsert;
export type CustomDish = typeof customDishes.$inferSelect;
export type NewCustomDish = typeof customDishes.$inferInsert;
export type CustomDishIngredient = typeof customDishIngredients.$inferSelect;
export type NewCustomDishIngredient = typeof customDishIngredients.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
export type DishPhoto = typeof dishPhotos.$inferSelect;
export type NewDishPhoto = typeof dishPhotos.$inferInsert;
