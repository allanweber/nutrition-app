import { type DailySummaryDTO } from '@/server/services/dashboard.service';
import { SectionNudge } from '@/components/dashboard/shared/section-nudge';
import { CalorieStatusBar } from '@/components/dashboard/calories/calorie-status-bar';
import { LogFoodButton } from '@/components/dashboard/calories/log-food-button';

interface CaloriesContentProps {
  data: DailySummaryDTO;
}

export function CaloriesContent({ data }: CaloriesContentProps) {
  const {
    caloriesConsumed,
    calorieGoal,
    caloriesBurned,
    netBalance,
    remaining,
    hasGoal,
  } = data;

  return (
    <div className="flex flex-col h-full gap-6">
      <CalorieStatusBar
        caloriesConsumed={caloriesConsumed}
        calorieGoal={calorieGoal}
        remaining={remaining}
      />

      {/* Secondary stats */}
      <div className="flex flex-wrap gap-8">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Burned</span>
          <span className="text-xl font-headline font-black tabular-nums text-foreground">
            {caloriesBurned.toLocaleString()}
            <span className="text-sm font-semibold text-muted-foreground ml-0.5">kcal</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Net Balance</span>
          <span className="text-xl font-headline font-black tabular-nums text-foreground">
            {netBalance >= 0 ? `+${netBalance.toLocaleString()}` : netBalance.toLocaleString()}
            <span className="text-sm font-semibold text-muted-foreground ml-0.5">kcal</span>
          </span>
        </div>
      </div>

      {/* Nudge */}
      {!hasGoal && (
        <div className="mt-auto">
          <SectionNudge message="Set your calorie goal" />
        </div>
      )}

      {/* Log Food */}
      <div className="flex justify-center mt-auto">
        <LogFoodButton />
      </div>
    </div>
  );
}
