'use client';

import { type WeeklySummaryDTO } from '@/server/services/dashboard.service';
import { MACRO_COLORS } from '@/lib/nutrition-constants';
import { cn } from '@/lib/utils';

/** Fixed locale so SSR matches the client (default locale differs Node vs browser). */
const STAT_NUMBER_LOCALE = 'en-US';

function formatStatNumber(n: number): string {
  return n.toLocaleString(STAT_NUMBER_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(n) ? 0 : 1,
  });
}

interface WeeklySummaryContentProps {
  data: WeeklySummaryDTO;
}

interface StatCellProps {
  label: string;
  consumed: number;
  goal: number;
  unit: string;
  colorClass: string;
}

function StatCell({ label, consumed, goal, unit, colorClass }: StatCellProps) {
  const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-extrabold font-headline tabular-nums text-foreground leading-none">
          {formatStatNumber(consumed)}
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          / {formatStatNumber(goal)} {unit}
        </span>
      </div>
      {/* mini progress bar */}
      <div className="h-1.5 rounded-full bg-muted-foreground/10 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function WeeklySummaryContent({ data }: WeeklySummaryContentProps) {
  const { calories, protein, carbs, fat } = data;

  return (
    <div className="flex flex-col h-full gap-6">
      <h2 className="text-2xl font-extrabold font-headline text-foreground">
        Weekly Summary
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 flex-1">
        <StatCell
          label="Calories"
          consumed={calories.consumed}
          goal={calories.goal}
          unit="kcal"
          colorClass="bg-primary"
        />
        <StatCell
          label="Protein"
          consumed={protein.consumed}
          goal={protein.goal}
          unit="g"
          colorClass={MACRO_COLORS.protein}
        />
        <StatCell
          label="Carbohydrates"
          consumed={carbs.consumed}
          goal={carbs.goal}
          unit="g"
          colorClass={MACRO_COLORS.carbs}
        />
        <StatCell
          label="Fat"
          consumed={fat.consumed}
          goal={fat.goal}
          unit="g"
          colorClass={MACRO_COLORS.fat}
        />
      </div>
    </div>
  );
}
