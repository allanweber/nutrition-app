'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Star, ChevronRight } from 'lucide-react';
import { useNutritionSummaryQuery } from '@/queries/nutrition-summary';
import { useFoodLogsQuery } from '@/queries/food-logs';
import { useFavoritesTopQuery } from '@/queries/favorites';
import { MACRO_COLORS } from '@/lib/nutrition-constants';
import { FavoritesModal } from '@/components/favorites-modal';
import type { FavoriteItem } from '@/types/favorites';

interface NutritionPulseProps {
  date: string;
  onAddFood: (item: FavoriteItem) => void;
  onQuickAddFood?: (name: string) => void;
}

export function NutritionPulse({ date, onAddFood, onQuickAddFood }: NutritionPulseProps) {
  const { data, isLoading } = useNutritionSummaryQuery(date);
  const { data: logsData } = useFoodLogsQuery(date);
  const { data: topFavsData } = useFavoritesTopQuery();
  const [expanded, setExpanded] = useState(false);
  const [favModalOpen, setFavModalOpen] = useState(false);

  const remaining = data?.remaining ?? 0;
  const isOverGoal = remaining < 0 && (data?.calorieGoal ?? 0) > 0;

  const pct = Math.min(Math.max(data?.percentConsumed ?? 0, 0), 100);
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);

  const calorieGoal = data?.calorieGoal ?? 0;
  const overflowPct = isOverGoal && calorieGoal > 0
    ? Math.min(((data?.caloriesConsumed ?? 0) - calorieGoal) / calorieGoal * 100, 100)
    : 0;
  const overflowDashOffset = circumference * (1 - overflowPct / 100);

  const macros = [
    { key: 'protein' as const, label: 'Protein', consumed: data?.protein.consumed ?? 0, goal: data?.protein.goal ?? 0 },
    { key: 'carbs' as const, label: 'Carbs', consumed: data?.carbs.consumed ?? 0, goal: data?.carbs.goal ?? 0 },
    { key: 'fat' as const, label: 'Fat', consumed: data?.fat.consumed ?? 0, goal: data?.fat.goal ?? 0 },
  ];

  const logTotals = logsData?.totals;
  const netCarbs = Math.max(0, Math.round(((logTotals?.carbs ?? 0) - (logTotals?.fiber ?? 0)) * 10) / 10);

  const allNutrientGroups = [
    {
      heading: 'Calories & Macros',
      rows: [
        { label: 'Calories', value: logTotals?.calories ?? 0, unit: 'kcal', goal: data?.calorieGoal },
        { label: 'Protein', value: logTotals?.protein ?? 0, unit: 'g', goal: data?.protein.goal },
        { label: 'Total Carbs', value: logTotals?.carbs ?? 0, unit: 'g', goal: data?.carbs.goal },
        { label: 'Total Fat', value: logTotals?.fat ?? 0, unit: 'g', goal: data?.fat.goal },
      ],
    },
    {
      heading: 'Carbohydrates',
      rows: [
        { label: 'Net Carbs', value: netCarbs, unit: 'g', goal: undefined },
        { label: 'Fiber', value: logTotals?.fiber ?? 0, unit: 'g', goal: undefined },
        { label: 'Sugar', value: logTotals?.sugar ?? 0, unit: 'g', goal: undefined },
      ],
    },
    {
      heading: 'Fats Detail',
      rows: [
        { label: 'Saturated Fat', value: logTotals?.saturatedFat ?? 0, unit: 'g', goal: undefined },
        { label: 'Polyunsaturated Fat', value: logTotals?.polyunsaturatedFat ?? 0, unit: 'g', goal: undefined },
        { label: 'Monounsaturated Fat', value: logTotals?.monounsaturatedFat ?? 0, unit: 'g', goal: undefined },
      ],
    },
    {
      heading: 'Minerals',
      rows: [
        { label: 'Sodium', value: Math.round(logTotals?.sodium ?? 0), unit: 'mg', goal: undefined },
        { label: 'Potassium', value: logTotals?.potassium ?? 0, unit: 'mg', goal: undefined },
        { label: 'Calcium', value: logTotals?.calcium ?? 0, unit: 'mg', goal: undefined },
        { label: 'Iron', value: logTotals?.iron ?? 0, unit: 'mg', goal: undefined },
      ],
    },
    {
      heading: 'Vitamins',
      rows: [
        { label: 'Vitamin A', value: logTotals?.vitaminA ?? 0, unit: 'mcg', goal: undefined },
        { label: 'Vitamin C', value: logTotals?.vitaminC ?? 0, unit: 'mg', goal: undefined },
      ],
    },
    {
      heading: 'Other',
      rows: [
        { label: 'Cholesterol', value: logTotals?.cholesterol ?? 0, unit: 'mg', goal: undefined },
      ],
    },
  ];

  const topFavorites = topFavsData?.favorites ?? [];

  // Unique foods from today's logs (up to 5) for quick-add
  const recentFoods = logsData?.logs
    ? [...new Map(logsData.logs.map((l) => [l.food.id, l.food])).values()].slice(0, 5)
    : [];

  return (
    <>
      <div
        className={[
          'bg-[#C1F0B1] rounded-[2rem] p-8 sticky top-24 overflow-hidden relative',
          'dark:bg-secondary dark:border dark:border-primary/30',
          '[--pulse-fill:var(--green-dark)] [--pulse-track:#aee39d]',
          'dark:[--pulse-fill:var(--primary)] dark:[--pulse-track:var(--border)]',
        ].join(' ')}
        data-testid="nutrition-pulse"
      >
        {/* Decorative circle */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full pointer-events-none dark:bg-primary/5" />

        <h2 className="text-base font-bold text-[#002203] dark:text-foreground mb-6">
          Nutrition Pulse
        </h2>

        {/* Calorie Ring */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--pulse-track)" strokeWidth={strokeWidth} />
              <circle
                cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke="var(--pulse-fill)" strokeWidth={strokeWidth} strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={isOverGoal ? 0 : dashOffset}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              {isOverGoal && (
                <circle
                  cx={size / 2} cy={size / 2} r={radius} fill="none"
                  stroke="#ef4444" strokeWidth={strokeWidth} strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={overflowDashOffset}
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={`text-3xl font-headline font-black tabular-nums leading-none ${
                  isOverGoal ? 'text-red-600 dark:text-red-400' : 'text-[#002203] dark:text-foreground'
                }`}
                data-testid="pulse-calories-remaining"
              >
                {isLoading ? '—' : remaining}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#002203]/60 dark:text-muted-foreground mt-1">
                kcal left
              </span>
            </div>
          </div>
          <p className="mt-3 text-sm text-[#002203]/70 dark:text-muted-foreground tabular-nums text-center">
            {data?.caloriesConsumed ?? 0} / {data?.calorieGoal ?? 0} kcal consumed
          </p>
        </div>

        {/* Macro Bars */}
        <div className="space-y-4 mb-8">
          {macros.map(({ key, label, consumed, goal }) => {
            const macroPct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
            return (
              <div key={key} data-testid={`pulse-macro-${key}`}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#002203]/80 dark:text-muted-foreground">
                    {label}
                  </span>
                  <span className="text-xs font-bold tabular-nums text-[#002203] dark:text-foreground">
                    {consumed}g
                    <span className="font-normal opacity-60"> / {goal}g</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-black/10 dark:bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${MACRO_COLORS[key]}`}
                    style={{ width: `${macroPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Expand / collapse all nutrients */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center justify-center gap-1.5 w-full mb-6 text-xs font-semibold text-[#002203]/70 dark:text-muted-foreground hover:text-[#002203] dark:hover:text-foreground transition-colors"
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? 'Hide' : 'All nutrients'}
        </button>

        {/* Extended nutrients panel */}
        {expanded && (
          <div className="mb-6 space-y-4">
            {allNutrientGroups.map((group) => (
              <div key={group.heading} className="rounded-2xl bg-black/5 dark:bg-muted p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#002203]/50 dark:text-muted-foreground mb-3">
                  {group.heading}
                </p>
                <div className="space-y-2">
                  {group.rows.map(({ label, value, unit, goal }) => (
                    <div key={label} className="flex items-baseline justify-between">
                      <span className="text-xs text-[#002203]/70 dark:text-muted-foreground">{label}</span>
                      <span className="text-sm font-bold tabular-nums text-[#002203] dark:text-foreground">
                        {value}
                        <span className="text-xs font-normal opacity-60 ml-0.5">{unit}</span>
                        {goal != null && goal > 0 && (
                          <span className="text-xs font-normal opacity-50 ml-1">/ {goal}{unit}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Favorites section */}
        <div data-testid="favorites-section">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#002203]/60 dark:text-muted-foreground">
                Favorites
              </p>
            </div>
            <button
              onClick={() => setFavModalOpen(true)}
              className="flex items-center gap-0.5 text-[10px] font-semibold text-[#002203]/60 dark:text-muted-foreground hover:text-[#002203] dark:hover:text-foreground transition-colors"
              data-testid="see-all-favorites"
            >
              See all
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          {topFavorites.length === 0 ? (
            <p className="text-xs text-[#002203]/50 dark:text-muted-foreground/50">
              Star foods or dishes to add them here
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topFavorites.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onAddFood(item)}
                  data-testid={`favorite-pill-${item.id}`}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/40 hover:bg-white/60 dark:bg-muted dark:hover:bg-secondary text-[#002203] dark:text-foreground font-medium transition-colors"
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Add Recent */}
        {recentFoods.length > 0 && (
          <div data-testid="quick-add-recent" className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#002203]/60 dark:text-muted-foreground mb-3">
              Quick Add
            </p>
            <div className="flex flex-wrap gap-2">
              {recentFoods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => onQuickAddFood?.(food.name)}
                  data-testid={`quick-add-${food.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/40 hover:bg-white/60 dark:bg-muted dark:hover:bg-secondary text-[#002203] dark:text-foreground font-medium transition-colors"
                >
                  {food.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <FavoritesModal
        open={favModalOpen}
        onClose={() => setFavModalOpen(false)}
        onSelectFood={onAddFood}
        onSelectDish={onAddFood}
      />
    </>
  );
}
