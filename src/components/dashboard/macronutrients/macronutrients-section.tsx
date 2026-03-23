import { getCurrentUser } from '@/lib/session';
import { getDailySummary } from '@/server/services/dashboard.service';
import { BentoCell } from '@/components/dashboard/shared/bento-cell';
import { MacronutrientsContent } from '@/components/dashboard/macronutrients/macronutrients-content';

interface MacronutrientsSectionProps {
  date: string;
}

export async function MacronutrientsSection({ date }: MacronutrientsSectionProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const data = await getDailySummary(user.id, date);

  return (
    <BentoCell className="min-h-[240px]">
      <MacronutrientsContent data={data} />
    </BentoCell>
  );
}
