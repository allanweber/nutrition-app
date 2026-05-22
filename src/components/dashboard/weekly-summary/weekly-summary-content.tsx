'use client';

import { useSyncExternalStore } from 'react';
import { MacroFillTrack } from '@/components/macro-fill-track';
import {
  WeeklySummaryPeriodToggle,
  weeklySummaryPeriodLiveLabel,
} from '@/components/dashboard/shared/weekly-summary-period-toggle';
import { Button } from '@/components/ui/button';
import { type WeeklySummaryDTO } from '@/server/services/dashboard.service';
import type { WeeklySummaryPeriod } from '@/lib/weekly-summary-range';
import {
  getWeeklySummaryPeriodSnapshot,
  setStoredWeeklySummaryPeriod,
  setWeeklySummaryPeriodSsrHint,
  subscribeWeeklySummaryPeriod,
} from '@/lib/weekly-summary-period';
import { useWeeklySummaryQuery } from '@/queries/weekly-summary';
import { MACRO_COLORS } from '@/lib/nutrition-constants';
import { cn } from '@/lib/utils';

const HEADING_ID = 'weekly-summary-heading';

/** Fixed locale so SSR matches the client (default locale differs Node vs browser). */
const STAT_NUMBER_LOCALE = 'en-US';
const DATE_SUBTITLE_LOCALE = 'en-US';

function formatStatNumber(n: number): string {
  return n.toLocaleString(STAT_NUMBER_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(n) ? 0 : 1,
  });
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

function periodFetchErrorMessage(period: WeeklySummaryPeriod): string {
  return period === 'rolling_7d'
    ? "Couldn't load totals for the last 7 days."
    : "Couldn't load totals for this calendar week.";
}

function formatSummaryLiveMessage(
  summary: WeeklySummaryDTO,
  period: WeeklySummaryPeriod,
  isRefreshing: boolean,
): string {
  const range = formatPeriodSubtitle(summary.periodStart, summary.periodEnd);
  if (isRefreshing) {
    return `Updating ${weeklySummaryPeriodLiveLabel(period)}, ${range}`;
  }
  const { calories, protein, carbs, fat } = summary;
  return [
    `${weeklySummaryPeriodLiveLabel(period)}, ${range}.`,
    `Calories ${formatStatNumber(calories.consumed)} of ${formatStatNumber(calories.goal)} kilocalories.`,
    `Protein ${formatStatNumber(protein.consumed)} of ${formatStatNumber(protein.goal)} grams.`,
    `Carbohydrates ${formatStatNumber(carbs.consumed)} of ${formatStatNumber(carbs.goal)} grams.`,
    `Fat ${formatStatNumber(fat.consumed)} of ${formatStatNumber(fat.goal)} grams.`,
  ].join(' ');
}

interface WeeklySummaryContentProps {
  initialData: WeeklySummaryDTO;
  initialPeriod: WeeklySummaryPeriod;
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
      <MacroFillTrack
        percent={pct}
        fillClassName={colorClass}
        trackClassName="bg-muted-foreground/10"
        heightClassName="h-1.5"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} progress`}
      />
    </div>
  );
}

function WeeklySummaryHeader({
  period,
  dateSubtitle,
  onPeriodChange,
}: {
  period: WeeklySummaryPeriod;
  dateSubtitle: string;
  onPeriodChange: (value: WeeklySummaryPeriod) => void;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex flex-col gap-1">
        <h2
          id={HEADING_ID}
          className="text-2xl font-extrabold font-headline text-foreground"
        >
          Weekly summary
        </h2>
        <p className="text-xs font-medium text-muted-foreground tabular-nums">
          {dateSubtitle || '\u00a0'}
        </p>
      </div>
      <WeeklySummaryPeriodToggle
        value={period}
        onValueChange={onPeriodChange}
        className="sm:pt-0.5"
      />
    </header>
  );
}

function WeeklySummaryStatsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 flex-1"
      aria-hidden
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="h-3 w-16 rounded bg-muted-foreground/10" />
          <div className="h-7 w-32 rounded bg-muted-foreground/10" />
          <div className="h-1.5 rounded-full bg-muted-foreground/10" />
        </div>
      ))}
    </div>
  );
}

export function WeeklySummaryContent({
  initialData,
  initialPeriod,
}: WeeklySummaryContentProps) {
  setWeeklySummaryPeriodSsrHint(initialPeriod);

  const period = useSyncExternalStore(
    subscribeWeeklySummaryPeriod,
    getWeeklySummaryPeriodSnapshot,
    () => initialPeriod,
  );

  const { data, isFetching, isPending, isError, error, refetch } =
    useWeeklySummaryQuery(period, initialPeriod, initialData);

  const fetchedForPeriod = data?.period === period ? data : undefined;

  const summary =
    fetchedForPeriod ??
    (isError
      ? period === initialPeriod
        ? initialData
        : undefined
      : period === initialPeriod && !isFetching
        ? initialData
        : undefined);

  const isLoading = !summary;
  const isRefreshing = Boolean(
    fetchedForPeriod && isFetching && !isPending,
  );
  const showingSavedData = Boolean(
    isError && summary && !fetchedForPeriod,
  );

  const dateRange = summary
    ? formatPeriodSubtitle(summary.periodStart, summary.periodEnd)
    : '';

  function handlePeriodChange(next: WeeklySummaryPeriod) {
    setStoredWeeklySummaryPeriod(next);
  }

  if (isLoading) {
    return (
      <div
        className="flex flex-col h-full gap-6"
        aria-busy="true"
        aria-labelledby={HEADING_ID}
        data-testid="weekly-summary"
      >
        <WeeklySummaryHeader
          period={period}
          dateSubtitle={dateRange}
          onPeriodChange={handlePeriodChange}
        />
        <WeeklySummaryStatsSkeleton />
      </div>
    );
  }

  const { calories, protein, carbs, fat, periodStart, periodEnd } = summary;
  const headerDateRange = formatPeriodSubtitle(periodStart, periodEnd);

  return (
    <div
      className="flex flex-col h-full gap-6"
      aria-labelledby={HEADING_ID}
      data-testid="weekly-summary"
    >
      <WeeklySummaryHeader
        period={period}
        dateSubtitle={headerDateRange}
        onPeriodChange={handlePeriodChange}
      />

      {isError && (
        <div className="flex flex-col gap-1 -mt-2">
          <div
            className="flex flex-wrap items-center gap-2 text-sm text-destructive"
            role="alert"
          >
            <span>
              {error instanceof Error &&
              error.message !== 'Failed to fetch weekly summary'
                ? error.message
                : periodFetchErrorMessage(period)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 min-w-11 px-3"
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </div>
          {showingSavedData && (
            <p className="text-xs text-muted-foreground">
              Showing saved totals from your last successful load.
            </p>
          )}
        </div>
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {formatSummaryLiveMessage(summary, period, isRefreshing)}
      </p>

      <section
        className={cn(
          'relative flex flex-1 flex-col',
          (isRefreshing || showingSavedData) && 'opacity-60',
        )}
        aria-busy={isRefreshing}
        aria-label="Weekly macro totals"
      >
        {isRefreshing && (
          <div
            role="progressbar"
            aria-valuetext="Updating weekly macro totals"
            className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden rounded-full bg-border"
          >
            <div className="h-full w-2/5 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
          </div>
        )}
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
      </section>
    </div>
  );
}
