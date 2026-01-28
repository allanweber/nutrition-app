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
  .min(3, 'Search query must be at least 3 characters long')
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
  foodId: z.number().int().positive().optional(),
  food: z
    .object({
      id: z.number().int().positive().optional(),
      sourceId: z.string().min(1).max(128).transform(sanitizeString),
      source: z.enum(['usda', 'openfoodfacts', 'fatsecret', 'database']),
      name: z.string().min(1).max(200).transform(sanitizeString),
      brandName: z
        .string()
        .nullable()
        .optional()
        .transform((val) => (val ? sanitizeString(val) : undefined)),
      servingQty: z.number().finite().nonnegative(),
      servingUnit: z.string().min(1).max(50).transform(sanitizeString),
      servingWeightGrams: z.number().finite().nonnegative().optional(),
      calories: z.number().finite().nonnegative(),
      protein: z.number().finite().nonnegative(),
      carbs: z.number().finite().nonnegative(),
      fat: z.number().finite().nonnegative(),
      fiber: z.number().finite().nonnegative().optional(),
      sugar: z.number().finite().nonnegative().optional(),
      sodium: z.number().finite().nonnegative().optional(),
      barcode: z
        .string()
        .nullable()
        .optional()
        .transform((val) => (val ? sanitizeString(val) : undefined)),
      isRaw: z.boolean().optional(),
      fullNutrients: z
        .array(z.object({ attr_id: z.number().int(), value: z.number().finite() }))
        .optional(),
      photo: z
        .object({
          thumb: z.string().optional(),
          highres: z.string().optional(),
        })
        .nullable()
        .optional(),
    })
    .optional(),
  foodName: z
    .string()
    .min(1, 'Food name is required')
    .max(200, 'Food name must be at most 200 characters')
    .transform(sanitizeString)
    .optional(),
  brandName: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? sanitizeString(val) : undefined)),
  quantity: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num =
        typeof val === 'string' ? parseFloat(sanitizeNumericString(val)) : val;
      return num;
    })
    .refine(
      (val) => val > 0 && val <= 10000,
      'Quantity must be between 0.01 and 10,000',
    ),
  servingUnit: z
    .string()
    .min(1, 'Serving unit is required')
    .max(50, 'Serving unit must be at most 50 characters')
    .transform(sanitizeString),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']), // Subset of mealTypeEnum
  consumedAt: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
}).refine((data) => data.foodId !== undefined || data.food !== undefined || (data.foodName && data.foodName.length > 0), {
  message: 'foodId, food, or foodName is required',
  path: ['foodId'],
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
      return num > 0 && num <= 10000 ? num : undefined;
    })
    .refine(
      (val) => val === undefined || (val > 0 && val <= 10000),
      'Quantity must be between 0.01 and 10,000',
    ),
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
});

// Food log ID validation
export const foodLogIdSchema = z
  .string()
  .regex(/^\d+$/, 'Food log ID must be a valid number')
  .transform((val) => parseInt(val, 10))
  .refine((val) => val > 0, 'Food log ID must be a positive number');

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
    activityLevel: apiGoals.activityLevel || null,
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
