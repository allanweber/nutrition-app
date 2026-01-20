import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { nutritionGoals } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';

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

    const { goals } = await request.json();

    if (!goals || typeof goals !== 'object') {
      return NextResponse.json(
        { error: 'Goals object is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sodium'];
    const missingFields = requiredFields.filter(field => 
      goals[field] === undefined || goals[field] === null || goals[field] < 0
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing or invalid fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
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
    const [newGoal] = await db.insert(nutritionGoals).values({
      userId: user.id,
      goalType: goals.goalType || 'maintenance',
      targetCalories: String(goals.calories),
      targetProtein: String(goals.protein),
      targetCarbs: String(goals.carbs),
      targetFat: String(goals.fat),
      targetFiber: String(goals.fiber),
      targetSodium: String(goals.sodium),
      activityLevel: goals.activityLevel || null,
      startDate: new Date(),
      isActive: true,
    }).returning();

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
