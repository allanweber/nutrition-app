import { getCurrentUser } from '@/lib/session';
import { getHydrationLog } from '@/server/services/dashboard.service';
import { BentoCell } from '@/components/dashboard/shared/bento-cell';
import { HydrationContent } from '@/components/dashboard/hydration/hydration-content';

interface HydrationSectionProps {
  date: string;
}

export async function HydrationSection({ date }: HydrationSectionProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const data = await getHydrationLog(user.id, date);

  return (
    <BentoCell className="min-h-[280px]">
      <HydrationContent date={date} initialData={data} />
    </BentoCell>
  );
}
