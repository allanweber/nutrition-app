import { type DailySummaryDTO } from '@/server/services/dashboard.service';
import { SectionNudge } from '@/components/dashboard/shared/section-nudge';
import { CircularProgress } from '@/components/dashboard/calories/circular-progress';
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
    percentConsumed,
    remaining,
    hasGoal,
  } = data;

  return (
    <div className="flex flex-col h-full gap-6">
      <h2 className="text-2xl font-extrabold font-headline text-foreground">
        Calories
      </h2>

      {/* Main content: number + circle always side by side */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-headline font-black tabular-nums leading-none text-primary">
              {caloriesConsumed.toLocaleString()}
            </span>
            <span className="text-base font-semibold text-muted-foreground">
              / {calorieGoal.toLocaleString()} kcal
            </span>
          </div>

          {/* Secondary stats */}
          <div className="flex gap-8 mt-4">
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
        </div>

        <div className="flex-shrink-0">
          <CircularProgress
            percentage={percentConsumed}
            label="Remaining"
            value={remaining.toLocaleString()}
            size={120}
          />
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
