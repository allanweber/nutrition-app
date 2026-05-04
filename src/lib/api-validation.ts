import { NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================
// API INPUT VALIDATION SCHEMAS
// ============================================
// IMPORTANT: These validate CLIENT INPUT, not database operations.
// They differ from database schemas (insertNutritionGoalSchema, etc.) because:
//
// 1. Field names: Client uses simple names (calories), DB uses prefixed names (targetCalories)
// 2. Enum values: Client sends subset (basic meal types), DB supports all variants
// 3. Required fields: Client doesn't send DB-required fields like userId, timestamps
// 4. Purpose: API validation protects against malicious input, DB schemas ensure data integrity
//
// Use database schemas (from schema.ts) for database operations, these for API input validation.

// Sanitization helper functions
const sanitizeString = (str: string) => str.trim().replace(/[<>\"'&]/g, '');
const sanitizeNumericString = (str: string) => str.replace(/[^0-9.]/g, '');

// Date validation - ISO date format
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const parsed = new Date(date);
    return parsed.toISOString().startsWith(date);
  }, 'Invalid date');

// Search query validation
export const searchQuerySchema = z
  .string()
  .min(2, 'Search query must be at least 2 characters long')
  .max(100, 'Search query must be at most 100 characters long')
  .transform(sanitizeString);

// Days parameter validation
export const daysSchema = z
  .number()
  .int('Days must be a whole number')
  .min(1, 'Days must be at least 1')
  .max(365, 'Days must be at most 365');

// Food log creation validation - based on client input format
// Note: Uses subset of mealTypeEnum values (client only sends basic meal types)
export const createFoodLogSchema = z.object({
  foodId: z.string().uuid('foodId must be a valid UUID'),
  altMeasureId: z.string().uuid('altMeasureId must be a valid UUID').optional().nullable(),
  quantity: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num =
        typeof val === 'string' ? parseFloat(sanitizeNumericString(val)) : val;
      return num;
    })
    .refine(
      (val) => val > 0 && val <= 100000,
      'Quantity must be between 0.01 and 100,000',
    ),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'morning_snack', 'afternoon_snack', 'evening_snack', 'pre_workout', 'post_workout', 'other']),
  consumedAt: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

// Food log update validation
export const updateFoodLogSchema = z.object({
  quantity: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined) return val;
      const num =
        typeof val === 'string' ? parseFloat(sanitizeNumericString(val)) : val;
      return num > 0 && num <= 100000 ? num : undefined;
    })
    .refine(
      (val) => val === undefined || (val > 0 && val <= 100000),
      'Quantity must be between 0.01 and 100,000',
    ),
  altMeasureId: z.string().uuid('altMeasureId must be a valid UUID').optional().nullable(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(), // Subset of mealTypeEnum
  consumedAt: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

// Nutrition goals validation - API input format (transformed to DB format in API route)
// Note: Client sends simple field names (calories), API transforms to DB names (targetCalories)
// This differs from insertNutritionGoalSchema which expects DB field names and includes userId, timestamps, etc.
export const nutritionGoalsSchema = z.object({
  calories: z
    .number()
    .int('Calories must be a whole number')
    .min(500, 'Calories must be at least 500')
    .max(15000, 'Calories must be at most 15,000'),
  protein: z
    .number()
    .min(0, 'Protein cannot be negative')
    .max(2000, 'Protein must be at most 2,000g'),
  carbs: z
    .number()
    .min(0, 'Carbs cannot be negative')
    .max(3000, 'Carbs must be at most 3,000g'),
  fat: z
    .number()
    .min(0, 'Fat cannot be negative')
    .max(1000, 'Fat must be at most 1,000g'),
  fiber: z
    .number()
    .min(0, 'Fiber cannot be negative')
    .max(200, 'Fiber must be at most 200g'),
  sodium: z
    .number()
    .min(0, 'Sodium cannot be negative')
    .max(100000, 'Sodium must be at most 100,000mg'),
  goalType: z
    .enum([
      'weight_loss',
      'maintenance',
      'weight_gain',
      'muscle_gain',
      'fat_loss',
      'performance',
      'general_health',
    ])
    .optional(), // From goalTypeEnum in schema.ts
  activityLevel: z.string().optional(), // DB uses varchar, not enum
  hydration: z.number().min(0).max(10000).optional(),
  ageYears: z.number().int().min(1).max(120).optional().nullable(),
  sex: z.enum(['male', 'female']).optional().nullable(),
  heightCm: z.number().min(50).max(300).optional().nullable(),
  weightKg: z.number().min(10).max(500).optional().nullable(),
  activityMultiplier: z.number().optional().nullable(),
  bmrCalories: z.number().optional().nullable(),
  tdeeCalories: z.number().optional().nullable(),
  wizardInputs: z.record(z.string(), z.unknown()).optional().nullable(),
  inputUnitSystem: z.enum(['metric', 'imperial']).optional().nullable(),
  macroPresetId: z.string().optional().nullable(),
});

// Food log ID validation
export const foodLogIdSchema = z
  .string()
  .uuid('Food log ID must be a valid UUID');

// ============================================
// DIET PLAN API SCHEMAS
// ============================================

const dayOfWeekSchema = z.number().int().min(1).max(7);

export const createDietPlanSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  targetCalories: z.number().positive(),
  targetProtein: z.number().positive(),
  targetCarbs: z.number().positive(),
  targetFat: z.number().positive(),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  status: z.enum(['active', 'draft', 'archived']).default('draft'),
});

