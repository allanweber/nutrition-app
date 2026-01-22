import { z } from 'zod'

// ============================================
// INPUT VALIDATION & SANITIZATION SCHEMAS
// ============================================

// Sanitization helper functions
const sanitizeString = (str: string) => str.trim().replace(/[<>\"'&]/g, '')
const sanitizeNumericString = (str: string) => str.replace(/[^0-9.]/g, '')

// Date validation - ISO date format
export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
  .refine((date) => {
    const parsed = new Date(date)
    return parsed.toISOString().startsWith(date)
  }, 'Invalid date')

// Search query validation
export const searchQuerySchema = z.string()
  .min(2, 'Search query must be at least 2 characters')
  .max(100, 'Search query must be at most 100 characters')
  .transform(sanitizeString)

// Days parameter validation
export const daysSchema = z.number()
  .int('Days must be an integer')
  .min(1, 'Days must be at least 1')
  .max(365, 'Days must be at most 365')

// Food log creation validation
export const createFoodLogSchema = z.object({
  foodName: z.string()
    .min(1, 'Food name is required')
    .max(200, 'Food name must be at most 200 characters')
    .transform(sanitizeString),
  brandName: z.string()
    .optional()
    .transform((val) => val ? sanitizeString(val) : undefined),
  quantity: z.union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(sanitizeNumericString(val)) : val
      return num
    })
    .refine((val) => val > 0 && val <= 10000, 'Quantity must be between 0.01 and 10000'),
  servingUnit: z.string()
    .min(1, 'Serving unit is required')
    .max(50, 'Serving unit must be at most 50 characters')
    .transform(sanitizeString),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
})

// Nutrition goals validation
export const nutritionGoalsSchema = z.object({
  calories: z.number()
    .int('Calories must be an integer')
    .min(800, 'Calories must be at least 800')
    .max(10000, 'Calories must be at most 10000'),
  protein: z.number()
    .min(0, 'Protein must be non-negative')
    .max(1000, 'Protein must be at most 1000'),
  carbs: z.number()
    .min(0, 'Carbs must be non-negative')
    .max(2000, 'Carbs must be at most 2000'),
  fat: z.number()
    .min(0, 'Fat must be non-negative')
    .max(500, 'Fat must be at most 500'),
  fiber: z.number()
    .min(0, 'Fiber must be non-negative')
    .max(100, 'Fiber must be at most 100'),
  sodium: z.number()
    .min(0, 'Sodium must be non-negative')
    .max(50000, 'Sodium must be at most 50000'),
  goalType: z.enum([
    'weight_loss', 'maintenance', 'weight_gain',
    'muscle_gain', 'fat_loss', 'performance', 'general_health'
  ]).optional(),
  activityLevel: z.enum([
    'sedentary', 'light', 'moderate', 'active', 'extra_active'
  ]).optional(),
})

// Food log ID validation
export const foodLogIdSchema = z.number()
  .int('Food log ID must be an integer')
  .positive('Food log ID must be positive')

// ============================================
// VALIDATION HELPER FUNCTIONS
// ============================================

export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ')
      throw new Error(`Validation failed${context ? ` for ${context}` : ''}: ${errorMessage}`)
    }
    throw error
  }
}

export function validateDate(date: string): string {
  return validateAndSanitize(dateSchema, date, 'date parameter')
}

export function validateSearchQuery(query: string): string {
  return validateAndSanitize(searchQuerySchema, query, 'search query')
}

export function validateDays(days: number): number {
  return validateAndSanitize(daysSchema, days, 'days parameter')
}

export function validateCreateFoodLog(data: unknown): z.infer<typeof createFoodLogSchema> {
  return validateAndSanitize(createFoodLogSchema, data, 'create food log')
}

export function validateNutritionGoals(goals: unknown): z.infer<typeof nutritionGoalsSchema> {
  return validateAndSanitize(nutritionGoalsSchema, goals, 'nutrition goals')
}

export function validateFoodLogId(id: number): number {
  return validateAndSanitize(foodLogIdSchema, id, 'food log ID')
}