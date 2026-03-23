import { getCurrentUser } from '@/lib/session';
import { getWeeklySnapshot } from '@/server/services/dashboard.service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const snapshot = await getWeeklySnapshot(user.id);
    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error('Error fetching weekly snapshot:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch weekly snapshot' }, { status: 500 });
  }
}
