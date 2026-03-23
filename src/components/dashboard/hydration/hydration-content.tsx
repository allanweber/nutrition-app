import { type HydrationLogDTO } from '@/server/services/dashboard.service';
import { AddWaterButton } from '@/components/dashboard/hydration/add-water-button';
import { SectionNudge } from '@/components/dashboard/shared/section-nudge';

interface HydrationContentProps {
  data: HydrationLogDTO;
}

export function HydrationContent({ data }: HydrationContentProps) {
  const { totalMl, goalMl, percentConsumed, hasGoal } = data;

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Two-tier header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
          Hydration
        </p>
        <h2 className="text-2xl font-extrabold font-headline text-foreground">
          Water
        </h2>
      </div>

      {/* Main value */}
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-headline font-black tabular-nums text-blue-600 leading-none">
          {totalMl}
        </span>
        <span className="text-base font-bold text-on-surface-variant">ml</span>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          <span>Progress</span>
          <span>{totalMl} / {goalMl} ml</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.round(percentConsumed)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Water intake"
          className="h-3 w-full rounded-full bg-surface-container overflow-hidden"
        >
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(percentConsumed, 100)}%` }}
          />
        </div>
      </div>

      {!hasGoal && (
        <SectionNudge message="Set your hydration goal" />
      )}

      <div className="mt-auto flex justify-center">
        <AddWaterButton />
      </div>
    </div>
  );
}
