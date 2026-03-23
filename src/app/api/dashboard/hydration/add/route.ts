import { getCurrentUser } from '@/lib/session';
import { addWater } from '@/server/services/dashboard.service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const hydration = await addWater(user.id, today);
    return NextResponse.json({ success: true, hydration });
  } catch (error) {
    console.error('Error adding water:', error);
    return NextResponse.json({ success: false, error: 'Failed to add water' }, { status: 500 });
  }
}
