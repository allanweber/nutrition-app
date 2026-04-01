import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { copyDaySchema, validateRequestBody } from '@/lib/api-validation';
import { copyDay } from '@/server/services/diet-plan.service';

type Params = { params: Promise<{ dietPlanId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { dietPlanId } = await params;

    const validation = await validateRequestBody(request, copyDaySchema);
    if (!validation.success) return validation.response;

    const { fromDay, toDay } = validation.data;

    if (fromDay === toDay) {
      return NextResponse.json({ error: 'fromDay and toDay must be different' }, { status: 400 });
    }

    const meals = await copyDay(dietPlanId, fromDay, toDay, user.id);

    return NextResponse.json({ meals });
  } catch (error) {
    console.error('Error copying day:', error);
    if (error instanceof Error && error.message === 'Plan not found') {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to copy day' }, { status: 500 });
  }
}
