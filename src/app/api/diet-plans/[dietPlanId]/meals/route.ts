import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { dietPlanMeals, dietPlans } from '@/server/db/schema';
import { createDietPlanMealSchema, validateRequestBody } from '@/lib/api-validation';
import { getMealsForPlan } from '@/server/services/diet-plan.service';

type Params = { params: Promise<{ dietPlanId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { dietPlanId } = await params;

    const meals = await getMealsForPlan(dietPlanId, user.id);
    return NextResponse.json({ meals });
  } catch (error) {
    console.error('Error fetching meals:', error);
    return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { dietPlanId } = await params;

    const plan = await db.query.dietPlans.findFirst({
      where: and(eq(dietPlans.id, dietPlanId), eq(dietPlans.clientId, user.id)),
    });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const validation = await validateRequestBody(request, createDietPlanMealSchema);
    if (!validation.success) return validation.response;

    const { mealType, dayOfWeek } = validation.data;

    const [meal] = await db
      .insert(dietPlanMeals)
      .values({ dietPlanId, mealType, dayOfWeek })
      .returning();

    return NextResponse.json(
      {
        meal: {
          id: meal.id,
          dietPlanId: meal.dietPlanId,
          mealType: meal.mealType,
          dayOfWeek: meal.dayOfWeek,
          items: [],
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating meal:', error);
    return NextResponse.json({ error: 'Failed to create meal' }, { status: 500 });
  }
}
