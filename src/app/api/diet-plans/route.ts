import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { dietPlans } from '@/server/db/schema';
import {
  createDietPlanSchema,
  validateRequestBody,
} from '@/lib/api-validation';
import {
  archiveActivePlans,
  getDietPlansForUser,
  getUserNutritionGoalDefaults,
  toNumber,
} from '@/server/services/diet-plan.service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const [plans, nutritionGoalDefaults] = await Promise.all([
      getDietPlansForUser(user.id),
      getUserNutritionGoalDefaults(user.id),
    ]);

    return NextResponse.json({ plans, nutritionGoalDefaults });
  } catch (error) {
    console.error('Error fetching diet plans:', error);
    return NextResponse.json({ error: 'Failed to fetch diet plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const validation = await validateRequestBody(request, createDietPlanSchema);
    if (!validation.success) return validation.response;

    const { name, description, targetCalories, targetProtein, targetCarbs, targetFat, startDate, endDate, status } =
      validation.data;

    if (status === 'active') {
      await archiveActivePlans(user.id);
    }

    const [plan] = await db
      .insert(dietPlans)
      .values({
        clientId: user.id,
        name,
        description: description ?? null,
        targetCalories: targetCalories.toString(),
        targetProtein: targetProtein.toString(),
        targetCarbs: targetCarbs.toString(),
        targetFat: targetFat.toString(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status,
      })
      .returning();

    return NextResponse.json({
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        status: plan.status,
        targetCalories: toNumber(plan.targetCalories),
        targetProtein: toNumber(plan.targetProtein),
        targetCarbs: toNumber(plan.targetCarbs),
        targetFat: toNumber(plan.targetFat),
        startDate: plan.startDate.toISOString(),
        endDate: plan.endDate ? plan.endDate.toISOString() : null,
        avgDailyCalories: 0,
        completeness: 0,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating diet plan:', error);
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json({ error: 'An active plan already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create diet plan' }, { status: 500 });
  }
}
