'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MACRO_COLORS } from '@/lib/nutrition-constants';
import type { DietPlanDTO, DietPlanMealDTO } from '@/server/services/diet-plan.service';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MACRO_BARS = [
  { key: 'protein', label: 'Prot' },
  { key: 'carbs', label: 'Carb' },
  { key: 'fat', label: 'Fat' },
] as const;

interface DaySelectorProps {
  plan: DietPlanDTO;
  meals: DietPlanMealDTO[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

export function DaySelector({ plan, meals, selectedDay, onSelectDay }: DaySelectorProps) {
  return (
    <div data-testid="day-selector" className="mb-6 flex flex-wrap justify-between gap-2">
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

        const isEmpty = calories === 0;
        const isSelected = day === selectedDay;

        const macroPcts = {
          protein: proteinPct,
          carbs: carbsPct,
          fat: fatPct,
        };

        return (
          <Button
            key={day}
            data-testid={`day-button-${day}`}
            onClick={() => onSelectDay(day)}
            variant="ghost"
            className={cn(
              'flex flex-col gap-2 p-3 rounded-xl border h-auto min-w-20 flex-1 items-start justify-start text-left',
              isSelected
                ? 'bg-day-selected border-day-selected text-white hover:bg-day-selected'
                : 'border-border bg-background hover:border-border/80 hover:bg-muted/30',
            )}
          >
            {/* Day name */}
            <span className={cn('uppercase text-xs font-semibold tracking-wide', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
              {label}
            </span>

            {/* Calories + status */}
            <div className="flex items-baseline justify-between gap-1">
              <p data-testid={`day-calories-${day}`} className={cn('text-sm font-bold leading-tight', isSelected ? 'text-white' : 'text-foreground')}>
                {isEmpty ? '0' : Math.round(calories).toLocaleString()}
                <span className={cn('text-[10px] font-normal ml-0.5', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>kcal</span>
              </p>
              {isSelected && !isEmpty && (
                <span className="text-[10px] font-semibold text-primary-foreground/70 shrink-0">Active</span>
              )}
              {!isSelected && !isEmpty && (
                <span className="text-[10px] font-medium text-primary shrink-0">{Math.round(calPct)}%</span>
              )}
              {!isSelected && isEmpty && (
                <span className="text-[10px] font-medium text-muted-foreground shrink-0">Empty</span>
              )}
            </div>

            {/* Macro bars with labels */}
            <div className="flex gap-1">
              {MACRO_BARS.map(({ key, label: macroLabel }) => (
                <div key={key} className="flex flex-col gap-0.5 flex-1">
                  <div className={cn('h-1 w-full rounded-full overflow-hidden', isSelected ? 'bg-day-selected/40' : 'bg-muted')}>
                    <div
                      className={cn('h-full rounded-full transition-all', isSelected ? 'bg-primary/80' : MACRO_COLORS[key])}
                      style={{ width: `${macroPcts[key]}%` }}
                    />
                  </div>
                  <span className={cn('text-[9px] uppercase font-medium tracking-wider', isSelected ? 'text-primary/80' : 'text-muted-foreground/60')}>
                    {macroLabel}
                  </span>
                </div>
              ))}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
