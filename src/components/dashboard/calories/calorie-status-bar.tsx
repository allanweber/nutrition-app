'use client';

/** Fixed locale so SSR markup matches the browser (default locale differs Node vs client). */
const CAL_NUMBER_LOCALE = 'en-US';

function formatCalories(n: number): string {
  return Math.round(n).toLocaleString(CAL_NUMBER_LOCALE);
}

interface CalorieStatusBarProps {
  caloriesConsumed: number;
  calorieGoal: number;
  /** kcal remaining (negative = over goal) */
  remaining?: number;
}

function pctOnScale(value: number, scaleMax: number) {
  if (scaleMax <= 0) return 0;
  return Math.min(100, Math.max(0, (value / scaleMax) * 100));
}

export function CalorieStatusBar({
  caloriesConsumed,
  calorieGoal,
  remaining,
}: CalorieStatusBarProps) {
  if (calorieGoal <= 0) {
    return null;
  }

  const rangeMin = calorieGoal * 0.9;
  const rangeMax = calorieGoal * 1.1;
  const scaleMax = Math.max(
    Math.ceil(calorieGoal * 1.35),
    Math.ceil(caloriesConsumed * 1.05),
    1,
  );

  const consumedPct = pctOnScale(caloriesConsumed, scaleMax);
  const rangeLeftPct = pctOnScale(rangeMin, scaleMax);
  const rangeWidthPct = Math.max(0, pctOnScale(rangeMax, scaleMax) - rangeLeftPct);
  const goalPct = pctOnScale(calorieGoal, scaleMax);

  const rangeLabel = `${formatCalories(rangeMin)}–${formatCalories(rangeMax)}`;

  const overTarget =
    remaining !== undefined && remaining < 0
      ? `${formatCalories(Math.abs(remaining))} kcal over target`
      : null;

  return (
    <section
      className="w-full min-w-0 space-y-3"
      aria-label={`Calories ${formatCalories(caloriesConsumed)} of ${formatCalories(calorieGoal)} kcal target; acceptable band ${rangeLabel} kcal (±10%); scale 0 to ${formatCalories(scaleMax)}`}
    >
      {/* Header: consumed / target as primary title (left); section label (right) */}
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="min-w-0 flex-1 text-left text-xl font-headline font-extrabold tabular-nums tracking-tight text-foreground sm:text-2xl">
          <span className="text-foreground">{formatCalories(caloriesConsumed)}</span>
          <span className="mx-1 font-semibold text-muted-foreground">/</span>
          <span className="text-foreground/90">{formatCalories(calorieGoal)}</span>
          <span className="ml-1.5 text-base font-semibold text-muted-foreground sm:text-lg">kcal</span>
        </h2>
        <span className="shrink-0 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:text-xs">
          Calories
        </span>
      </div>

      {overTarget && (
        <p className="text-sm font-medium tabular-nums text-destructive">{overTarget}</p>
      )}

      {/* Bar: target zone → fill (primary) → goal tick */}
      <div className="relative py-1">
        <div className="relative h-7 w-full overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border/50 sm:h-8">
          {/* Target zone ±10% — accent/cyan band, clearly separate from primary (green) fill */}
          <div
            className="pointer-events-none absolute inset-y-0 z-[1] rounded-full bg-gradient-to-r from-accent/50 via-accent/65 to-accent/50 ring-1 ring-inset ring-accent-foreground/15 dark:from-accent/55 dark:via-accent/75 dark:to-accent/55"
            style={{
              left: `${rangeLeftPct}%`,
              width: `${rangeWidthPct}%`,
            }}
            aria-hidden
          />
          <div
            className="absolute left-0 top-0 z-[2] h-full rounded-full bg-gradient-to-r from-primary to-primary/85 shadow-[0_0_14px_color-mix(in_oklab,var(--primary)_38%,transparent)] transition-[width] duration-500 ease-out"
            style={{
              width: `${consumedPct}%`,
              maxWidth: '100%',
            }}
          />
          {/* Goal tick — readable on green fill, still inside the pill */}
          <div
            className="pointer-events-none absolute inset-y-0.5 z-[3] w-0.5 -translate-x-1/2 rounded-full bg-foreground/75 shadow-[0_0_0_1px_color-mix(in_oklab,var(--background)_55%,transparent)] dark:bg-foreground/85 dark:shadow-[0_0_0_1px_color-mix(in_oklab,var(--background)_35%,transparent)]"
            style={{ left: `${goalPct}%` }}
            aria-hidden
          />
        </div>
      </div>

      <div className="flex items-start justify-between gap-2 text-[11px] font-medium tabular-nums text-muted-foreground sm:text-xs">
        <span>0</span>
        <span className="max-w-[55%] shrink text-center leading-snug">
          Target zone ±10%
        </span>
        <span>{formatCalories(scaleMax)}</span>
      </div>
    </section>
  );
}
