import { z } from 'zod'

import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_MESSAGE,
  PASSWORD_POLICY_REGEX,
} from '@/lib/password-policy';

// ============================================
// HELPER: bridges a Zod schema to a TanStack Form onChange validator
// @tanstack/zod-form-adapter requires Zod v3; this project uses Zod v4
// ============================================

export function zodValidator<T>(schema: z.ZodType<T>) {
  return ({ value }: { value: unknown }): string | undefined => {
    const result = schema.safeParse(value);
    return result.success ? undefined : result.error.issues[0]?.message;
  };
}

// ============================================
// AUTH SCHEMAS
// ============================================

// Login form — mirrors: users.email + password check
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

// Signup form — mirrors: users.name, users.email, users.role
export const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .regex(PASSWORD_POLICY_REGEX, PASSWORD_POLICY_MESSAGE),
  role: z.enum(['individual', 'professional']),
})

// Forgot password form — just email
export const forgotPasswordFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

// Reset password form — mirrors: verifications.token + users.password
export const resetPasswordFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  code: z
    .string()
    .min(1, 'Code is required')
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
  newPassword: z
    .string()
    .min(1, 'Password is required')
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .regex(PASSWORD_POLICY_REGEX, PASSWORD_POLICY_MESSAGE),
})

// Verify email form — mirrors: emailVerificationChallenges.code
export const verifyEmailFormSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
})

// ============================================
// GOALS SCHEMA — mirrors: nutritionGoals table
// ============================================

export const goalsFormSchema = z.object({
  goalType: z.enum([
    'weight_loss', 'maintenance', 'weight_gain',
    'muscle_gain', 'fat_loss', 'performance', 'general_health'
  ]),
  activityLevel: z.enum([
    'sedentary', 'light', 'moderate', 'active', 'extra_active'
  ]),
  // HTML number inputs return strings; preprocess rejects empty/null so required fields don't silently coerce to 0
  calories: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ error: 'Calories is required' }).min(500, 'Calories must be at least 500').max(15000, 'Calories must be at most 15,000'),
  ),
  protein: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ error: 'Protein is required' }).min(0, 'Must be 0 or more').max(2000, 'Protein must be at most 2,000g'),
  ),
  carbs: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ error: 'Carbs is required' }).min(0, 'Must be 0 or more').max(3000, 'Carbs must be at most 3,000g'),
  ),
  fat: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ error: 'Fat is required' }).min(0, 'Must be 0 or more').max(1000, 'Fat must be at most 1,000g'),
  ),
  fiber: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ error: 'Fiber is required' }).min(0, 'Must be 0 or more').max(200, 'Fiber must be at most 200g'),
  ),
  sodium: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ error: 'Sodium is required' }).min(0, 'Must be 0 or more').max(100000, 'Sodium must be at most 100,000mg'),
  ),
  hydration: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ error: 'Hydration is required' }).min(0, 'Must be 0 or more').max(10000, 'Hydration must be at most 10,000ml'),
  ),
})

// ============================================
// CUSTOM FOOD SCHEMA — mirrors: foods table
// ============================================

export const SERVING_UNIT_VALUES = [
  'g', 'oz', 'mL', 'c', 'fl oz', 'container', 'scoop', 'piece', 'unit',
] as const satisfies [string, ...string[]];
export type ServingUnit = typeof SERVING_UNIT_VALUES[number];

