import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/session';
import {
  parseWeeklySummaryPeriod,
  WEEKLY_SUMMARY_PERIOD_COOKIE,
} from '@/lib/weekly-summary-period';
import { getWeeklySummary } from '@/server/services/dashboard.service';
import { BentoCell } from '@/components/dashboard/shared/bento-cell';
import { WeeklySummaryContent } from '@/components/dashboard/weekly-summary/weekly-summary-content';

export async function WeeklySummarySection() {
  const user = await getCurrentUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const period = parseWeeklySummaryPeriod(
    cookieStore.get(WEEKLY_SUMMARY_PERIOD_COOKIE)?.value,
  );
  const data = await getWeeklySummary(user.id, period);

  return (
    <BentoCell className="min-h-60">
      <WeeklySummaryContent initialData={data} initialPeriod={period} />
    </BentoCell>
  );
}
