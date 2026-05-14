'use client';

import { useState } from 'react';
import { Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCopyMealMutation } from '@/queries/diet-plans';
import { MEAL_TYPE_ORDER, MEAL_TYPE_LABELS, type MealType } from '@/lib/nutrition-constants';
import type { DietPlanMealDTO } from '@/server/services/diet-plan.service';

interface CopyMealPopoverProps {
  planId: string;
  meal: DietPlanMealDTO;
}

export function CopyMealPopover({ planId, meal }: CopyMealPopoverProps) {
  const [open, setOpen] = useState(false);
  const [copyingToType, setCopyingToType] = useState<MealType | null>(null);
  const copyMutation = useCopyMealMutation();

  const targetTypes = MEAL_TYPE_ORDER.filter((t) => t !== meal.mealType);
  const isPending = copyMutation.isPending;

  async function handleCopy(toMealType: MealType) {
    setCopyingToType(toMealType);
    try {
      await copyMutation.mutateAsync({ planId, mealId: meal.id, toMealType });
      setOpen(false);
    } finally {
      setCopyingToType(null);
    }
  }

  return (
    <Popover open={open} onOpenChange={(v) => { if (!isPending) setOpen(v); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-testid={`copy-meal-btn-${meal.id}`}
          onClick={(e) => e.stopPropagation()}
          disabled={isPending}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
          Copy Meal to...
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-48 p-1"
        data-testid="copy-meal-popover"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Copy items to</p>
        {targetTypes.map((mealType) => (
          <Button
            key={mealType}
            data-testid={`copy-to-meal-type-${mealType}`}
            onClick={(e) => { e.stopPropagation(); handleCopy(mealType); }}
            disabled={isPending}
            variant="ghost"
            size="sm"
            className="w-full justify-between text-sm font-normal"
          >
            {MEAL_TYPE_LABELS[mealType]}
            {copyingToType === mealType && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
