import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { nutritionGoals, insertNutritionGoalSchema } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';
import { validateApiInput, createValidationErrorResponse, nutritionGoalsSchema, transformNutritionGoalsForDB } from '@/lib/api-validation';

// Get user's nutrition goals
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Default goals if not set
    const defaultGoals = {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65,
      fiber: 25,
      sodium: 2300,
    };

    // Get the most recent active goal for the user
    const activeGoal = await db.query.nutritionGoals.findFirst({
      where: and(
        eq(nutritionGoals.userId, user.id),
        eq(nutritionGoals.isActive, true)
      ),
      orderBy: desc(nutritionGoals.createdAt),
    });

    if (!activeGoal) {
      return NextResponse.json({ goals: defaultGoals });
    }

    const goals = {
      calories: activeGoal.targetCalories ? Number(activeGoal.targetCalories) : defaultGoals.calories,
      protein: activeGoal.targetProtein ? Number(activeGoal.targetProtein) : defaultGoals.protein,
      carbs: activeGoal.targetCarbs ? Number(activeGoal.targetCarbs) : defaultGoals.carbs,
      fat: activeGoal.targetFat ? Number(activeGoal.targetFat) : defaultGoals.fat,
      fiber: activeGoal.targetFiber ? Number(activeGoal.targetFiber) : defaultGoals.fiber,
      sodium: activeGoal.targetSodium ? Number(activeGoal.targetSodium) : defaultGoals.sodium,
      goalType: activeGoal.goalType,
      activityLevel: activeGoal.activityLevel,
    };

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Goals GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// Update user's nutrition goals
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const goals = body.goals;

    if (!goals || typeof goals !== 'object') {
      return NextResponse.json(
        { error: 'Goals object is required' },
        { status: 400 }
      );
    }

    // Validate the goals object (API input validation)
    const apiValidation = validateApiInput(nutritionGoalsSchema, goals, 'goals');
    if (!apiValidation.success) {
      return createValidationErrorResponse(apiValidation.error, apiValidation.field);
    }

    // Transform API format to database format
    const dbData = transformNutritionGoalsForDB(apiValidation.data, user.id);

    // Validate with database schema (ensures data integrity)
    const dbValidation = validateApiInput(insertNutritionGoalSchema, dbData, 'goals');
    if (!dbValidation.success) {
      console.error('Database schema validation failed:', dbValidation);
      return NextResponse.json({ error: 'Invalid goal data' }, { status: 400 });
    }

    // Deactivate existing active goals
    await db
      .update(nutritionGoals)
      .set({ isActive: false })
      .where(and(
        eq(nutritionGoals.userId, user.id),
        eq(nutritionGoals.isActive, true)
      ));

    // Create new goal record
    const [newGoal] = await db.insert(nutritionGoals).values(dbValidation.data).returning();

    return NextResponse.json({ 
      success: true, 
      goals: {
        calories: Number(newGoal.targetCalories),
        protein: Number(newGoal.targetProtein),
        carbs: Number(newGoal.targetCarbs),
        fat: Number(newGoal.targetFat),
        fiber: Number(newGoal.targetFiber),
        sodium: Number(newGoal.targetSodium),
        goalType: newGoal.goalType,
        activityLevel: newGoal.activityLevel,
      }
    });
  } catch (error) {
    console.error('Goals PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update goals' },
      { status: 500 }
    );
  }
}
