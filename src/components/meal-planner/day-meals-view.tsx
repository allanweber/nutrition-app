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
  deletingMealId: string | null;
  onAddMeal: (day: number) => void;
  onEditMeal: (meal: DietPlanMealDTO) => void;
  onDeleteMeal: (meal: DietPlanMealDTO) => void;
}

export function DayMealsView({ plan, meals, selectedDay, isLoading, deletingMealId, onAddMeal, onEditMeal, onDeleteMeal }: DayMealsViewProps) {
  const dayMeals = meals.filter((m) => m.dayOfWeek === selectedDay);
  const dayName = DAY_NAMES[selectedDay - 1];

  return (
    <div className="mt-6 rounded-2xl border bg-background p-6">
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-0.5">
            Detailed Editor •
          </p>
          <h2 className="text-2xl font-bold text-foreground">{dayName}&apos;s Meals</h2>
        </div>
        <div className="flex items-center gap-2">
          <CopyDayPopover planId={plan.id} currentDay={selectedDay} meals={meals} />
          <Button className="gap-1.5" onClick={() => onAddMeal(selectedDay)}>
            <Plus className="h-3.5 w-3.5" />
            Add Meal
          </Button>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Meal grid + add-another card */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dayMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              isDeleting={deletingMealId === meal.id}
              onEdit={() => onEditMeal(meal)}
              onDelete={() => onDeleteMeal(meal)}
            />
          ))}

          {/* Add another meal card */}
          <button
            onClick={() => onAddMeal(selectedDay)}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors min-h-48 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Add another meal to {dayName}</p>
          </button>
        </div>
      )}
    </div>
    </div>
  );
}
