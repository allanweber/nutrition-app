'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
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
  const copyMutation = useCopyDayMutation();

  // Days that have at least one meal, excluding the current day
  const daysWithMeals = Array.from(new Set(meals.map((m) => m.dayOfWeek))).filter(
    (d) => d !== currentDay,
  );

  if (daysWithMeals.length === 0) return null;

  async function handleCopy(fromDay: number) {
    await copyMutation.mutateAsync({ planId, fromDay, toDay: currentDay });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Copy className="h-3.5 w-3.5" />
          Copy Day
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1">
        <p className="text-xs text-on-surface-variant px-2 py-1 font-medium">Copy meals from</p>
        {daysWithMeals.map((day) => (
          <button
            key={day}
            onClick={() => handleCopy(day)}
            disabled={copyMutation.isPending}
            className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted transition-colors disabled:opacity-50"
          >
            {DAY_NAMES[day - 1]}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
