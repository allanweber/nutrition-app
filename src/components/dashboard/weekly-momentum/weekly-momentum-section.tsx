import { getCurrentUser } from '@/lib/session';
import { getWeeklySnapshot } from '@/server/services/dashboard.service';
import { BentoCell } from '@/components/dashboard/shared/bento-cell';
import { WeeklyMomentumChart } from '@/components/dashboard/weekly-momentum/weekly-momentum-chart';

export async function WeeklyMomentumSection() {
  const user = await getCurrentUser();
  if (!user) return null;

  const snapshot = await getWeeklySnapshot(user.id);

  return (
    <BentoCell className="min-h-[240px]">
      <WeeklyMomentumChart days={snapshot.days} />
    </BentoCell>
  );
}
