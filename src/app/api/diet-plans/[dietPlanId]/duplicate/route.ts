import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { duplicateDietPlan } from '@/server/services/diet-plan.service';

type Params = { params: Promise<{ dietPlanId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { dietPlanId } = await params;

    const plan = await duplicateDietPlan(dietPlanId, user.id);
    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Error duplicating diet plan:', error);
    if (error instanceof Error && error.message === 'Plan not found') {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to duplicate diet plan' }, { status: 500 });
  }
}
