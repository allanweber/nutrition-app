import { type DailySummaryDTO } from '@/server/services/dashboard.service';
import { StatCard } from '@/components/dashboard/shared/stat-card';
import { SectionNudge } from '@/components/dashboard/shared/section-nudge';
import { CircularProgress } from '@/components/dashboard/calories/circular-progress';

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
      {/* Two-tier header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Energy Metabolism
        </p>
        <h2 className="text-2xl font-extrabold font-headline text-foreground">
          Calories
        </h2>
      </div>

      {/* Main content: number + circle */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 flex-1">
        <div className="min-w-0 sm:flex-grow">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-headline font-black tabular-nums leading-none text-primary">
              {caloriesConsumed.toLocaleString()}
            </span>
            <span className="text-base font-semibold text-muted-foreground">
              / {calorieGoal.toLocaleString()} kcal
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            You&apos;ve consumed {percentConsumed}% of your daily target.
          </p>

          {/* Stat cards */}
          <div className="flex gap-4 mt-6">
            <StatCard label="Burned" value={caloriesBurned.toLocaleString()} unit="kcal" />
            <StatCard
              label="Net Balance"
              value={netBalance >= 0 ? `+${netBalance.toLocaleString()}` : netBalance.toLocaleString()}
              unit="kcal"
            />
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-center sm:block">
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
    </div>
  );
}
