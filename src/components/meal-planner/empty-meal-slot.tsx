'use client';

import { Plus, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MEAL_TYPE_COLORS, MEAL_TYPE_LABELS, type MealType } from '@/lib/nutrition-constants';

interface EmptyMealSlotProps {
  mealType: MealType;
  onAdd: () => void;
}

export function EmptyMealSlot({ mealType, onAdd }: EmptyMealSlotProps) {
  const iconColors = MEAL_TYPE_COLORS[mealType] ?? 'bg-muted text-muted-foreground';
  const label = MEAL_TYPE_LABELS[mealType] ?? mealType;

  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={`Add ${label} meal`}
      className={cn(
        'flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-dashed border-border',
        'hover:border-primary/50 hover:bg-primary/5 transition-colors w-full text-left',
      )}
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconColors)}>
        <Utensils className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium text-muted-foreground flex-1">Add {label}</span>
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Plus className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </button>
  );
}
