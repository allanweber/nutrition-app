import { getCurrentUser } from '@/lib/session';
import { getDailySummary } from '@/server/services/dashboard.service';
import { BentoCell } from '@/components/dashboard/shared/bento-cell';
import { CaloriesContent } from '@/components/dashboard/calories/calories-content';

interface CaloriesSectionProps {
  date: string;
}

export async function CaloriesSection({ date }: CaloriesSectionProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const data = await getDailySummary(user.id, date);

  return (
    <BentoCell className="min-h-[280px] bg-card">
      <CaloriesContent data={data} />
    </BentoCell>
  );
}
