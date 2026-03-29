/**
 * Database Seed Script
 *
 * Creates sample data for development:
 * - 2 individual users with food logs and nutrition goals
 * - 2 professional users (dietitians)
 *
 * Run with: npm run db:seed
 *
 * NOTE: Users are created via Better Auth API to ensure proper password hashing.
 * The dev server must be running on http://localhost:3000 for this to work.
 */

import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, eq } from 'drizzle-orm';
import * as schema from './schema';
import { subDays, startOfDay, setHours } from 'date-fns';
import { uuidv7 } from 'uuidv7';

const connectionString = process.env.DATABASE_URL;
const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

// Sample foods data
const sampleFoods = [
  {
    sourceId: 'seed-apple',
    source: 'seed',
    name: 'Apple, raw',
    servingQty: '1',
    servingUnit: 'medium (182g)',
    servingWeightGrams: '182',
    calories: '95',
    protein: '0.5',
    carbs: '25',
    fat: '0.3',
    fiber: '4.4',
    sugar: '19',
    sodium: '2',
    fullNutrients: { saturatedFat: 0.05, polyunsaturatedFat: 0.09, monounsaturatedFat: 0.01, cholesterol: 0, potassium: 195, vitaminA: 5, vitaminC: 8.4, calcium: 11, iron: 0.22 },
  },
  {
    sourceId: 'seed-banana',
    source: 'seed',
    name: 'Banana, raw',
    servingQty: '1',
    servingUnit: 'medium (118g)',
    servingWeightGrams: '118',
    calories: '105',
    protein: '1.3',
    carbs: '27',
    fat: '0.4',
    fiber: '3.1',
    sugar: '14',
    sodium: '1',
    fullNutrients: { saturatedFat: 0.13, polyunsaturatedFat: 0.06, monounsaturatedFat: 0.04, cholesterol: 0, potassium: 422, vitaminA: 4, vitaminC: 10.3, calcium: 6, iron: 0.31 },
  },
  {
    sourceId: 'seed-chicken-breast',
    source: 'seed',
    name: 'Chicken Breast, grilled',
    servingQty: '1',
    servingUnit: 'breast (172g)',
    servingWeightGrams: '172',
    calories: '284',
    protein: '53',
    carbs: '0',
    fat: '6.2',
    fiber: '0',
    sugar: '0',
    sodium: '104',
    fullNutrients: { saturatedFat: 1.01, polyunsaturatedFat: 0.55, monounsaturatedFat: 0.98, cholesterol: 146, potassium: 616, vitaminA: 10, vitaminC: 0, calcium: 15, iron: 1.03 },
  },
  {
    sourceId: 'seed-brown-rice',
    source: 'seed',
    name: 'Brown Rice, cooked',
    servingQty: '1',
    servingUnit: 'cup (195g)',
    servingWeightGrams: '195',
    calories: '216',
    protein: '5',
    carbs: '45',
    fat: '1.8',
    fiber: '3.5',
    sugar: '0.7',
    sodium: '10',
    fullNutrients: { saturatedFat: 0.36, polyunsaturatedFat: 0.64, monounsaturatedFat: 0.64, cholesterol: 0, potassium: 154, vitaminA: 0, vitaminC: 0, calcium: 20, iron: 1.03 },
  },
  {
    sourceId: 'seed-eggs',
    source: 'seed',
    name: 'Eggs, scrambled',
    servingQty: '2',
    servingUnit: 'large eggs',
    servingWeightGrams: '122',
    calories: '182',
    protein: '12',
    carbs: '2',
    fat: '14',
    fiber: '0',
    sugar: '2',
    sodium: '342',
    fullNutrients: { saturatedFat: 4.38, polyunsaturatedFat: 1.57, monounsaturatedFat: 4.68, cholesterol: 418, potassium: 163, vitaminA: 152, vitaminC: 0.3, calcium: 78, iron: 1.83 },
  },
  {
    sourceId: 'seed-oatmeal',
    source: 'seed',
    name: 'Oatmeal, cooked',
    servingQty: '1',
    servingUnit: 'cup (234g)',
    servingWeightGrams: '234',
    calories: '158',
    protein: '6',
    carbs: '27',
    fat: '3.2',
    fiber: '4',
    sugar: '1.1',
    sodium: '115',
    fullNutrients: { saturatedFat: 0.51, polyunsaturatedFat: 1.22, monounsaturatedFat: 1.01, cholesterol: 0, potassium: 164, vitaminA: 0, vitaminC: 0, calcium: 21, iron: 2.11 },
  },
  {
    sourceId: 'seed-salmon',
    source: 'seed',
    name: 'Salmon, baked',
    servingQty: '1',
    servingUnit: 'fillet (154g)',
    servingWeightGrams: '154',
    calories: '280',
    protein: '39',
    carbs: '0',
    fat: '12',
    fiber: '0',
    sugar: '0',
    sodium: '86',
    fullNutrients: { saturatedFat: 2.13, polyunsaturatedFat: 4.0, monounsaturatedFat: 3.5, cholesterol: 109, potassium: 628, vitaminA: 14, vitaminC: 0, calcium: 17, iron: 0.62 },
  },
  {
    sourceId: 'seed-salad',
    source: 'seed',
    name: 'Mixed Green Salad with dressing',
    servingQty: '1',
    servingUnit: 'bowl (200g)',
    servingWeightGrams: '200',
    calories: '120',
    protein: '3',
    carbs: '10',
    fat: '8',
    fiber: '3',
    sugar: '4',
    sodium: '280',
    fullNutrients: { saturatedFat: 1.1, polyunsaturatedFat: 3.2, monounsaturatedFat: 2.9, cholesterol: 0, potassium: 320, vitaminA: 200, vitaminC: 25, calcium: 60, iron: 1.2 },
  },
  {
    sourceId: 'seed-greek-yogurt',
    source: 'seed',
    name: 'Greek Yogurt, plain',
    servingQty: '1',
    servingUnit: 'container (170g)',
    servingWeightGrams: '170',
    calories: '100',
    protein: '17',
    carbs: '6',
    fat: '0.7',
    fiber: '0',
    sugar: '4',
    sodium: '65',
    fullNutrients: { saturatedFat: 0.15, polyunsaturatedFat: 0.02, monounsaturatedFat: 0.05, cholesterol: 8, potassium: 240, vitaminA: 0, vitaminC: 0, calcium: 187, iron: 0.1 },
  },
  {
    sourceId: 'seed-almonds',
    source: 'seed',
    name: 'Almonds, raw',
    servingQty: '1',
    servingUnit: 'oz (28g)',
    servingWeightGrams: '28',
    calories: '164',
    protein: '6',
    carbs: '6',
    fat: '14',
    fiber: '3.5',
    sugar: '1.2',
    sodium: '0',
    fullNutrients: { saturatedFat: 1.07, polyunsaturatedFat: 3.44, monounsaturatedFat: 8.77, cholesterol: 0, potassium: 200, vitaminA: 0, vitaminC: 0, calcium: 76, iron: 1.05 },
  },
  {
    sourceId: 'seed-pasta',
    source: 'seed',
    name: 'Pasta, whole wheat, cooked',
    servingQty: '1',
    servingUnit: 'cup (140g)',
    servingWeightGrams: '140',
    calories: '174',
    protein: '7.5',
    carbs: '37',
    fat: '0.8',
    fiber: '6.3',
    sugar: '0.8',
    sodium: '4',
    fullNutrients: { saturatedFat: 0.14, polyunsaturatedFat: 0.29, monounsaturatedFat: 0.06, cholesterol: 0, potassium: 145, vitaminA: 0, vitaminC: 0, calcium: 21, iron: 1.68 },
  },
  {
    sourceId: 'seed-avocado',
    source: 'seed',
    name: 'Avocado, raw',
    servingQty: '1',
    servingUnit: 'medium (150g)',
    servingWeightGrams: '150',
    calories: '240',
    protein: '3',
    carbs: '13',
    fat: '22',
    fiber: '10',
    sugar: '1',
    sodium: '11',
    fullNutrients: { saturatedFat: 3.19, polyunsaturatedFat: 2.69, monounsaturatedFat: 14.68, cholesterol: 0, potassium: 728, vitaminA: 12, vitaminC: 15, calcium: 18, iron: 0.86 },
  },
  {
    sourceId: 'seed-toast',
    source: 'seed',
    name: 'Whole Wheat Toast with butter',
    servingQty: '2',
    servingUnit: 'slices',
    servingWeightGrams: '60',
    calories: '190',
    protein: '6',
    carbs: '24',
    fat: '8',
    fiber: '4',
    sugar: '3',
    sodium: '320',
    fullNutrients: { saturatedFat: 2.8, polyunsaturatedFat: 0.5, monounsaturatedFat: 2.2, cholesterol: 15, potassium: 120, vitaminA: 60, vitaminC: 0, calcium: 50, iron: 1.2 },
  },
  {
    sourceId: 'seed-coffee',
    source: 'seed',
    name: 'Coffee with milk',
    servingQty: '1',
    servingUnit: 'cup (240ml)',
    servingWeightGrams: '250',
    calories: '30',
    protein: '1',
    carbs: '3',
    fat: '1.5',
    fiber: '0',
    sugar: '3',
    sodium: '15',
    fullNutrients: { saturatedFat: 0.8, polyunsaturatedFat: 0.05, monounsaturatedFat: 0.3, cholesterol: 4, potassium: 110, vitaminA: 12, vitaminC: 0, calcium: 40, iron: 0.05 },
  },
  {
    sourceId: 'seed-protein-shake',
    source: 'seed',
    name: 'Protein Shake, whey',
    servingQty: '1',
    servingUnit: 'scoop (30g)',
    servingWeightGrams: '30',
    calories: '120',
    protein: '24',
    carbs: '3',
    fat: '1',
    fiber: '0',
    sugar: '1',
    sodium: '50',
    fullNutrients: { saturatedFat: 0.5, polyunsaturatedFat: 0.1, monounsaturatedFat: 0.2, cholesterol: 50, potassium: 160, vitaminA: 0, vitaminC: 0, calcium: 100, iron: 0.7 },
  },
];

