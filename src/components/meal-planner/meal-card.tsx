'use client';

import { MealTypeLabel } from '@/components/meal-type-label';
import { MealItemRow } from './meal-item-row';
import type { DietPlanMealDTO } from '@/server/services/diet-plan.service';

interface MealCardProps {
  meal: DietPlanMealDTO;
  onEdit: () => void;
}

export function MealCard({ meal, onEdit }: MealCardProps) {
  return (
    <div
      onClick={onEdit}
      className="rounded-2xl border bg-background cursor-pointer hover:shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <MealTypeLabel mealType={meal.mealType} />
        <span className="text-sm font-semibold text-foreground">{Math.round(meal.totalCalories)} kcal</span>
      </div>

      {/* Items */}
      <div className="px-4 divide-y divide-border/50">
        {meal.items.map((item) => (
          <MealItemRow key={item.id} item={item} />
        ))}
        {meal.items.length === 0 && (
          <p className="py-3 text-sm text-on-surface-variant">No items</p>
        )}
      </div>

      {/* Footer — macro summary */}
      {meal.items.length > 0 && (
        <div className="flex gap-4 px-4 py-2 border-t text-xs text-on-surface-variant">
          <span><span className="text-rose-500 font-medium">{Math.round(meal.totalProtein)}g</span> P</span>
          <span><span className="text-amber-500 font-medium">{Math.round(meal.totalCarbs)}g</span> C</span>
          <span><span className="text-sky-500 font-medium">{Math.round(meal.totalFat)}g</span> F</span>
        </div>
      )}
    </div>
  );
}