export const customFoodFormSchema = z.object({
  // Basic info
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be at most 200 characters'),
  brandName: z
    .string()
    .max(200, 'Brand name must be at most 200 characters')
    .optional(),
  servingQty: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().min(0, 'Must be 0 or more').optional(),
  ),
  servingUnit: z.enum(SERVING_UNIT_VALUES).optional(),
  servingWeightGrams: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().min(0, 'Must be 0 or more').optional(),
  ),
  // Macros (per 100g) — required
  // z.preprocess converts empty string → undefined so required_error fires (z.coerce.number coerces '' to 0 otherwise)
  calories: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ error: 'Calories is required' }).min(0, 'Must be 0 or more'),
  ),
  protein: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ error: 'Protein is required' }).min(0, 'Must be 0 or more'),
  ),
  carbs: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ error: 'Carbs is required' }).min(0, 'Must be 0 or more'),
  ),
  fat: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ error: 'Fat is required' }).min(0, 'Must be 0 or more'),
  ),
  // Optional extra nutrients (per 100g)
  fiber: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ error: 'Must be a number' }).min(0, 'Must be 0 or more').optional(),
  ),
  sugar: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ error: 'Must be a number' }).min(0, 'Must be 0 or more').optional(),
  ),
  sodium: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number({ error: 'Must be a number' }).min(0, 'Must be 0 or more').optional(),
  ),
})

// ============================================
// CUSTOM DISH SCHEMA — mirrors: customDishes table
// ============================================

export const customDishFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be at most 200 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
})

// ============================================
// FOOD LOG ADD FORM SCHEMA — mirrors: foodLogItems (mealType, quantity)
// ============================================

export const foodLogFormSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
    error: 'Meal type is required',
  }),
  servingId: z.string().min(1, 'Serving is required'),
  quantity: z.coerce
    .number({ error: 'Quantity is required' })
    .min(0.1, 'Quantity must be at least 0.1'),
})

// ============================================
// DISH LOG FORM SCHEMA — mirrors: foodLogItems (mealType, multiplier)
// ============================================

export const dishLogFormSchema = z.object({
  multiplier: z.coerce
    .number({ error: 'Must be a number' })
    .positive('Must be positive'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
    error: 'Meal type is required',
  }),
})

// ============================================
// DIET PLAN SCHEMA — mirrors: dietPlans table
// ============================================

export const dietPlanFormSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(255, 'Name must be at most 255 characters'),
  description: z.string().optional(),
  targetCalories: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ error: 'Calories are required' }).positive('Must be positive'),
  ),
  targetProtein: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ error: 'Protein is required' }).positive('Must be positive'),
  ),
  targetCarbs: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ error: 'Carbs are required' }).positive('Must be positive'),
  ),
  targetFat: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ error: 'Fat is required' }).positive('Must be positive'),
  ),
  startDate: z.coerce.date({ error: 'Start date is required' }),
  endDate: z.coerce.date().optional(),
  status: z.enum(['active', 'draft', 'archived']),
})

// ============================================
// BIOMETRIC PROFILE SCHEMA — mirrors: user_profiles table + users.name
// ============================================

export const biometricProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be at most 255 characters'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .or(z.literal('')),
  gender: z.enum(['woman', 'man', 'non-binary', 'prefer-not-to-say']).optional(),
  preferredUnit: z.enum(['metric', 'imperial']).default('metric'),
  // Metric inputs
  heightCm: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().min(50, 'Height must be at least 50cm').max(300, 'Height must be at most 300cm').optional(),
  ),
  weightKg: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().min(10, 'Weight must be at least 10kg').max(500, 'Weight must be at most 500kg').optional(),
  ),
  // Imperial inputs (converted to metric before API submit)
  heightFt: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().int().min(0).max(9).optional(),
  ),
  heightIn: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().min(0).max(11.9).optional(),
  ),
  weightLbs: z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().min(22, 'Weight must be at least 22lbs').max(1100, 'Weight must be at most 1100lbs').optional(),
  ),
})

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>
export type VerifyEmailFormData = z.infer<typeof verifyEmailFormSchema>
export type GoalsFormData = z.infer<typeof goalsFormSchema>
export type CustomFoodFormData = z.infer<typeof customFoodFormSchema>
export type CustomDishFormData = z.infer<typeof customDishFormSchema>
export type FoodLogFormData = z.infer<typeof foodLogFormSchema>
export type DishLogFormData = z.infer<typeof dishLogFormSchema>
export type DietPlanFormData = z.infer<typeof dietPlanFormSchema>
export type BiometricProfileFormData = z.infer<typeof biometricProfileSchema>
