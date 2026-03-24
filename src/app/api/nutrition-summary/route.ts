import { getCurrentUser } from '@/lib/session';
import { getDailySummary } from '@/server/services/dashboard.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0];

    const summary = await getDailySummary(user.id, date);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching nutrition summary:', error);
    return NextResponse.json({ error: 'Failed to fetch nutrition summary' }, { status: 500 });
  }
}
