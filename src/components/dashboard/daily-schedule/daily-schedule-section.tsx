import { getCurrentUser } from '@/lib/session';
import { getDailySchedule } from '@/server/services/dashboard.service';
import { BentoCell } from '@/components/dashboard/shared/bento-cell';
import { DailyScheduleContent } from '@/components/dashboard/daily-schedule/daily-schedule-content';

interface DailyScheduleSectionProps {
  date: string;
}

export async function DailyScheduleSection({ date }: DailyScheduleSectionProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const schedule = await getDailySchedule(user.id, date);

  return (
    <BentoCell className="min-h-[200px]">
      <DailyScheduleContent
        morning={schedule.morning}
        midday={schedule.midday}
        evening={schedule.evening}
      />
    </BentoCell>
  );
}