// Sample user definitions - one individual per goal type
const sampleUserDefs = {
  individuals: [
    {
      email: 'user.weight-loss@example.com',
      name: 'Alex Weight Loss',
      password: 'Password123!',
      role: 'individual' as const,
      goal: {
        goalType: 'weight_loss' as const,
        targetCalories: '1600',
        targetProtein: '130',
        targetCarbs: '160',
        targetFat: '55',
        targetFiber: '30',
        targetSodium: '2000',
        activityLevel: 'moderate',
      },
    },
    {
      email: 'user.maintenance@example.com',
      name: 'Jordan Maintenance',
      password: 'Password123!',
      role: 'individual' as const,
      goal: {
        goalType: 'maintenance' as const,
        targetCalories: '2000',
        targetProtein: '150',
        targetCarbs: '220',
        targetFat: '70',
        targetFiber: '30',
        targetSodium: '2300',
        activityLevel: 'moderate',
      },
    },
    {
      email: 'user.weight-gain@example.com',
      name: 'Sam Weight Gain',
      password: 'Password123!',
      role: 'individual' as const,
      goal: {
        goalType: 'weight_gain' as const,
        targetCalories: '2800',
        targetProtein: '160',
        targetCarbs: '350',
        targetFat: '95',
        targetFiber: '35',
        targetSodium: '2500',
        activityLevel: 'active',
      },
    },
    {
      email: 'user.muscle-gain@example.com',
      name: 'Chris Muscle Gain',
      password: 'Password123!',
      role: 'individual' as const,
      goal: {
        goalType: 'muscle_gain' as const,
        targetCalories: '2600',
        targetProtein: '200',
        targetCarbs: '280',
        targetFat: '80',
        targetFiber: '35',
        targetSodium: '2500',
        activityLevel: 'extra_active',
      },
    },
    {
      email: 'user.fat-loss@example.com',
      name: 'Taylor Fat Loss',
      password: 'Password123!',
      role: 'individual' as const,
      goal: {
        goalType: 'fat_loss' as const,
        targetCalories: '1700',
        targetProtein: '170',
        targetCarbs: '140',
        targetFat: '50',
        targetFiber: '35',
        targetSodium: '2000',
        activityLevel: 'active',
      },
    },
    {
      email: 'user.performance@example.com',
      name: 'Morgan Performance',
      password: 'Password123!',
      role: 'individual' as const,
      goal: {
        goalType: 'performance' as const,
        targetCalories: '2400',
        targetProtein: '180',
        targetCarbs: '300',
        targetFat: '70',
        targetFiber: '40',
        targetSodium: '2800',
        activityLevel: 'extra_active',
      },
    },
    {
      email: 'user.general-health@example.com',
      name: 'Casey General Health',
      password: 'Password123!',
      role: 'individual' as const,
      goal: {
        goalType: 'general_health' as const,
        targetCalories: '2000',
        targetProtein: '100',
        targetCarbs: '250',
        targetFat: '70',
        targetFiber: '30',
        targetSodium: '2300',
        activityLevel: 'light',
      },
    },

    // Dedicated account for password-reset / change-password E2E flows.
    // Keep this email unique and unused by other tests.
    {
      email: 'reset-pwd-test@mail.com',
      name: 'Reset Password Test User',
      password: 'Password123!',
      role: 'individual' as const,
      goal: {
        goalType: 'maintenance' as const,
        targetCalories: '2000',
        targetProtein: '150',
        targetCarbs: '220',
        targetFat: '70',
        targetFiber: '30',
        targetSodium: '2300',
        activityLevel: 'moderate',
      },
    },
  ],
  professionals: [
    {
      email: 'dr.sarah.wilson@example.com',
      name: 'Dr. Sarah Wilson',
      password: 'Password123!',
      role: 'professional' as const,
    },
    {
      email: 'mark.nutritionist@example.com',
      name: 'Mark Thompson, RD',
      password: 'Password123!',
      role: 'professional' as const,
    },
  ],
};

