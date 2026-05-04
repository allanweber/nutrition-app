'use client';

import { format, parseISO } from 'date-fns';
import { CircleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlanBannerDismissed } from '@/hooks/use-plan-banner-dismissed';

interface MealPlanBannerProps {
  planName: string;
  dateStr: string;
  onLogAll: () => void;
}

export function MealPlanBanner({ planName, dateStr, onLogAll }: MealPlanBannerProps) {
  const { isDismissed, dismiss } = usePlanBannerDismissed(dateStr);

  if (isDismissed) {
    return null;
  }

  const formattedDate = format(parseISO(dateStr), 'EEEE, MMM d');

  return (
    <div
      className="rounded-4xl border border-sky-200 bg-[linear-gradient(180deg,#eef6ff_0%,#e6f1ff_100%)] px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:rounded-[22px] sm:px-5 sm:py-3 dark:border-sky-950/80 dark:bg-[linear-gradient(180deg,rgba(10,31,58,0.96)_0%,rgba(14,40,73,0.94)_100%)] dark:shadow-[0_1px_2px_rgba(2,6,23,0.35)]"
      data-testid="meal-plan-banner"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600/12 text-blue-600 sm:h-8 sm:w-8 dark:bg-blue-300/10 dark:text-sky-200">
            <CircleAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-none text-blue-800 sm:text-sm dark:text-sky-100">
              Meal plan ready
            </p>
            <p className="mt-1 text-xs leading-[1.35rem] text-blue-700 sm:text-sm sm:leading-5 dark:text-sky-200/85">
              Your pre-defined {planName.toLowerCase()} strategy is ready for {formattedDate}. You can log all planned meals at once to save time.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 pl-9 sm:gap-2 sm:pl-0">
          <Button
            type="button"
            size="sm"
            className="h-7 rounded-lg bg-blue-600 px-2.5 text-[11px] font-semibold text-white shadow-[0_6px_14px_rgba(37,99,235,0.16)] hover:bg-blue-700 sm:h-8 sm:px-3 sm:text-xs dark:bg-blue-500 dark:text-slate-950 dark:shadow-[0_8px_18px_rgba(2,6,23,0.28)] dark:hover:bg-blue-400"
            onClick={onLogAll}
            data-testid="log-all-meals-btn"
          >
            <span className="sm:hidden">Log meals</span>
            <span className="hidden sm:inline">Log all meals</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-8 w-8 shrink-0 rounded-full text-blue-500 hover:bg-blue-600/10 hover:text-blue-700 sm:h-9 sm:w-9 dark:text-sky-300 dark:hover:bg-white/8 dark:hover:text-sky-100"
            onClick={dismiss}
            data-testid="meal-plan-banner-dismiss"
            aria-label="Dismiss meal plan banner"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}