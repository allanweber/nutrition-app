import { getCurrentUser } from '@/lib/session';
import { addWater } from '@/server/services/dashboard.service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const date =
      dateParam && ISO_DATE.test(dateParam)
        ? dateParam
        : new Date().toISOString().split('T')[0];
    const hydration = await addWater(user.id, date);
    return NextResponse.json({ success: true, hydration });
  } catch (error) {
    console.error('Error adding water:', error);
    return NextResponse.json({ success: false, error: 'Failed to add water' }, { status: 500 });
  }
}