// Custom foods per seed user (inserted with userId after user creation)
// Cleanup is automatic via cascade delete when users are deleted
const customFoodsByEmail: Record<string, Array<{
  sourceId: string;
  source: string;
  name: string;
  servingQty: string;
  servingUnit: string;
  servingWeightGrams: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  sodium: string;
}>> = {
  'user.weight-loss@example.com': [
    {
      sourceId: 'custom-green-smoothie',
      source: 'user_custom',
      name: "Alex's Green Smoothie",
      servingQty: '1',
      servingUnit: 'glass (350ml)',
      servingWeightGrams: '350',
      calories: '53',
      protein: '2',
      carbs: '10',
      fat: '0.9',
      fiber: '1.4',
      sugar: '6',
      sodium: '23',
    },
    {
      sourceId: 'custom-chicken-wrap',
      source: 'user_custom',
      name: 'Homemade Chicken Wrap',
      servingQty: '1',
      servingUnit: 'wrap (220g)',
      servingWeightGrams: '220',
      calories: '173',
      protein: '16',
      carbs: '14',
      fat: '5.5',
      fiber: '1.8',
      sugar: '1.4',
      sodium: '236',
    },
    {
      sourceId: 'custom-overnight-oats',
      source: 'user_custom',
      name: 'Overnight Oats with Berries',
      servingQty: '1',
      servingUnit: 'jar (300g)',
      servingWeightGrams: '300',
      calories: '107',
      protein: '4.7',
      carbs: '17',
      fat: '2.3',
      fiber: '2.7',
      sugar: '6',
      sodium: '40',
    },
    {
      sourceId: 'custom-cauliflower-rice-bowl',
      source: 'user_custom',
      name: 'Cauliflower Rice Stir-Fry',
      servingQty: '1',
      servingUnit: 'bowl (350g)',
      servingWeightGrams: '350',
      calories: '85',
      protein: '4',
      carbs: '13',
      fat: '2',
      fiber: '3.2',
      sugar: '4',
      sodium: '280',
    },
    {
      sourceId: 'custom-turkey-lettuce-wraps',
      source: 'user_custom',
      name: 'Turkey Lettuce Wraps',
      servingQty: '2',
      servingUnit: 'wraps (180g)',
      servingWeightGrams: '180',
      calories: '115',
      protein: '13',
      carbs: '5',
      fat: '5',
      fiber: '1.5',
      sugar: '2',
      sodium: '310',
    },
    {
      sourceId: 'custom-egg-white-omelet',
      source: 'user_custom',
      name: 'Egg White Veggie Omelet',
      servingQty: '1',
      servingUnit: 'omelet (200g)',
      servingWeightGrams: '200',
      calories: '72',
      protein: '11',
      carbs: '3',
      fat: '2',
      fiber: '0.8',
      sugar: '2',
      sodium: '180',
    },
    {
      sourceId: 'custom-lemon-herb-cod',
      source: 'user_custom',
      name: 'Lemon Herb Baked Cod',
      servingQty: '1',
      servingUnit: 'fillet (160g)',
      servingWeightGrams: '160',
      calories: '96',
      protein: '20',
      carbs: '1',
      fat: '1',
      fiber: '0',
      sugar: '0',
      sodium: '75',
    },
    {
      sourceId: 'custom-chia-pudding',
      source: 'user_custom',
      name: 'Protein Chia Pudding',
      servingQty: '1',
      servingUnit: 'cup (200g)',
      servingWeightGrams: '200',
      calories: '142',
      protein: '8',
      carbs: '16',
      fat: '6',
      fiber: '8',
      sugar: '4',
      sodium: '55',
    },
    {
      sourceId: 'custom-cucumber-hummus',
      source: 'user_custom',
      name: 'Cucumber & Hummus Snack',
      servingQty: '1',
      servingUnit: 'serving (150g)',
      servingWeightGrams: '150',
      calories: '98',
      protein: '4',
      carbs: '11',
      fat: '4',
      fiber: '2.5',
      sugar: '3',
      sodium: '190',
    },
    {
      sourceId: 'custom-detox-veggie-soup',
      source: 'user_custom',
      name: 'Detox Vegetable Soup',
      servingQty: '1',
      servingUnit: 'bowl (400g)',
      servingWeightGrams: '400',
      calories: '42',
      protein: '3',
      carbs: '7',
      fat: '0.5',
      fiber: '2.5',
      sugar: '3',
      sodium: '320',
    },
    {
      sourceId: 'custom-tuna-avocado-salad',
      source: 'user_custom',
      name: 'Tuna & Avocado Salad',
      servingQty: '1',
      servingUnit: 'bowl (250g)',
      servingWeightGrams: '250',
      calories: '135',
      protein: '14',
      carbs: '3',
      fat: '8',
      fiber: '3',
      sugar: '1',
      sodium: '210',
    },
    {
      sourceId: 'custom-black-bean-quinoa-bowl',
      source: 'user_custom',
      name: 'Black Bean & Quinoa Bowl',
      servingQty: '1',
      servingUnit: 'bowl (320g)',
      servingWeightGrams: '320',
      calories: '118',
      protein: '6',
      carbs: '20',
      fat: '2',
      fiber: '4.5',
      sugar: '2',
      sodium: '260',
    },
  ],
  'user.muscle-gain@example.com': [
    {
      sourceId: 'custom-mass-shake',
      source: 'user_custom',
      name: "Chris's Mass Builder Shake",
      servingQty: '1',
      servingUnit: 'shake (550ml)',
      servingWeightGrams: '550',
      calories: '124',
      protein: '8.2',
      carbs: '15',
      fat: '2.7',
      fiber: '1.1',
      sugar: '5.5',
      sodium: '36',
    },
    {
      sourceId: 'custom-protein-bowl',
      source: 'user_custom',
      name: 'Post-Workout Protein Bowl',
      servingQty: '1',
      servingUnit: 'bowl (400g)',
      servingWeightGrams: '400',
      calories: '130',
      protein: '11',
      carbs: '14',
      fat: '3',
      fiber: '1.8',
      sugar: '2',
      sodium: '95',
    },
    {
      sourceId: 'custom-bulking-overnight-oats',
      source: 'user_custom',
      name: 'High-Calorie Overnight Oats',
      servingQty: '1',
      servingUnit: 'jar (400g)',
      servingWeightGrams: '400',
      calories: '195',
      protein: '9',
      carbs: '28',
      fat: '6',
      fiber: '3.5',
      sugar: '8',
      sodium: '80',
    },
    {
      sourceId: 'custom-beef-rice-bowl',
      source: 'user_custom',
      name: 'Ground Beef & Rice Bowl',
      servingQty: '1',
      servingUnit: 'bowl (380g)',
      servingWeightGrams: '380',
      calories: '165',
      protein: '14',
      carbs: '16',
      fat: '5',
      fiber: '1',
      sugar: '1',
      sodium: '290',
    },
  ],
  'user.maintenance@example.com': [
    {
      sourceId: 'custom-family-stew',
      source: 'user_custom',
      name: "Jordan's Family Beef Stew",
      servingQty: '1',
      servingUnit: 'bowl (350g)',
      servingWeightGrams: '350',
      calories: '120',
      protein: '8',
      carbs: '11',
      fat: '4',
      fiber: '1.4',
      sugar: '1.7',
      sodium: '194',
    },
    {
      sourceId: 'custom-veggie-pasta',
      source: 'user_custom',
      name: 'Vegetable Pasta Primavera',
      servingQty: '1',
      servingUnit: 'plate (330g)',
      servingWeightGrams: '330',
      calories: '138',
      protein: '5',
      carbs: '24',
      fat: '3',
      fiber: '3',
      sugar: '4',
      sodium: '180',
    },
    {
      sourceId: 'custom-mixed-grain-bowl',
      source: 'user_custom',
      name: 'Mixed Grain & Roasted Veg Bowl',
      servingQty: '1',
      servingUnit: 'bowl (360g)',
      servingWeightGrams: '360',
      calories: '112',
      protein: '4',
      carbs: '20',
      fat: '2',
      fiber: '3.5',
      sugar: '3',
      sodium: '160',
    },
  ],
  'user.fat-loss@example.com': [
    {
      sourceId: 'custom-high-protein-salad',
      source: 'user_custom',
      name: "Taylor's High-Protein Salad",
      servingQty: '1',
      servingUnit: 'bowl (300g)',
      servingWeightGrams: '300',
      calories: '110',
      protein: '15',
      carbs: '6',
      fat: '3',
      fiber: '3',
      sugar: '3',
      sodium: '220',
    },
    {
      sourceId: 'custom-cottage-cheese-bowl',
      source: 'user_custom',
      name: 'Cottage Cheese & Veggie Bowl',
      servingQty: '1',
      servingUnit: 'bowl (250g)',
      servingWeightGrams: '250',
      calories: '88',
      protein: '12',
      carbs: '5',
      fat: '2',
      fiber: '1',
      sugar: '4',
      sodium: '300',
    },
    {
      sourceId: 'custom-shrimp-zoodles',
      source: 'user_custom',
      name: 'Garlic Shrimp with Zoodles',
      servingQty: '1',
      servingUnit: 'plate (320g)',
      servingWeightGrams: '320',
      calories: '95',
      protein: '14',
      carbs: '5',
      fat: '2.5',
      fiber: '1.5',
      sugar: '3',
      sodium: '310',
    },
    {
      sourceId: 'custom-turkey-meatballs',
      source: 'user_custom',
      name: 'Lean Turkey Meatballs',
      servingQty: '4',
      servingUnit: 'meatballs (160g)',
      servingWeightGrams: '160',
      calories: '148',
      protein: '18',
      carbs: '4',
      fat: '6',
      fiber: '0.5',
      sugar: '1',
      sodium: '340',
    },
    {
      sourceId: 'custom-edamame-snack',
      source: 'user_custom',
      name: 'Edamame & Sea Salt Snack',
      servingQty: '1',
      servingUnit: 'cup shelled (155g)',
      servingWeightGrams: '155',
      calories: '121',
      protein: '11',
      carbs: '9',
      fat: '5',
      fiber: '4',
      sugar: '2',
      sodium: '290',
    },
  ],
  'user.performance@example.com': [
    {
      sourceId: 'custom-pre-workout-bowl',
      source: 'user_custom',
      name: "Morgan's Pre-Race Carb Bowl",
      servingQty: '1',
      servingUnit: 'bowl (450g)',
      servingWeightGrams: '450',
      calories: '175',
      protein: '6',
      carbs: '34',
      fat: '2',
      fiber: '2',
      sugar: '5',
      sodium: '120',
    },
    {
      sourceId: 'custom-recovery-smoothie',
      source: 'user_custom',
      name: 'Post-Training Recovery Smoothie',
      servingQty: '1',
      servingUnit: 'bottle (500ml)',
      servingWeightGrams: '500',
      calories: '90',
      protein: '7',
      carbs: '13',
      fat: '0.5',
      fiber: '1',
      sugar: '9',
      sodium: '55',
    },
    {
      sourceId: 'custom-energy-bites',
      source: 'user_custom',
      name: 'Homemade Energy Bites',
      servingQty: '3',
      servingUnit: 'bites (60g)',
      servingWeightGrams: '60',
      calories: '420',
      protein: '9',
      carbs: '52',
      fat: '18',
      fiber: '5',
      sugar: '20',
      sodium: '60',
    },
    {
      sourceId: 'custom-salmon-sweet-potato',
      source: 'user_custom',
      name: 'Baked Salmon & Sweet Potato',
      servingQty: '1',
      servingUnit: 'plate (380g)',
      servingWeightGrams: '380',
      calories: '122',
      protein: '12',
      carbs: '12',
      fat: '3',
      fiber: '1.5',
      sugar: '4',
      sodium: '115',
    },
  ],
};

