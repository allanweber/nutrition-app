import { getCurrentUser } from '@/lib/session';
import { getHydrationLog } from '@/server/services/dashboard.service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
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
    const hydration = await getHydrationLog(user.id, date);
    return NextResponse.json({ hydration });
  } catch (error) {
    console.error('Error fetching hydration log:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch hydration log' }, { status: 500 });
  }
}
