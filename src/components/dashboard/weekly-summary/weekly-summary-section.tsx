import { getCurrentUser } from '@/lib/session';
import { getWeeklySummary } from '@/server/services/dashboard.service';
import { BentoCell } from '@/components/dashboard/shared/bento-cell';
import { WeeklySummaryContent } from '@/components/dashboard/weekly-summary/weekly-summary-content';

export async function WeeklySummarySection() {
  const user = await getCurrentUser();
  if (!user) return null;

  const data = await getWeeklySummary(user.id);

  return (
    <BentoCell className="min-h-60">
      <WeeklySummaryContent data={data} />
    </BentoCell>
  );
}