// Goal type for food log generation
type GoalVariant =
  | 'weight_loss'
  | 'maintenance'
  | 'weight_gain'
  | 'muscle_gain'
  | 'fat_loss'
  | 'performance'
  | 'general_health';

// Generate food logs for the past 14 days
function generateFoodLogs(
  userId: string,
  foodIds: string[],
  variant: GoalVariant
) {
  const logs: Array<{
    userId: string;
    foodId: string;
    quantity: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    consumedAt: Date;
  }> = [];

  const today = startOfDay(new Date());

  // Food indices reference:
  // 0: Apple, 1: Banana, 2: Chicken Breast, 3: Brown Rice, 4: Eggs
  // 5: Oatmeal, 6: Salmon, 7: Salad, 8: Greek Yogurt, 9: Almonds
  // 10: Pasta, 11: Avocado, 12: Toast, 13: Coffee, 14: Protein Shake

  // Food patterns for different goals
  const patterns: Record<GoalVariant, {
    breakfast: number[];
    lunch: number[];
    dinner: number[];
    snack: number[];
    snackCount: number;
  }> = {
    weight_loss: {
      breakfast: [5, 0, 8], // oatmeal, apple, greek yogurt
      lunch: [2, 7], // chicken, salad
      dinner: [6, 7], // salmon, salad
      snack: [9, 0], // almonds, apple
      snackCount: 1,
    },
    maintenance: {
      breakfast: [5, 1, 13], // oatmeal, banana, coffee
      lunch: [2, 3, 7], // chicken, brown rice, salad
      dinner: [6, 10, 7], // salmon, pasta, salad
      snack: [8, 9], // greek yogurt, almonds
      snackCount: 2,
    },
    weight_gain: {
      breakfast: [4, 12, 11, 13, 14], // eggs, toast, avocado, coffee, protein shake
      lunch: [2, 3, 11, 7], // chicken, brown rice, avocado, salad
      dinner: [6, 10, 7, 12], // salmon, pasta, salad, toast
      snack: [14, 1, 9, 8], // protein shake, banana, almonds, greek yogurt
      snackCount: 4,
    },
    muscle_gain: {
      breakfast: [4, 12, 13, 14], // eggs, toast, coffee, protein shake
      lunch: [2, 3, 11], // chicken, brown rice, avocado
      dinner: [6, 10, 7], // salmon, pasta, salad
      snack: [14, 1, 9, 8], // protein shake, banana, almonds, greek yogurt
      snackCount: 3,
    },
    fat_loss: {
      breakfast: [4, 8], // eggs, greek yogurt (high protein, low carb)
      lunch: [2, 7], // chicken, salad
      dinner: [6, 7, 11], // salmon, salad, avocado
      snack: [9], // almonds
      snackCount: 1,
    },
    performance: {
      breakfast: [5, 1, 4, 13], // oatmeal, banana, eggs, coffee
      lunch: [2, 3, 7, 11], // chicken, brown rice, salad, avocado
      dinner: [6, 10, 7], // salmon, pasta, salad
      snack: [14, 1, 8], // protein shake, banana, greek yogurt
      snackCount: 3,
    },
    general_health: {
      breakfast: [5, 0, 13], // oatmeal, apple, coffee
      lunch: [2, 3, 7], // chicken, brown rice, salad
      dinner: [6, 7, 11], // salmon, salad, avocado
      snack: [8, 0, 9], // greek yogurt, apple, almonds
      snackCount: 2,
    },
  };

  const pattern = patterns[variant];

  // Generate logs for the past 14 days
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = subDays(today, dayOffset);

    // Skip some days randomly for realism (about 10% skip rate)
    if (Math.random() < 0.1) continue;

    // Breakfast (7-9 AM)
    const breakfastHour = 7 + Math.floor(Math.random() * 2);
    pattern.breakfast.forEach((foodIndex, i) => {
      if (foodIds[foodIndex] && Math.random() > 0.15) {
        logs.push({
          userId,
          foodId: foodIds[foodIndex],
          quantity: '100',
          mealType: 'breakfast',
          consumedAt: setHours(date, breakfastHour + i * 0.1),
        });
      }
    });

    // Lunch (12-1 PM)
    const lunchHour = 12 + Math.floor(Math.random() * 1);
    pattern.lunch.forEach((foodIndex, i) => {
      if (foodIds[foodIndex] && Math.random() > 0.1) {
        logs.push({
          userId,
          foodId: foodIds[foodIndex],
          quantity: '100',
          mealType: 'lunch',
          consumedAt: setHours(date, lunchHour + i * 0.1),
        });
      }
    });

    // Dinner (6-8 PM)
    const dinnerHour = 18 + Math.floor(Math.random() * 2);
    pattern.dinner.forEach((foodIndex, i) => {
      if (foodIds[foodIndex] && Math.random() > 0.1) {
        logs.push({
          userId,
          foodId: foodIds[foodIndex],
          quantity: '100',
          mealType: 'dinner',
          consumedAt: setHours(date, dinnerHour + i * 0.1),
        });
      }
    });

    // Snacks (random times)
    for (let s = 0; s < pattern.snackCount; s++) {
      const snackFoodIndex = pattern.snack[s % pattern.snack.length];
      if (foodIds[snackFoodIndex] && Math.random() > 0.3) {
        const snackHour = 10 + Math.floor(Math.random() * 8);
        logs.push({
          userId,
          foodId: foodIds[snackFoodIndex],
          quantity: '100',
          mealType: 'snack',
          consumedAt: setHours(date, snackHour),
        });
      }
    }
  }

  return logs;
}

