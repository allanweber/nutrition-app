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
import { eq } from 'drizzle-orm';
import * as schema from './schema';
import { parseISO, subDays, startOfDay, setHours } from 'date-fns';

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
  foodIds: number[],
  variant: GoalVariant
) {
  const logs: Array<{
    userId: string;
    foodId: number;
    quantity: string;
    servingUnit: string | null;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    consumedAt: Date;
  }> = [];

  const today = startOfDay(new Date());
  // The food log UI and API default date use `new Date().toISOString().split('T')[0]`.
  // That date string is UTC-derived but then parsed as a local date in the API.
  // To keep E2E stable across timezones (and avoid random skips), always seed
  // deterministic logs for both the local "today" and the API-default day.
  const apiDefaultDay = startOfDay(
    parseISO(new Date().toISOString().split('T')[0]),
  );

  function addDeterministicLogsForDate(date: Date) {
    const picks = [
      {
        mealType: 'breakfast' as const,
        foodIndex: pattern.breakfast[0],
        hour: 8,
      },
      {
        mealType: 'lunch' as const,
        foodIndex: pattern.lunch[0],
        hour: 12,
      },
      {
        mealType: 'dinner' as const,
        foodIndex: pattern.dinner[0],
        hour: 18,
      },
    ];

    for (const pick of picks) {
      const foodId = foodIds[pick.foodIndex];
      if (!foodId) continue;
      logs.push({
        userId,
        foodId,
        quantity: '1',
        servingUnit: null,
        mealType: pick.mealType,
        consumedAt: setHours(date, pick.hour),
      });
    }
  }

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
    if (dayOffset !== 0 && Math.random() < 0.1) continue;

    // Breakfast (7-9 AM)
    const breakfastHour = 7 + Math.floor(Math.random() * 2);
    pattern.breakfast.forEach((foodIndex, i) => {
      if (foodIds[foodIndex] && Math.random() > 0.15) {
        logs.push({
          userId,
          foodId: foodIds[foodIndex],
          quantity: '1',
          servingUnit: null,
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
          quantity: '1',
          servingUnit: null,
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
          quantity: '1',
          servingUnit: null,
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
          quantity: '1',
          servingUnit: null,
          mealType: 'snack',
          consumedAt: setHours(date, snackHour),
        });
      }
    }
  }

  // Ensure E2E always has visible data for "Today".
  addDeterministicLogsForDate(today);
  if (apiDefaultDay.getTime() !== today.getTime()) {
    addDeterministicLogsForDate(apiDefaultDay);
  }

  return logs;
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
        .set({ role: userDef.role, emailVerified: true })
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

      // Generate and insert food logs
      const foodLogs = generateFoodLogs(
        userId,
        foodIds,
        userDef.goal.goalType
      );

      if (foodLogs.length > 0) {
        await db.insert(schema.foodLogs).values(foodLogs);
      }

      console.log(`  Created user: ${userDef.name} (${userDef.email})`);
      console.log(`    - Role: ${userDef.role}`);
      console.log(`    - Goal: ${userDef.goal.goalType}`);
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
        .set({ role: userDef.role, emailVerified: true })
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
