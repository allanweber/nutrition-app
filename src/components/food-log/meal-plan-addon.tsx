'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MEAL_TYPE_LABELS, type MealType } from '@/lib/nutrition-constants';
import type { DietPlanMealDTO } from '@/server/services/diet-plan.service';

interface MealPlanAddonProps {
  mealType: MealType;
  planMeal: DietPlanMealDTO;
  planId: string;
  date: string;
  isLogging: boolean;
  onLogPlan: () => void;
}

export function MealPlanAddon({
  mealType,
  planMeal,
  planId,
  date,
  isLogging,
  onLogPlan,
}: MealPlanAddonProps) {
  if (planMeal.items.length === 0) {
    return null;
  }

  const visibleItems = planMeal.items.slice(0, 3).map((item) => item.foodName);
  const overflowCount = Math.max(planMeal.items.length - visibleItems.length, 0);

  return (
    <div
      className="border-t border-border/10 bg-background px-5 py-4"
      data-plan-id={planId}
      data-plan-date={date}
      data-testid={`meal-plan-addon-${mealType}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/80">
              Plan for {MEAL_TYPE_LABELS[mealType]}
            </p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {visibleItems.join(' • ')}
            {overflowCount > 0 ? ` • +${overflowCount} more` : ''}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-full border border-primary/10 bg-secondary px-3 text-xs font-semibold text-primary shadow-none hover:border-primary/25 hover:bg-primary/10 hover:text-primary dark:border-primary/12 dark:bg-secondary dark:hover:border-primary/35 dark:hover:bg-primary/18 dark:hover:text-primary"
          onClick={onLogPlan}
          disabled={isLogging}
          data-testid={`log-plan-btn-${mealType}`}
        >
          {isLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
          Log Plan
        </Button>
      </div>
    </div>
  );
}