async function insertGroupedFoodLogs(
  userId: string,
  logs: Array<{
    userId: string;
    foodId: string;
    quantity: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    consumedAt: Date;
  }>,
) {
  if (logs.length === 0) {
    return;
  }

  await db.transaction(async (tx) => {
    for (const log of logs) {
      const existingMeal = await tx.query.foodLogMeals.findFirst({
        where: and(
          eq(schema.foodLogMeals.userId, userId),
          eq(schema.foodLogMeals.mealType, log.mealType),
          eq(schema.foodLogMeals.consumedAt, log.consumedAt),
        ),
      });

      let mealId = existingMeal?.id;
      if (!mealId) {
        const [newMeal] = await tx
          .insert(schema.foodLogMeals)
          .values({
            userId,
            mealType: log.mealType,
            consumedAt: log.consumedAt,
          })
          .returning();
        mealId = newMeal.id;
      }

      await tx.insert(schema.foodLogItems).values({
        mealId,
        foodId: log.foodId,
        quantity: log.quantity,
        altMeasureId: null,
      });
    }
  });
}

// Create user via Better Auth API
async function createUserViaApi(
  name: string,
  email: string,
  password: string
): Promise<{ id: string } | null> {
  try {
    const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': baseUrl,
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Check if user already exists
      if (errorText.includes('already exists') || response.status === 409) {
        // User exists, try to find them
        const existingUser = await db.query.users.findFirst({
          where: eq(schema.users.email, email),
        });
        if (existingUser) {
          return { id: existingUser.id };
        }
      }
      console.error(`  Failed to create user ${email}: ${errorText}`);
      return null;
    }

    const data = await response.json();
    return { id: data.user?.id };
  } catch (error) {
    console.error(`  Error creating user ${email}:`, error);
    return null;
  }
}

