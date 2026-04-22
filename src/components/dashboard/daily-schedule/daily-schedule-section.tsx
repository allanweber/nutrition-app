import { getCurrentUser } from '@/lib/session';
import { getDailySchedule } from '@/server/services/dashboard.service';
import { DailyScheduleContent } from '@/components/dashboard/daily-schedule/daily-schedule-content';

interface DailyScheduleSectionProps {
  date: string;
}

export async function DailyScheduleSection({ date }: DailyScheduleSectionProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const schedule = await getDailySchedule(user.id, date);

  return (
    <DailyScheduleContent
      morning={schedule.morning}
      midday={schedule.midday}
      evening={schedule.evening}
    />
  );
}
