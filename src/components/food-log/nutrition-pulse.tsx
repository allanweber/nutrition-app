'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNutritionSummaryQuery } from '@/queries/nutrition-summary';
import { useFoodLogsQuery } from '@/queries/food-logs';
import { useFavoritesTopQuery } from '@/queries/favorites';
import { MACRO_COLORS } from '@/lib/nutrition-constants';
import { MacroFillTrack } from '@/components/macro-fill-track';
import { FavoritesModal } from '@/components/favorites-modal';
import type { FavoriteItem } from '@/types/favorites';

interface NutritionPulseProps {
  date: string;
  onAddFood: (item: FavoriteItem) => void;
  onQuickAddFood?: (name: string) => void;
  variant?: 'mobile' | 'desktop';
}

export function NutritionPulse({
  date,
  onAddFood,
  onQuickAddFood,
  variant = 'desktop',
}: NutritionPulseProps) {
  const { data, isLoading } = useNutritionSummaryQuery(date);
  const { data: logsData } = useFoodLogsQuery(date);
  const { data: topFavsData } = useFavoritesTopQuery();
  const [expanded, setExpanded] = useState(false);
  const [favModalOpen, setFavModalOpen] = useState(false);

  const remaining = data?.remaining ?? 0;
  const isOverGoal = remaining < 0 && (data?.calorieGoal ?? 0) > 0;

  const percentConsumedRaw = Math.max(data?.percentConsumed ?? 0, 0);
  // Clamp only for visual ring fill; the label should show true overflow (e.g. 118%).
  const pct = Math.min(percentConsumedRaw, 100);
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

  const consumedKcal = data?.caloriesConsumed ?? 0;
  const desktopRingLabel = isLoading
    ? 'Calorie progress, loading'
    : isOverGoal
      ? `Over daily calorie goal by ${Math.abs(remaining)} kilocalories. Consumed ${consumedKcal} of ${calorieGoal} kilocalories.`
      : `${remaining} kilocalories remaining of ${calorieGoal} goal. Consumed ${consumedKcal} kilocalories, ${Math.round(percentConsumedRaw)} percent of daily goal.`;

  if (variant === 'mobile') {
    return (
      <div data-testid="nutrition-pulse-mobile">
        <div className="w-full min-w-0 max-w-full overflow-x-clip rounded-3xl border border-border/30 bg-muted/70 p-4 shadow-sm dark:bg-secondary">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1 pr-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Calories today
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="max-w-full min-w-0 wrap-break-word text-2xl font-headline font-extrabold tabular-nums text-foreground">
                  {logTotals?.calories ?? 0}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  / {data?.calorieGoal ?? 0} kcal
                </span>
              </div>
            </div>

            {(() => {
              const mobileSize = 52;
              const mobileStroke = 7;
              const mobileRadius = (mobileSize - mobileStroke) / 2;
              const mobileCirc = 2 * Math.PI * mobileRadius;
              const mobileDashOffset = mobileCirc * (1 - pct / 100);
              const mobileRingLabel = isLoading
                ? 'Calorie goal progress, loading'
                : `${Math.round(percentConsumedRaw)} percent of daily calories consumed.`;
              return (
                <div
                  className="relative shrink-0"
                  style={{ width: mobileSize, height: mobileSize }}
                  role="img"
                  aria-label={mobileRingLabel}
                >
                  <svg width={mobileSize} height={mobileSize} viewBox={`0 0 ${mobileSize} ${mobileSize}`} className="-rotate-90" aria-hidden>
                    <circle
                      cx={mobileSize / 2}
                      cy={mobileSize / 2}
                      r={mobileRadius}
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth={mobileStroke}
                    />
                    <circle
                      cx={mobileSize / 2}
                      cy={mobileSize / 2}
                      r={mobileRadius}
                      fill="none"
                      stroke={isOverGoal ? 'var(--destructive)' : 'var(--primary)'}
                      strokeWidth={mobileStroke}
                      strokeLinecap="round"
                      strokeDasharray={mobileCirc}
                      strokeDashoffset={isOverGoal ? 0 : mobileDashOffset}
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center" aria-hidden>
                    <span className="text-xs font-extrabold tabular-nums text-foreground">
                      {isLoading ? '—' : `${Math.round(percentConsumedRaw)}%`}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mt-4 grid w-full min-w-0 grid-cols-3 gap-x-2 gap-y-3">
            {macros.map(({ key, label, consumed, goal }) => {
              const macroPct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
              return (
                <div key={key} data-testid={`pulse-macro-mobile-${key}`} className="min-w-0 max-w-full">
                  <div className="flex min-w-0 items-baseline justify-between gap-1">
                    <span className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {label}
                    </span>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-foreground">
                      {consumed}g
                    </span>
                  </div>
                  <MacroFillTrack
                    className="mt-2"
                    percent={macroPct}
                    fillClassName={MACRO_COLORS[key]}
                    trackClassName="bg-black/10 dark:bg-border"
                    role="progressbar"
                    aria-valuenow={Math.round(macroPct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${label} progress`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div data-testid="nutrition-pulse">
        <div className="rounded-[2rem] bg-[var(--nutrition-pulse-surface)] p-8 shadow-sm sticky top-24 overflow-hidden dark:border dark:border-primary/30">
          {/* Decorative circle */}
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[var(--nutrition-pulse-decoration)]" />

          <h2 className="mb-6 text-base font-bold text-[var(--nutrition-pulse-ink)]">
            Nutrition Pulse
          </h2>

          {/* Calorie Ring */}
          <div className="mb-8 flex flex-col items-center">
            <div
              className="relative flex items-center justify-center"
              style={{ width: size, height: size }}
              role="img"
              aria-label={desktopRingLabel}
            >
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--nutrition-pulse-track)" strokeWidth={strokeWidth} />
                <circle
                  cx={size / 2} cy={size / 2} r={radius} fill="none"
                  stroke="var(--nutrition-pulse-fill)" strokeWidth={strokeWidth} strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={isOverGoal ? 0 : dashOffset}
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
                {isOverGoal && (
                  <circle
                    cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke="var(--destructive)" strokeWidth={strokeWidth} strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={overflowDashOffset}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
                <span
                  className={`text-3xl font-headline font-black tabular-nums leading-none ${
                    isOverGoal ? 'text-destructive' : 'text-[var(--nutrition-pulse-ink)]'
                  }`}
                  data-testid="pulse-calories-remaining"
                >
                  {isLoading ? '—' : remaining}
                </span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--nutrition-pulse-ink-muted)]">
                  kcal left
                </span>
              </div>
            </div>
            <p className="mt-3 text-center text-sm tabular-nums text-[var(--nutrition-pulse-ink-muted)]">
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
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--nutrition-pulse-ink-muted)]">
                      {label}
                    </span>
                    <span className="text-xs font-bold tabular-nums text-[var(--nutrition-pulse-ink)]">
                      {consumed}g
                      <span className="font-normal opacity-60"> / {goal}g</span>
                    </span>
                  </div>
                  <MacroFillTrack
                    percent={macroPct}
                    fillClassName={MACRO_COLORS[key]}
                    trackClassName="bg-black/10 dark:bg-border"
                    role="progressbar"
                    aria-valuenow={Math.round(macroPct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${label} progress`}
                  />
                </div>
              );
            })}
          </div>

          {/* Expand / collapse all nutrients */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className="mb-6 flex h-auto w-full items-center justify-center gap-1.5 text-xs font-semibold text-[var(--nutrition-pulse-ink-muted)] transition-colors hover:bg-transparent hover:text-[var(--nutrition-pulse-ink)] dark:hover:text-foreground"
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? 'Hide' : 'All nutrients'}
          </Button>

          {/* Extended nutrients panel */}
          {expanded && (
            <div className="mb-6 space-y-4">
              {allNutrientGroups.map((group) => (
                <div key={group.heading} className="rounded-2xl bg-black/5 p-4 dark:bg-muted">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--nutrition-pulse-ink-faint)]">
                    {group.heading}
                  </p>
                  <div className="space-y-2">
                    {group.rows.map(({ label, value, unit, goal }) => (
                      <div key={label} className="flex items-baseline justify-between">
                        <span className="text-xs text-[var(--nutrition-pulse-ink-muted)]">{label}</span>
                        <span className="text-sm font-bold tabular-nums text-[var(--nutrition-pulse-ink)]">
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
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--nutrition-pulse-ink-muted)]">
                  Favorites
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFavModalOpen(true)}
                className="flex h-auto items-center gap-0.5 p-0 text-[10px] font-semibold text-[var(--nutrition-pulse-ink-muted)] transition-colors hover:bg-transparent hover:text-[var(--nutrition-pulse-ink)] dark:hover:text-foreground"
                data-testid="see-all-favorites"
              >
                See all
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            {topFavorites.length === 0 ? (
              <p className="text-xs text-[var(--nutrition-pulse-ink-faint)] opacity-80">
                Star foods or dishes to add them here
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topFavorites.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddFood(item)}
                    data-testid={`favorite-pill-${item.id}`}
                    className="h-auto rounded-full bg-white/40 px-3 py-1.5 text-xs font-medium text-[var(--nutrition-pulse-ink)] transition-colors hover:bg-white/60 dark:bg-muted dark:text-foreground dark:hover:bg-secondary"
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Add Recent */}
          {recentFoods.length > 0 && (
            <div data-testid="quick-add-recent" className="mt-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--nutrition-pulse-ink-muted)]">
                Quick Add
              </p>
              <div className="flex flex-wrap gap-2">
                {recentFoods.map((food) => (
                  <Button
                    key={food.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => onQuickAddFood?.(food.name)}
                    data-testid={`quick-add-${food.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    className="h-auto rounded-full bg-white/40 px-3 py-1.5 text-xs font-medium text-[var(--nutrition-pulse-ink)] transition-colors hover:bg-white/60 dark:bg-muted dark:text-foreground dark:hover:bg-secondary"
                  >
                    {food.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
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