// Seed dishes + favorites for a given user
// foodIds: [Apple=0, Banana=1, Chicken=2, BrownRice=3, Eggs=4, Oatmeal=5, Salmon=6, Salad=7, GreekYogurt=8, Almonds=9, ...]
async function seedDishesAndFavorites(
  userId: string,
  foodIds: string[],
  dbInstance: typeof db,
) {
  // dish 1: High-Protein Breakfast Bowl (eggs 150g + greek yogurt 100g + almonds 15g)
  const dish1Id = uuidv7();
  await dbInstance.insert(schema.customDishes).values({
    id: dish1Id,
    userId,
    name: 'High-Protein Breakfast Bowl',
    description: 'A nutritious breakfast with eggs, yogurt and almonds',
  });
  await dbInstance.insert(schema.customDishIngredients).values([
    { dishId: dish1Id, foodId: foodIds[4], quantity: '150', seq: 1 }, // Eggs
    { dishId: dish1Id, foodId: foodIds[8], quantity: '100', seq: 2 }, // Greek Yogurt
    { dishId: dish1Id, foodId: foodIds[9], quantity: '15',  seq: 3 }, // Almonds
  ]);

  // dish 2: Post-Workout Plate (chicken 200g + brown rice 150g + salad 100g)
  const dish2Id = uuidv7();
  await dbInstance.insert(schema.customDishes).values({
    id: dish2Id,
    userId,
    name: 'Post-Workout Plate',
    description: 'High protein recovery meal with rice and salad',
  });
  await dbInstance.insert(schema.customDishIngredients).values([
    { dishId: dish2Id, foodId: foodIds[2], quantity: '200', seq: 1 }, // Chicken Breast
    { dishId: dish2Id, foodId: foodIds[3], quantity: '150', seq: 2 }, // Brown Rice
    { dishId: dish2Id, foodId: foodIds[7], quantity: '100', seq: 3 }, // Salad
  ]);

  // Placeholder photos for dishes
  await dbInstance.insert(schema.dishPhotos).values([
    {
      dishId: dish1Id,
      thumb: 'https://placehold.co/300x300.jpg',
      highres: 'https://placehold.co/900x900.jpg',
    },
    {
      dishId: dish2Id,
      thumb: 'https://placehold.co/300x300.jpg',
      highres: 'https://placehold.co/900x900.jpg',
    },
  ]);

  // 4 favorites: Apple (food), Chicken Breast (food), Banana (food), High-Protein Breakfast Bowl (dish)
  await dbInstance.insert(schema.favorites).values([
    { userId, foodId: foodIds[0] },  // Apple
    { userId, foodId: foodIds[2] },  // Chicken Breast
    { userId, foodId: foodIds[1] },  // Banana
    { userId, dishId: dish1Id },     // High-Protein Breakfast Bowl
  ]);

  console.log('    - Dishes: 2 (High-Protein Breakfast Bowl, Post-Workout Plate)');
  console.log('    - Favorites: 4 (Apple, Chicken Breast, Banana, dish)');
}

