'use client';

import { useState } from 'react';
import { Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCopyDayMutation } from '@/queries/diet-plans';
import type { DietPlanMealDTO } from '@/server/services/diet-plan.service';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface CopyDayPopoverProps {
  planId: string;
  currentDay: number;
  meals: DietPlanMealDTO[];
}

export function CopyDayPopover({ planId, currentDay, meals }: CopyDayPopoverProps) {
  const [open, setOpen] = useState(false);
  const [copyingFromDay, setCopyingFromDay] = useState<number | null>(null);
  const copyMutation = useCopyDayMutation();

  // Days that have at least one meal, excluding the current day
  const daysWithMeals = Array.from(new Set(meals.map((m) => m.dayOfWeek))).filter(
    (d) => d !== currentDay,
  );

  if (daysWithMeals.length === 0) return null;

  async function handleCopy(fromDay: number) {
    setCopyingFromDay(fromDay);
    try {
      await copyMutation.mutateAsync({ planId, fromDay, toDay: currentDay });
      setOpen(false);
    } finally {
      setCopyingFromDay(null);
    }
  }

  const isPending = copyMutation.isPending;

  return (
    <Popover open={open} onOpenChange={(v) => { if (!isPending) setOpen(v); }}>
      <PopoverTrigger asChild>
        <Button
          data-testid="copy-day-button"
          variant="outline"
          disabled={isPending}
          className="gap-1.5 max-md:border-0 max-md:bg-transparent max-md:shadow-none max-md:px-0 max-md:hover:bg-transparent max-md:text-primary max-md:hover:text-primary max-md:underline-offset-4 max-md:hover:underline"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
          Copy Day
        </Button>
      </PopoverTrigger>
      <PopoverContent data-testid="copy-day-popover" align="end" className="w-44 p-1">
        <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Copy meals from</p>
        {daysWithMeals.map((day) => (
          <Button
            key={day}
            data-testid={`copy-from-day-${day}`}
            onClick={() => handleCopy(day)}
            disabled={isPending}
            variant="ghost"
            size="sm"
            className="w-full justify-between text-sm font-normal"
          >
            {DAY_NAMES[day - 1]}
            {copyingFromDay === day && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
