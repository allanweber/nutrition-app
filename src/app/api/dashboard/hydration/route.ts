import { getCurrentUser } from '@/lib/session';
import { getHydrationLog } from '@/server/services/dashboard.service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const hydration = await getHydrationLog(user.id, today);
    return NextResponse.json({ hydration });
  } catch (error) {
    console.error('Error fetching hydration log:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch hydration log' }, { status: 500 });
  }
}
