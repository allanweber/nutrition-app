'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MealCard } from './meal-card';
import { CopyDayPopover } from './copy-day-popover';
import type { DietPlanDTO, DietPlanMealDTO } from '@/server/services/diet-plan.service';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface DayMealsViewProps {
  plan: DietPlanDTO;
  meals: DietPlanMealDTO[];
  selectedDay: number;
  isLoading: boolean;
  onAddMeal: (day: number) => void;
  onEditMeal: (meal: DietPlanMealDTO) => void;
}

export function DayMealsView({ plan, meals, selectedDay, isLoading, onAddMeal, onEditMeal }: DayMealsViewProps) {
  const dayMeals = meals.filter((m) => m.dayOfWeek === selectedDay);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{DAY_NAMES[selectedDay - 1]}</h2>
        <div className="flex items-center gap-2">
          <CopyDayPopover planId={plan.id} currentDay={selectedDay} meals={meals} />
          <Button size="sm" className="gap-1.5" onClick={() => onAddMeal(selectedDay)}>
            <Plus className="h-3.5 w-3.5" />
            Add Meal
          </Button>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Meal cards */}
      {!isLoading && dayMeals.length > 0 && (
        <div className="space-y-3">
          {dayMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} onEdit={() => onEditMeal(meal)} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && dayMeals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed rounded-2xl">
          <p className="text-sm text-on-surface-variant">No meals planned for this day</p>
          <Button size="sm" variant="outline" onClick={() => onAddMeal(selectedDay)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add first meal
          </Button>
        </div>
      )}
    </div>
  );
}
