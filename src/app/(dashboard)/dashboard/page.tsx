'use client';

import { useDailyNutrition } from '@/hooks/use-daily-nutrition';
import { useWeeklyNutrition } from '@/hooks/use-weekly-nutrition';
import { useNutritionGoals } from '@/hooks/use-nutrition-goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MealTypeLabel } from '@/components/meal-type-label';
import { MACRO_COLORS } from '@/lib/nutrition-constants';
import { Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Link
          href="/food-log"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          + Log Food
        </Link>
      </div>

      {/* Today at a glance: Calories (1/3) + Macros (2/3) */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Calories — primary metric */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Calories Today
            </p>
            <p className="text-5xl font-bold tabular-nums text-foreground leading-none">
              {Math.round(todayNutrition.calories).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              of {effectiveGoals.calories.toLocaleString()} goal
            </p>
          </div>
          <div className="mt-8">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
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
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'hsl(var(--card-foreground))',
                    }}
                    formatter={(value) => [`${value} cal`, 'Calories']}
                  />
                  <Area
                    type="monotone"
                    dataKey="calories"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#calorieGradient)"
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
                  />
                </AreaChart>
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
              <p className="text-sm font-medium text-foreground">No foods logged today</p>
              <p className="text-sm text-muted-foreground">
                Log your first meal to see macros and daily progress.
              </p>
              <Link
                href="/food-log"
                className="inline-block text-sm text-primary font-medium hover:underline"
              >
                Log a meal &rarr;
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

