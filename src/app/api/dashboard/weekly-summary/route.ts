import { getCurrentUser } from '@/lib/session';
import type { WeeklySummaryPeriod } from '@/lib/weekly-summary-range';
import { getWeeklySummary } from '@/server/services/dashboard.service';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const periodSchema = z.enum(['calendar_week', 'rolling_7d']);

function parsePeriod(value: string | null): WeeklySummaryPeriod {
  const parsed = periodSchema.safeParse(value ?? 'calendar_week');
  return parsed.success ? parsed.data : 'calendar_week';
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get('period'));
    const summary = await getWeeklySummary(user.id, period);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch weekly summary' },
      { status: 500 },
    );
  }
}
