'use client';

import { useEffect, useState } from 'react';
import { MealCard } from './meal-card';
import { EmptyMealSlot } from './empty-meal-slot';
import { CopyDayPopover } from './copy-day-popover';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MEAL_TYPE_ORDER, type MealType } from '@/lib/nutrition-constants';
import type { DietPlanDTO, DietPlanMealDTO } from '@/server/services/diet-plan.service';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface DayMealsViewProps {
  plan: DietPlanDTO;
  meals: DietPlanMealDTO[];
  selectedDay: number;
  isLoading: boolean;
  deletingMealId: string | null;
  onAddMeal: (day: number, mealType?: string) => void;
  onEditMeal: (meal: DietPlanMealDTO) => void;
  onDeleteMeal: (meal: DietPlanMealDTO) => void;
}

export function DayMealsView({ plan, meals, selectedDay, isLoading, deletingMealId, onAddMeal, onEditMeal, onDeleteMeal }: DayMealsViewProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const dayMeals = meals.filter((m) => m.dayOfWeek === selectedDay);
  const dayName = DAY_NAMES[selectedDay - 1];

  // Avoid duplicate interactive elements in DOM (Playwright strict mode):
  // render either the mobile or desktop header, never both.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Ordering requirement (mobile):
  // 1) Meals with items first (in schedule order)
  // 2) Existing meals with 0 items (in schedule order)
  // 3) Remaining empty placeholders (in schedule order; mobile-only render)
  const orderIndex = (mealType: string) => {
    const idx = MEAL_TYPE_ORDER.indexOf(mealType as MealType);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };

  const existingWithItems = [...dayMeals]
    .filter((m) => m.items.length > 0)
    .sort((a, b) => orderIndex(a.mealType) - orderIndex(b.mealType));

  const existingEmptyMeals = [...dayMeals]
    .filter((m) => m.items.length === 0)
    .sort((a, b) => orderIndex(a.mealType) - orderIndex(b.mealType));

  const presentTypes = new Set(dayMeals.map((m) => m.mealType));
  const missingTypes = MEAL_TYPE_ORDER.filter((t) => !presentTypes.has(t));

  const allSlots = [
    ...existingWithItems.map((meal) => ({ type: 'existing' as const, meal })),
    ...existingEmptyMeals.map((meal) => ({ type: 'existing' as const, meal })),
    ...missingTypes.map((mealType) => ({ type: 'empty' as const, mealType })),
  ];

  return (
    <>
      {!isDesktop && (
        <div className="mt-4 mb-2 flex items-end justify-between gap-2">
          <h2 data-testid="mobile-day-meals-heading" className="text-2xl font-bold text-foreground">
            {dayName}&apos;s Meals
          </h2>
          <div className="flex items-center gap-2">
            <CopyDayPopover planId={plan.id} currentDay={selectedDay} meals={meals} />
          </div>
        </div>
      )}

      <div data-testid="day-meals-view" className="rounded-2xl border bg-background p-4 md:p-6">
        <div className="space-y-5">
          {isDesktop && (
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-0.5">
                  Detailed Editor •
                </p>
                <h2 data-testid="day-meals-heading" className="text-2xl font-bold text-foreground">
                  {dayName}&apos;s Meals
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <CopyDayPopover planId={plan.id} currentDay={selectedDay} meals={meals} />
                <Button data-testid="add-meal-button" className="gap-1.5" onClick={() => onAddMeal(selectedDay)}>
                  <Plus className="h-3.5 w-3.5" />
                  Add Meal
                </Button>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {/* When the day has no meals yet, show a dashed "Add Meal" card (E2E expects this). */}
          {!isLoading && dayMeals.length === 0 && (
            <button
              type="button"
              data-testid="add-meal-card"
              onClick={() => onAddMeal(selectedDay)}
              className="w-full rounded-2xl border-2 border-dashed border-border px-6 py-10 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="text-sm font-semibold text-foreground">Add your first meal</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Start by adding a meal type, then search foods to build it.
              </div>
            </button>
          )}

          {/* Meal slots */}
          {!isLoading && (
            <div className="grid grid-cols-1 gap-4">
              {allSlots.map((slot) =>
                slot.type === 'existing' ? (
                  <MealCard
                    key={slot.meal.id}
                    meal={slot.meal}
                    defaultCollapsed={slot.meal.items.length === 0}
                    isDeleting={deletingMealId === slot.meal.id}
                    onEdit={() => onEditMeal(slot.meal)}
                    onDelete={() => onDeleteMeal(slot.meal)}
                  />
                ) : (
                  <div key={slot.mealType} className="md:hidden">
                    <EmptyMealSlot
                      mealType={slot.mealType}
                      onAdd={() => onAddMeal(selectedDay, slot.mealType)}
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
