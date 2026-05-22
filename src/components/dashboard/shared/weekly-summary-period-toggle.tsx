'use client';

import type { WeeklySummaryPeriod } from '@/lib/weekly-summary-range';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export const WEEKLY_SUMMARY_PERIOD_OPTIONS: {
  value: WeeklySummaryPeriod;
  label: string;
  ariaLabel: string;
}[] = [
  {
    value: 'calendar_week',
    label: 'Mon–Sun',
    ariaLabel: 'Calendar week, Monday through Sunday',
  },
  {
    value: 'rolling_7d',
    label: 'Last 7 days',
    ariaLabel: 'Last seven days, rolling window',
  },
];

const itemClassName = cn(
  'min-h-11 flex-1 touch-manipulation px-3 text-xs font-semibold uppercase tracking-wide sm:flex-none sm:min-w-[5.5rem]',
  'data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground',
);

interface WeeklySummaryPeriodToggleProps {
  value: WeeklySummaryPeriod;
  onValueChange: (value: WeeklySummaryPeriod) => void;
  disabled?: boolean;
  className?: string;
}

/** Compact segmented period control for the weekly summary card header. */
export function WeeklySummaryPeriodToggle({
  value,
  onValueChange,
  disabled,
  className,
}: WeeklySummaryPeriodToggleProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      value={value}
      disabled={disabled}
      aria-label="Summary period"
      onValueChange={(next) => {
        if (!next || !isWeeklySummaryPeriodValue(next)) return;
        onValueChange(next);
      }}
      className={cn('w-full shrink-0 sm:w-auto', className)}
    >
      {WEEKLY_SUMMARY_PERIOD_OPTIONS.map(({ value: optionValue, label, ariaLabel }) => (
        <ToggleGroupItem
          key={optionValue}
          value={optionValue}
          aria-label={ariaLabel}
          className={itemClassName}
        >
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function weeklySummaryPeriodLiveLabel(period: WeeklySummaryPeriod): string {
  return period === 'calendar_week' ? 'calendar week (Mon–Sun)' : 'last seven days';
}

function isWeeklySummaryPeriodValue(value: string): value is WeeklySummaryPeriod {
  return WEEKLY_SUMMARY_PERIOD_OPTIONS.some((o) => o.value === value);
}
