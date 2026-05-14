import { type DailySummaryDTO } from '@/server/services/dashboard.service';
import { MACRO_COLORS } from '@/lib/nutrition-constants';
import { ProgressBar } from '@/components/dashboard/shared/progress-bar';
import { SectionNudge } from '@/components/dashboard/shared/section-nudge';

interface MacronutrientsContentProps {
  data: DailySummaryDTO;
}

export function MacronutrientsContent({ data }: MacronutrientsContentProps) {
  const { protein, carbs, fat, hasGoal } = data;

  return (
    <div className="flex flex-col h-full gap-6">
      <h2 className="text-2xl font-extrabold font-headline text-foreground">
        Daily Macros
      </h2>

      <div className="flex flex-col gap-5 flex-1">
        <ProgressBar
          label="Protein"
          value={protein.consumed}
          goal={protein.goal}
          unit="g"
          color={MACRO_COLORS.protein}
        />
        <ProgressBar
          label="Carbohydrates"
          value={carbs.consumed}
          goal={carbs.goal}
          unit="g"
          color={MACRO_COLORS.carbs}
        />
        <ProgressBar
          label="Fat"
          value={fat.consumed}
          goal={fat.goal}
          unit="g"
          color={MACRO_COLORS.fat}
        />
      </div>

      {!hasGoal && (
        <div className="mt-auto">
          <SectionNudge message="Set your macro goals" />
        </div>
      )}
    </div>
  );
}
