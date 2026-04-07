'use client';

import { Utensils } from 'lucide-react';
import { MEAL_TYPE_LABELS } from '@/lib/nutrition-constants';
import { MealItemRow } from './meal-item-row';
import type { DietPlanMealDTO } from '@/server/services/diet-plan.service';

interface MealCardProps {
  meal: DietPlanMealDTO;
  onEdit: () => void;
}

const MEAL_ICON_COLORS: Record<string, string> = {
  breakfast: 'bg-emerald-500 text-white',
  lunch: 'bg-sky-500 text-white',
  dinner: 'bg-violet-500 text-white',
  snack: 'bg-emerald-400 text-white',
  morning_snack: 'bg-amber-500 text-white',
  afternoon_snack: 'bg-orange-500 text-white',
  evening_snack: 'bg-indigo-500 text-white',
  pre_workout: 'bg-lime-500 text-white',
  post_workout: 'bg-teal-500 text-white',
  other: 'bg-muted text-muted-foreground',
};

export function MealCard({ meal, onEdit }: MealCardProps) {
  const iconColors = MEAL_ICON_COLORS[meal.mealType] ?? 'bg-muted text-muted-foreground';
  const label = (MEAL_TYPE_LABELS[meal.mealType] ?? meal.mealType).toUpperCase();

  return (
    <div
      onClick={onEdit}
      className="rounded-2xl border bg-background cursor-pointer hover:shadow-sm transition-all"
    >
      {/* Header — no bottom border */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColors}`}>
          <Utensils className="h-5 w-5" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-foreground">{label}</span>
      </div>

      {/* Items — very subtle dividers */}
      <div className="px-5 divide-y divide-border/30">
        {meal.items.map((item) => (
          <MealItemRow key={item.id} item={item} />
        ))}
        {meal.items.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">No items added yet</p>
        )}
      </div>

      {/* Footer — muted background, no top border */}
      {meal.items.length > 0 && (
        <div className="flex items-stretch bg-muted/40 rounded-b-2xl divide-x divide-border/30">
          <div className="flex flex-col px-5 py-3 flex-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Calories</span>
            <span className="text-base font-bold text-foreground">
              {Math.round(meal.totalCalories)}{' '}
              <span className="text-xs font-normal text-muted-foreground">kcal</span>
            </span>
          </div>
          <div className="flex flex-col px-4 py-3">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Protein</span>
            <span className="text-base font-bold text-rose-500">{Math.round(meal.totalProtein)}g</span>
          </div>
          <div className="flex flex-col px-4 py-3">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Carbs</span>
            <span className="text-base font-bold text-amber-500">{Math.round(meal.totalCarbs)}g</span>
          </div>
          <div className="flex flex-col px-4 py-3">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Fats</span>
            <span className="text-base font-bold text-sky-500">{Math.round(meal.totalFat)}g</span>
          </div>
        </div>
      )}
    </div>
  );
}
