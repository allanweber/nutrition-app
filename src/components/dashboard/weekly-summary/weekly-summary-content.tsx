'use client';

import { useSyncExternalStore } from 'react';
import { type WeeklySummaryDTO } from '@/server/services/dashboard.service';
import type { WeeklySummaryPeriod } from '@/lib/weekly-summary-range';
import {
  getWeeklySummaryPeriodSnapshot,
  setStoredWeeklySummaryPeriod,
  subscribeWeeklySummaryPeriod,
} from '@/lib/weekly-summary-period';
import { useWeeklySummaryQuery } from '@/queries/weekly-summary';
import { MACRO_COLORS } from '@/lib/nutrition-constants';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS: { value: WeeklySummaryPeriod; label: string }[] = [
  { value: 'calendar_week', label: 'This week' },
  { value: 'rolling_7d', label: 'Last 7 days' },
];

/** Fixed locale so SSR matches the client (default locale differs Node vs browser). */
const STAT_NUMBER_LOCALE = 'en-US';
const DATE_SUBTITLE_LOCALE = 'en-US';

function formatStatNumber(n: number): string {
  return n.toLocaleString(STAT_NUMBER_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(n) ? 0 : 1,
  });
}

interface WeeklySummaryTitleTabsProps {
  value: WeeklySummaryPeriod;
  onValueChange: (value: WeeklySummaryPeriod) => void;
}

/** Period switcher is the card title. */
function WeeklySummaryTitleTabs({
  value,
  onValueChange,
}: WeeklySummaryTitleTabsProps) {
  return (
    <h2
      role="tablist"
      aria-label="Summary period"
      className="font-headline leading-none"
    >
      <div
        className={cn(
          'flex w-full gap-0.5 rounded-lg bg-background/90 p-0.5',
          'sm:inline-flex sm:w-auto sm:gap-8 sm:rounded-none sm:bg-transparent sm:p-0',
        )}
      >
        {PERIOD_OPTIONS.map(({ value: optionValue, label }) => {
          const isActive = value === optionValue;
          return (
            <button
              key={optionValue}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onValueChange(optionValue)}
              className={cn(
                'flex-1 rounded-md px-3 py-2.5 text-base font-semibold transition-colors',
                'min-h-11 touch-manipulation sm:min-h-0 sm:flex-none sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 sm:text-2xl',
                isActive
                  ? 'bg-card text-foreground shadow-sm font-extrabold sm:bg-transparent sm:shadow-none'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </h2>
  );
}

function formatPeriodSubtitle(periodStart: string, periodEnd: string): string {
  const start = new Date(`${periodStart}T12:00:00.000Z`);
  const end = new Date(`${periodEnd}T12:00:00.000Z`);
  const fmt = new Intl.DateTimeFormat(DATE_SUBTITLE_LOCALE, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  if (periodStart === periodEnd) return fmt.format(start);
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

interface WeeklySummaryContentProps {
  initialData: WeeklySummaryDTO;
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
      <div className="h-1.5 rounded-full bg-muted-foreground/10 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function WeeklySummaryContent({ initialData }: WeeklySummaryContentProps) {
  const period = useSyncExternalStore(
    subscribeWeeklySummaryPeriod,
    getWeeklySummaryPeriodSnapshot,
    () => 'calendar_week' as WeeklySummaryPeriod,
  );

  const { data, isFetching, isPending } = useWeeklySummaryQuery(
    period,
    initialData,
  );

  const summary =
    data ?? (period === 'calendar_week' ? initialData : undefined);
  const showLoading = !summary || (isFetching && !isPending);

  if (!summary) {
    return (
      <div className="flex flex-col h-full gap-6 animate-pulse">
        <div className="flex h-11 w-full gap-0.5 rounded-lg bg-muted-foreground/10 p-0.5 sm:h-8 sm:w-64 sm:bg-transparent sm:p-0">
          <div className="flex-1 rounded-md bg-muted-foreground/15" />
          <div className="flex-1 rounded-md bg-muted-foreground/5" />
        </div>
        <div className="h-3 w-32 rounded bg-muted-foreground/10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-3 w-16 rounded bg-muted-foreground/10" />
              <div className="h-7 w-32 rounded bg-muted-foreground/10" />
              <div className="h-1.5 rounded-full bg-muted-foreground/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { calories, protein, carbs, fat, periodStart, periodEnd } = summary;

  function handlePeriodChange(next: WeeklySummaryPeriod) {
    setStoredWeeklySummaryPeriod(next);
  }

  return (
    <div
      className={cn(
        'flex flex-col h-full gap-6 transition-opacity',
        showLoading && 'opacity-60',
      )}
    >
      <header className="flex flex-col gap-2.5">
        <WeeklySummaryTitleTabs
          value={period}
          onValueChange={handlePeriodChange}
        />
        <p className="text-xs font-medium text-muted-foreground tabular-nums">
          {formatPeriodSubtitle(periodStart, periodEnd)}
        </p>
      </header>

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
