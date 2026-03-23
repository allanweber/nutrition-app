import { getCurrentUser } from '@/lib/session';
import { getDailySchedule } from '@/server/services/dashboard.service';
import { dateSchema, validateApiInput } from '@/lib/api-validation';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date') ?? new Date().toISOString().split('T')[0];

    const dateValidation = validateApiInput(dateSchema, dateParam, 'date');
    if (!dateValidation.success) {
      return NextResponse.json({ success: false, error: dateValidation.error }, { status: 400 });
    }

    const schedule = await getDailySchedule(user.id, dateValidation.data);
    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error fetching daily schedule:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch daily schedule' }, { status: 500 });
  }
}
