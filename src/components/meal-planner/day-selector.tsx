'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MACRO_COLORS, MACRO_CELL_FILL } from '@/lib/nutrition-constants';
import type { DietPlanDTO, DietPlanMealDTO } from '@/server/services/diet-plan.service';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MACRO_BARS = [
  { key: 'protein', label: 'Prot' },
  { key: 'carbs', label: 'Carb' },
  { key: 'fat', label: 'Fat' },
] as const;

const SUMMARY_ROWS = [
  { key: 'calories' as const, label: 'Calories', unit: 'kcal', barClass: MACRO_CELL_FILL.calories },
  { key: 'protein' as const, label: 'Protein', unit: 'g', barClass: MACRO_COLORS.protein },
  { key: 'carbs' as const, label: 'Carbs', unit: 'g', barClass: MACRO_COLORS.carbs },
  { key: 'fat' as const, label: 'Fat', unit: 'g', barClass: MACRO_COLORS.fat },
];

interface DaySelectorProps {
  plan: DietPlanDTO;
  meals: DietPlanMealDTO[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

function DayMacroSummary({ plan, dayMeals }: { plan: DietPlanDTO; dayMeals: DietPlanMealDTO[] }) {
  const consumed = {
    calories: dayMeals.reduce((s, m) => s + m.totalCalories, 0),
    protein: dayMeals.reduce((s, m) => s + m.totalProtein, 0),
    carbs: dayMeals.reduce((s, m) => s + m.totalCarbs, 0),
    fat: dayMeals.reduce((s, m) => s + m.totalFat, 0),
  };
  const targets = {
    calories: plan.targetCalories,
    protein: plan.targetProtein,
    carbs: plan.targetCarbs,
    fat: plan.targetFat,
  };

  return (
    <div className="mt-3 rounded-2xl bg-secondary px-3 py-3">
      <div className="space-y-2">
        {SUMMARY_ROWS.map(({ key, label, unit, barClass }) => {
          const target = targets[key];
          const value = consumed[key];
          const pct = target ? Math.min(100, (value / target) * 100) : 0;
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-widest w-16 shrink-0 text-muted-foreground whitespace-nowrap">
                {label}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', barClass)} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[11px] tabular-nums text-muted-foreground w-22 text-right shrink-0 whitespace-nowrap">
                <span className="font-semibold text-foreground">{Math.round(value)}</span>
                {unit} / {target ? `${Math.round(target)}${unit}` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DaySelector({ plan, meals, selectedDay, onSelectDay }: DaySelectorProps) {
  const dayScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const el = dayScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    const el = dayScrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, []);

  function scrollDays(dir: 'left' | 'right') {
    const el = dayScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -120 : 120, behavior: 'smooth' });
  }

  return (
    <>
      {/* Mobile layout */}
      <div className="lg:hidden mb-4">
        <div className="relative">
          {canScrollLeft && (
            <button
              onClick={() => scrollDays('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-background/80 shadow border rounded-full flex items-center justify-center"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
          )}

          <div
            ref={dayScrollRef}
            className="w-full overflow-x-auto scrollbar-none px-1 pb-1"
            style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex w-max mx-auto gap-1.5">
              {DAY_LABELS.map((label, idx) => {
                const day = idx + 1;
                const isSelected = day === selectedDay;
                return (
                  <button
                    key={day}
                    data-testid={`mobile-day-button-${day}`}
                    onClick={() => onSelectDay(day)}
                    style={{ scrollSnapAlign: 'start' }}
                    className={cn(
                      'shrink-0 h-10 px-4 min-w-16 rounded-full text-sm font-bold uppercase tracking-wide transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-day-selected text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {canScrollRight && (
            <button
              onClick={() => scrollDays('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-background/80 shadow border rounded-full flex items-center justify-center"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>

        <DayMacroSummary
          plan={plan}
          dayMeals={meals.filter((m) => m.dayOfWeek === selectedDay)}
        />
      </div>

      {/* Desktop layout — unchanged */}
      <div data-testid="day-selector" className="hidden lg:flex mb-6 flex-wrap justify-between gap-2">
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

          const macroPcts = { protein: proteinPct, carbs: carbsPct, fat: fatPct };

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
              <span className={cn('uppercase text-xs font-semibold tracking-wide', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                {label}
              </span>

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
    </>
  );
}