async function seed() {
  console.log('Starting database seed...\n');
  console.log(`Using auth API at: ${baseUrl}`);
  console.log('NOTE: Make sure the dev server is running (npm run dev)\n');

  try {
    // Check if server is running
    try {
      await fetch(`${baseUrl}/api/auth/session`);
    } catch {
      console.error('ERROR: Cannot connect to the dev server.');
      console.error(`Please start the server with "npm run dev" and ensure it's running at ${baseUrl}`);
      process.exit(1);
    }

    // 1. Clean up existing seed data
    console.log('Cleaning up existing seed data...');

    // Delete seed users by email
    const seedEmails = [
      ...sampleUserDefs.individuals.map((u) => u.email),
      ...sampleUserDefs.professionals.map((u) => u.email),
    ];

    for (const email of seedEmails) {
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.email, email),
      });
      if (existingUser) {
        await db.delete(schema.users).where(eq(schema.users.id, existingUser.id));
        console.log(`  Deleted existing user: ${email}`);
      }
    }

    // Delete seed foods
    await db.delete(schema.foods).where(eq(schema.foods.source, 'seed'));
    console.log('  Deleted existing seed foods');

    // 2. Insert foods
    console.log('\nInserting sample foods...');
    const insertedFoods = await db.insert(schema.foods).values(sampleFoods).returning();
    const foodIds = insertedFoods.map((f) => f.id);
    console.log(`  Inserted ${insertedFoods.length} foods`);

    // 3. Create individual users via API (for proper password hashing)
    console.log('\nCreating individual users...');
    for (const userDef of sampleUserDefs.individuals) {
      const result = await createUserViaApi(userDef.name, userDef.email, userDef.password);

      if (!result) {
        console.log(`  Skipping user: ${userDef.email} (creation failed)`);
        continue;
      }

      const userId = result.id;

      // Update role if needed
      await db
        .update(schema.users)
        .set({ role: userDef.role })
        .where(eq(schema.users.id, userId));

      // Insert nutrition goal
      await db.insert(schema.nutritionGoals).values({
        userId,
        goalType: userDef.goal.goalType,
        targetCalories: userDef.goal.targetCalories,
        targetProtein: userDef.goal.targetProtein,
        targetCarbs: userDef.goal.targetCarbs,
        targetFat: userDef.goal.targetFat,
        targetFiber: userDef.goal.targetFiber,
        targetSodium: userDef.goal.targetSodium,
        activityLevel: userDef.goal.activityLevel,
        startDate: subDays(new Date(), 30),
        isActive: true,
      });

      // Insert custom foods for this user (cascade-deleted on user removal)
      const customFoods = customFoodsByEmail[userDef.email];
      if (customFoods && customFoods.length > 0) {
        await db.insert(schema.foods).values(
          customFoods.map((food) => ({ ...food, userId }))
        );
      }

      // Insert dishes + favorites for weight-loss user
      if (userDef.email === 'user.weight-loss@example.com') {
        await seedDishesAndFavorites(userId, foodIds, db);
      }

      // Generate and insert food logs
      const foodLogs = generateFoodLogs(
        userId,
        foodIds,
        userDef.goal.goalType
      );

      await insertGroupedFoodLogs(userId, foodLogs);

      console.log(`  Created user: ${userDef.name} (${userDef.email})`);
      console.log(`    - Role: ${userDef.role}`);
      console.log(`    - Goal: ${userDef.goal.goalType}`);
      console.log(`    - Custom foods: ${customFoods?.length ?? 0} entries`);
      console.log(`    - Food logs: ${foodLogs.length} entries`);
    }

    // 4. Create professional users via API
    console.log('\nCreating professional users...');
    for (const userDef of sampleUserDefs.professionals) {
      const result = await createUserViaApi(userDef.name, userDef.email, userDef.password);

      if (!result) {
        console.log(`  Skipping user: ${userDef.email} (creation failed)`);
        continue;
      }

      const userId = result.id;

      // Update role to professional
      await db
        .update(schema.users)
        .set({ role: userDef.role })
        .where(eq(schema.users.id, userId));

      console.log(`  Created user: ${userDef.name} (${userDef.email})`);
      console.log(`    - Role: ${userDef.role}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('Database seed completed successfully!');
    console.log('='.repeat(50) + '\n');
    console.log('Test accounts (all passwords: Password123!):');
    console.log('-'.repeat(50));
    console.log('\nIndividual Users:');
    for (const user of sampleUserDefs.individuals) {
      console.log(`  ${user.name}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Goal: ${user.goal.goalType}`);
      console.log('');
    }
    console.log('Professional Users:');
    for (const user of sampleUserDefs.professionals) {
      console.log(`  ${user.name}`);
      console.log(`    Email: ${user.email}`);
      console.log('');
    }
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