export const updateDietPlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  targetCalories: z.number().positive().optional(),
  targetProtein: z.number().positive().optional(),
  targetCarbs: z.number().positive().optional(),
  targetFat: z.number().positive().optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
});

export const mealTypeSchema = z.enum([
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

export const createDietPlanMealSchema = z.object({
  mealType: mealTypeSchema,
  dayOfWeek: dayOfWeekSchema,
});

export const updateDietPlanMealSchema = z.object({
  mealType: mealTypeSchema.optional(),
  dayOfWeek: dayOfWeekSchema.optional(),
});

export const addMealItemSchema = z.object({
  foodId: z.string().uuid(),
  altMeasureId: z.string().uuid().optional().nullable(),
  quantity: z.number().positive(),
});

export const updateMealItemSchema = z.object({
  altMeasureId: z.string().uuid().optional().nullable(),
  quantity: z.number().positive().optional(),
});

export const copyDaySchema = z.object({
  fromDay: dayOfWeekSchema,
  toDay: dayOfWeekSchema,
});

export const logFromPlanSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('replace-all'),
    date: dateSchema,
    planId: z.string().uuid('planId must be a valid UUID'),
  }),
  z.object({
    mode: z.literal('add-all'),
    date: dateSchema,
    planId: z.string().uuid('planId must be a valid UUID'),
  }),
  z.object({
    mode: z.literal('add-meal'),
    date: dateSchema,
    planId: z.string().uuid('planId must be a valid UUID'),
    mealType: mealTypeSchema,
  }),
]);

// ============================================
// TRANSFORMATION HELPERS
// ============================================
// Convert API input format to database format for final validation
export function transformNutritionGoalsForDB(
  apiGoals: z.infer<typeof nutritionGoalsSchema>,
  userId: string,
) {
  return {
    userId,
    goalType: apiGoals.goalType || 'maintenance',
    targetCalories: apiGoals.calories.toString(),
    targetProtein: apiGoals.protein.toString(),
    targetCarbs: apiGoals.carbs.toString(),
    targetFat: apiGoals.fat.toString(),
    targetFiber: apiGoals.fiber.toString(),
    targetSodium: apiGoals.sodium.toString(),
    targetHydrationMl: apiGoals.hydration ?? 2500,
    activityLevel: apiGoals.activityLevel || null,
    ageYears: apiGoals.ageYears ?? null,
    sex: apiGoals.sex ?? null,
    heightCm: apiGoals.heightCm != null ? apiGoals.heightCm.toString() : null,
    weightKg: apiGoals.weightKg != null ? apiGoals.weightKg.toString() : null,
    activityMultiplier: apiGoals.activityMultiplier != null ? apiGoals.activityMultiplier.toString() : null,
    bmrCalories: apiGoals.bmrCalories != null ? apiGoals.bmrCalories.toString() : null,
    tdeeCalories: apiGoals.tdeeCalories != null ? apiGoals.tdeeCalories.toString() : null,
    wizardInputs: apiGoals.wizardInputs ?? null,
    inputUnitSystem: apiGoals.inputUnitSystem ?? null,
    macroPresetId: apiGoals.macroPresetId ?? null,
    startDate: new Date(),
    isActive: true,
  };
}

// ============================================
// API VALIDATION HELPER FUNCTIONS
// ============================================

export function validateApiInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fieldName?: string,
):
  | { success: true; data: T }
  | { success: false; error: string; field?: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Get the first error for better user experience
      const firstError = error.issues[0];
      const field = firstError.path.join('.');
      const message = firstError.message;

      return {
        success: false,
        error: `${fieldName ? `${fieldName}: ` : ''}${message}`,
        field: field || fieldName,
      };
    }
    return {
      success: false,
      error: 'Invalid input data',
    };
  }
}

export function createValidationErrorResponse(
  error: string,
  field?: string,
  status = 400,
) {
  return NextResponse.json(
    {
      success: false,
      error,
      field: field ?? null,
    },
    { status },
  );
}

// Helper to extract and validate request body
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
  fieldName?: string,
): Promise<
  { success: true; data: T } | { success: false; response: NextResponse }
> {
  try {
    const body = await request.json();
    const validation = validateApiInput(schema, body, fieldName);

    if (!validation.success) {
      return {
        success: false,
        response: createValidationErrorResponse(
          validation.error,
          validation.field,
        ),
      };
    }

    return { success: true, data: validation.data };
  } catch {
    return {
      success: false,
      response: createValidationErrorResponse('Invalid JSON in request body'),
    };
  }
}
