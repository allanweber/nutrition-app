import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { copyMealSchema, validateRequestBody } from '@/lib/api-validation';
import { copyMeal } from '@/server/services/diet-plan.service';

type Params = { params: Promise<{ dietPlanId: string; mealId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { dietPlanId, mealId } = await params;

    const validation = await validateRequestBody(request, copyMealSchema);
    if (!validation.success) return validation.response;

    const { toMealType } = validation.data;

    const meals = await copyMeal(dietPlanId, mealId, toMealType, user.id);

    return NextResponse.json({ meals });
  } catch (error) {
    console.error('Error copying meal:', error);
    if (error instanceof Error && error.message === 'Plan not found') {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'Meal not found') {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to copy meal' }, { status: 500 });
  }
}
