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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/** Fixed locale so SSR matches the client (default locale differs Node vs browser). */
const STAT_NUMBER_LOCALE = 'en-US';
const DATE_SUBTITLE_LOCALE = 'en-US';

function formatStatNumber(n: number): string {
  return n.toLocaleString(STAT_NUMBER_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(n) ? 0 : 1,
  });
}

const TITLE_TAB_TRIGGER = cn(
  'min-h-10 w-full flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold shadow-none',
  'text-muted-foreground hover:text-foreground',
  'data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-sm',
  'sm:min-h-0 sm:w-auto sm:flex-none sm:rounded-none sm:bg-transparent sm:px-0 sm:py-1',
  'sm:text-2xl sm:font-headline sm:font-semibold sm:shadow-none',
  'sm:data-[state=active]:bg-transparent sm:data-[state=active]:font-extrabold',
  'sm:data-[state=active]:text-foreground sm:data-[state=inactive]:text-muted-foreground/55',
);

interface WeeklySummaryTitleTabsProps {
  value: WeeklySummaryPeriod;
  onValueChange: (value: string) => void;
}

/** Period switcher is the card title — not a separate "Weekly Summary" label. */
function WeeklySummaryTitleTabs({
  value,
  onValueChange,
}: WeeklySummaryTitleTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full gap-0">
      <TabsList
        variant="line"
        aria-label="Summary period"
        className={cn(
          'h-auto w-full gap-1 rounded-xl border border-border/70 bg-background/70 p-1',
          'grid grid-cols-2',
          'sm:inline-flex sm:w-auto sm:justify-start sm:gap-10 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0',
        )}
      >
        <TabsTrigger value="calendar_week" className={TITLE_TAB_TRIGGER}>
          This week
        </TabsTrigger>
        <TabsTrigger value="rolling_7d" className={TITLE_TAB_TRIGGER}>
          Last 7 days
        </TabsTrigger>
      </TabsList>
    </Tabs>
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
        <div className="grid h-11 w-full grid-cols-2 gap-1 rounded-xl bg-muted-foreground/10 p-1 sm:inline-flex sm:h-9 sm:w-72 sm:gap-6 sm:bg-transparent sm:p-0">
          <div className="rounded-lg bg-muted-foreground/15 sm:rounded-none" />
          <div className="rounded-lg bg-muted-foreground/5 sm:rounded-none" />
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

  function handlePeriodChange(next: string) {
    if (next === 'calendar_week' || next === 'rolling_7d') {
      setStoredWeeklySummaryPeriod(next);
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col h-full gap-6 transition-opacity',
        showLoading && 'opacity-60',
      )}
    >
      <header className="flex flex-col gap-1.5">
        <h2 className="sr-only">Weekly summary</h2>
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
