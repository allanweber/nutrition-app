'use client';

import { cn } from '@/lib/utils';
import { MACRO_COLORS } from '@/lib/nutrition-constants';
import type { DietPlanDTO, DietPlanMealDTO } from '@/server/services/diet-plan.service';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface DaySelectorProps {
  plan: DietPlanDTO;
  meals: DietPlanMealDTO[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

export function DaySelector({ plan, meals, selectedDay, onSelectDay }: DaySelectorProps) {
  return (
    <div className="mb-6 flex flex-wrap justify-between gap-2">
      {DAY_LABELS.map((label, idx) => {
        const day = idx + 1;
        const dayMeals = meals.filter((m) => m.dayOfWeek === day);
        const calories = dayMeals.reduce((sum, m) => sum + m.totalCalories, 0);
        const protein = dayMeals.reduce((sum, m) => sum + m.totalProtein, 0);
        const carbs = dayMeals.reduce((sum, m) => sum + m.totalCarbs, 0);
        const fat = dayMeals.reduce((sum, m) => sum + m.totalFat, 0);

        const calPct = plan.targetCalories ? Math.min(100, (calories / plan.targetCalories) * 100) : 0;
        const proteinPct = plan.targetProtein ? Math.min(100, (protein / plan.targetProtein) * 100) : 0;
        const carbsPct = plan.targetCarbs ? Math.min(100, (carbs / plan.targetCarbs) * 100) : 0;
        const fatPct = plan.targetFat ? Math.min(100, (fat / plan.targetFat) * 100) : 0;

        const isSelected = day === selectedDay;

        return (
          <button
            key={day}
            onClick={() => onSelectDay(day)}
            className={cn(
              'flex flex-col gap-2 p-3 rounded-xl border transition-all min-w-20 flex-1 text-left cursor-pointer',
              isSelected
                ? 'bg-[#C1F0B1] dark:bg-surface-container'
                : 'border-border bg-background hover:border-border/80 hover:bg-muted/30',
            )}
          >
            {/* Day name */}
            <span className={cn('uppercase text-xs font-semibold', isSelected ? 'text-emerald-700 ' : 'text-foreground opacity-30 ')}>
              {label}
            </span>

            {/* Calories */}
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">
                {calories > 0 ? Math.round(calories) : '—'}
              </p>
              {calories > 0 && (
                <p className="text-xs text-on-surface-variant">
                  {Math.round(calPct)}%
                </p>
              )}
            </div>

            {/* Macro bars */}
            <div className="space-y-1">
              {[
                { pct: proteinPct, color: MACRO_COLORS.protein },
                { pct: carbsPct, color: MACRO_COLORS.carbs },
                { pct: fatPct, color: MACRO_COLORS.fat },
              ].map(({ pct, color }, i) => (
                <div key={i} className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', color)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
