'use client';

import { useDailyNutrition } from '@/hooks/use-daily-nutrition';
import { useWeeklyNutrition } from '@/hooks/use-weekly-nutrition';
import { useNutritionGoals } from '@/hooks/use-nutrition-goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MealTypeLabel } from '@/components/meal-type-label';
import { MACRO_COLORS } from '@/lib/nutrition-constants';
import { Clock, TrendingUp, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// ─── Sub-components ──────────────────────────────────────────────────────────

function MacroRow({
  label,
  current,
  goal,
  unit,
  color,
}: {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
}) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {Math.round(current)}{unit}
          <span className="text-muted-foreground/60"> / {goal}{unit}</span>
        </span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex justify-between items-baseline py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground tabular-nums">
        {value}
        {sub && <span className="font-normal text-muted-foreground ml-1">{sub}</span>}
      </span>
    </div>
  );
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: nutrition, logs, isLoading: nutritionLoading } = useDailyNutrition();
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyNutrition(7);
  const { data: goals, isLoading: goalsLoading } = useNutritionGoals();

  const isLoading = nutritionLoading || goalsLoading || weeklyLoading;

  const effectiveGoals = goals || {
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 65,
    fiber: 30,
    sodium: 2300,
  };

  const todayNutrition = nutrition || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    foodCount: 0,
  };

  const chartData = (weeklyData || []).map(day => ({
    day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    calories: Math.round(day.calories),
  }));

  const avgCalories = weeklyData && weeklyData.length > 0
    ? Math.round(weeklyData.reduce((sum, d) => sum + d.calories, 0) / weeklyData.length)
    : 0;

  const avgProtein = weeklyData && weeklyData.length > 0
    ? Math.round(weeklyData.reduce((sum, d) => sum + d.protein, 0) / weeklyData.length)
    : 0;

  const proteinGoalPercent = effectiveGoals.protein > 0
    ? Math.round((avgProtein / effectiveGoals.protein) * 100)
    : 0;

  const streak = weeklyData?.filter(d => d.calories > 0).length || 0;

  const caloriePercent = effectiveGoals.calories > 0
    ? Math.min(Math.round((todayNutrition.calories / effectiveGoals.calories) * 100), 100)
    : 0;
  const remainingCalories = Math.max(0, effectiveGoals.calories - Math.round(todayNutrition.calories));

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Loading your nutrition data...</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="animate-pulse rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-12 bg-muted rounded w-2/3" />
            <div className="h-1.5 bg-muted rounded-full" />
          </div>
          <div className="lg:col-span-2 animate-pulse rounded-xl border border-border bg-card p-6 space-y-5">
            <div className="h-3 bg-muted rounded w-1/4" />
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-1.5 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentLogs = logs.slice(0, 5);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {(() => {
              const h = new Date().getHours();
              return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
            })()}
          </h1>
          <p className="text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Link
          href="/food-log"
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
        >
          Log Food
        </Link>
      </div>

      {/* Today at a glance: Calories (1/3) + Macros (2/3) */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Calories — primary metric */}
        <div className="flex flex-col justify-between py-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Calories
            </p>
            <p className="text-5xl font-bold tabular-nums text-foreground leading-none">
              {Math.round(todayNutrition.calories).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              of {effectiveGoals.calories.toLocaleString()} goal
            </p>
          </div>
          <div className="mt-8">
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{caloriePercent}%</span>
              <span>
                {remainingCalories > 0
                  ? `${remainingCalories.toLocaleString()} remaining`
                  : 'Goal reached'}
              </span>
            </div>
          </div>
        </div>

        {/* Macros — secondary metrics */}
        <div className="lg:col-span-2 py-2 lg:border-l lg:border-border lg:pl-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
            Macros
          </p>
          <div className="grid gap-4">
            <MacroRow
              label="Protein"
              current={todayNutrition.protein}
              goal={effectiveGoals.protein}
              unit="g"
              color={MACRO_COLORS.protein}
            />
            <MacroRow
              label="Carbohydrates"
              current={todayNutrition.carbs}
              goal={effectiveGoals.carbs}
              unit="g"
              color={MACRO_COLORS.carbs}
            />
            <MacroRow
              label="Fat"
              current={todayNutrition.fat}
              goal={effectiveGoals.fat}
              unit="g"
              color={MACRO_COLORS.fat}
            />
          </div>
        </div>
      </div>

      {/* Chart (2/3) + Secondary stats (1/3) */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Weekly calorie chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">Calorie Intake</span>
              </div>
              <span className="text-sm text-muted-foreground">This week</span>
            </div>
            <div className="h-48" style={{ overflow: 'visible' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--primary)', fillOpacity: 0.08 }}
                    wrapperStyle={{ zIndex: 10 }}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--card-foreground)',
                    }}
                    formatter={(value) => [`${value} cal`, 'Calories']}
                  />
                  <ReferenceLine
                    y={effectiveGoals.calories}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                  />
                  <Bar
                    dataKey="calories"
                    fill="var(--primary)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Secondary stats */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Today
            </p>
            <div className="divide-y divide-border">
              <StatRow
                label="Fiber"
                value={`${Math.round(todayNutrition.fiber)}g`}
                sub={`/ ${effectiveGoals.fiber}g`}
              />
              <StatRow
                label="Sodium"
                value={`${Math.round(todayNutrition.sodium)}mg`}
                sub={`/ ${effectiveGoals.sodium}mg`}
              />
              <StatRow
                label="Sugar"
                value={`${Math.round(todayNutrition.sugar)}g`}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              This Week
            </p>
            <div className="divide-y divide-border">
              <StatRow
                label="Avg Calories"
                value={avgCalories.toLocaleString()}
              />
              <StatRow
                label="Protein Goal"
                value={`${proteinGoalPercent}%`}
              />
              <StatRow
                label="Streak"
                value={streak > 0 ? `${streak} days` : 'Start today'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Foods */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Recent Foods</CardTitle>
          <Link href="/food-log" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <UtensilsCrossed className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <div>
                <p className="font-semibold text-foreground">Start logging your meals</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your macros and daily progress will appear here as you log.
                </p>
              </div>
              <Link
                href="/food-log"
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Log your first meal
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0 hidden sm:flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(log.consumedAt)}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-foreground text-sm truncate">
                        {log.food?.name || 'Unknown Food'}
                      </span>
                      <MealTypeLabel mealType={log.mealType} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground tabular-nums shrink-0 ml-4">
                    {Math.round((log.food?.calories || 0) * log.quantity)} cal
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

