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
      className="rounded-4xl border border-sky-200/80 bg-sky-50 px-3 py-2.5 shadow-sm sm:rounded-[22px] sm:px-5 sm:py-3 dark:border-sky-900/60 dark:bg-sky-950/40"
      data-testid="meal-plan-banner"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200">
            <CircleAlert className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-none text-sky-900 sm:text-sm dark:text-sky-100">
              Meal plan ready
            </p>
            <p className="mt-1 text-xs leading-[1.35rem] text-sky-800 sm:text-sm sm:leading-5 dark:text-sky-200/85">
              Your pre-defined {planName.toLowerCase()} strategy is ready for {formattedDate}. You can log all planned meals at once to save time.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 pl-9 sm:gap-2 sm:pl-0">
          <Button
            type="button"
            size="sm"
            className="h-9 rounded-lg px-3 text-xs font-semibold sm:h-10"
            onClick={onLogAll}
            data-testid="log-all-meals-btn"
          >
            <span className="sm:hidden">Log meals</span>
            <span className="hidden sm:inline">Log all meals</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full text-sky-700 hover:bg-sky-100 dark:text-sky-300 dark:hover:bg-sky-900/50"
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
