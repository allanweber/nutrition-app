'use client';

import { type HydrationLogDTO } from '@/server/services/dashboard.service';
import { AddWaterButton } from '@/components/dashboard/hydration/add-water-button';
import { SectionNudge } from '@/components/dashboard/shared/section-nudge';
import { useAddWaterMutation, useHydrationLogQuery } from '@/queries/hydration';

interface HydrationContentProps {
  date: string;
  initialData: HydrationLogDTO;
}

export function HydrationContent({ date, initialData }: HydrationContentProps) {
  const { data } = useHydrationLogQuery(date, initialData);
  const addWater = useAddWaterMutation(date);

  const { totalMl, goalMl, percentConsumed, hasGoal } = data ?? initialData;

  return (
    <div className="flex flex-col h-full gap-6">
      <h2 className="text-2xl font-extrabold font-headline text-foreground">
        Water
      </h2>

      {/* Main value */}
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-headline font-black tabular-nums text-primary leading-none">
          {totalMl}
        </span>
        <span className="text-base font-bold text-muted-foreground">ml</span>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-end text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <span>Goal: {goalMl} ml</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.round(percentConsumed)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Water intake"
          className="h-3 w-full rounded-full bg-secondary overflow-hidden"
        >
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.min(percentConsumed, 100)}%` }}
          />
        </div>
      </div>

      {!hasGoal && (
        <SectionNudge message="Set your hydration goal" />
      )}

      <div className="mt-auto flex justify-center">
        <AddWaterButton
          onClick={() => addWater.mutate()}
          isBusy={addWater.isPending}
        />
      </div>
    </div>
  );
}
