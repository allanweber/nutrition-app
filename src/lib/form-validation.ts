import { z } from 'zod'

import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_MESSAGE,
  PASSWORD_POLICY_REGEX,
} from '@/lib/password-policy';

// ============================================
// CLIENT-SIDE FORM VALIDATION SCHEMAS
// ============================================

// Login form validation
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

// Signup form validation
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

// Goals form validation (client-side)
export const goalsFormSchema = z.object({
  goalType: z.enum([
    'weight_loss', 'maintenance', 'weight_gain',
    'muscle_gain', 'fat_loss', 'performance', 'general_health'
  ]),
  activityLevel: z.enum([
    'sedentary', 'light', 'moderate', 'active', 'extra_active'
  ]),
  calories: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseInt(val) : val
      return num
    })
    .refine((val) => val >= 500 && val <= 15000, 'Calories must be between 500 and 15,000'),
  protein: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseInt(val) : val
      return num
    })
    .refine((val) => val >= 0 && val <= 2000, 'Protein must be between 0 and 2,000g'),
  carbs: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseInt(val) : val
      return num
    })
    .refine((val) => val >= 0 && val <= 3000, 'Carbs must be between 0 and 3,000g'),
  fat: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseInt(val) : val
      return num
    })
    .refine((val) => val >= 0 && val <= 1000, 'Fat must be between 0 and 1,000g'),
  fiber: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseInt(val) : val
      return num
    })
    .refine((val) => val >= 0 && val <= 200, 'Fiber must be between 0 and 200g'),
  sodium: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseInt(val) : val
      return num
    })
    .refine((val) => val >= 0 && val <= 100000, 'Sodium must be between 0 and 100,000mg'),
})

// Type exports for form usage
export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type GoalsFormData = z.infer<typeof goalsFormSchema>