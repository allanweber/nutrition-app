'use client';

import { useDailyNutrition } from '@/hooks/use-daily-nutrition';
import { useWeeklyNutrition } from '@/hooks/use-weekly-nutrition';
import { useNutritionGoals } from '@/hooks/use-nutrition-goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Beef, Wheat, Droplets, Apple, Clock, TrendingUp, Target, Award } from 'lucide-react';
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

function MacroCard({
  icon: Icon,
  label,
  current,
  goal,
  unit,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
  bgColor: string;
}) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">{label}</h3>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="flex items-end space-x-2">
          <span className="text-3xl font-bold text-foreground">
            {Math.round(current)}{unit}
          </span>
          <span className="text-muted-foreground mb-1">/ {goal}{unit}</span>
        </div>
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${bgColor} rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MealTypeLabel({ mealType }: { mealType: string }) {
  const colors: Record<string, string> = {
    breakfast: 'bg-yellow-100 text-yellow-800',
    lunch: 'bg-blue-100 text-blue-800',
    dinner: 'bg-purple-100 text-purple-800',
    snack: 'bg-green-100 text-green-800',
  };
  return (
    <Badge variant="secondary" className={colors[mealType] || 'bg-gray-100 text-gray-800'}>
      {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
    </Badge>
  );
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

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

  // Calculate weekly stats for analytics
  const chartData = (weeklyData || []).map(day => ({
    day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    calories: Math.round(day.calories),
    protein: Math.round(day.protein),
    carbs: Math.round(day.carbs),
    fat: Math.round(day.fat),
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Loading your nutrition data...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5">
                <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-muted rounded w-2/3 mb-3"></div>
                <div className="h-2 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const recentLogs = logs.slice(0, 5);

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

      {/* Main Macro Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <MacroCard
          icon={Flame}
          label="Calories"
          current={todayNutrition.calories}
          goal={effectiveGoals.calories}
          unit=""
          color="text-orange-500"
          bgColor="bg-gradient-to-r from-emerald-500 to-teal-500"
        />
        <MacroCard
          icon={Beef}
          label="Protein"
          current={todayNutrition.protein}
          goal={effectiveGoals.protein}
          unit="g"
          color="text-red-500"
          bgColor="bg-red-500"
        />
        <MacroCard
          icon={Wheat}
          label="Carbs"
          current={todayNutrition.carbs}
          goal={effectiveGoals.carbs}
          unit="g"
          color="text-amber-500"
          bgColor="bg-amber-500"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                <Droplets className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fat</p>
                <p className="text-lg font-semibold text-foreground">
                  {Math.round(todayNutrition.fat)}g <span className="text-sm font-normal text-muted-foreground">/ {effectiveGoals.fat}g</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Apple className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fiber</p>
                <p className="text-lg font-semibold text-foreground">
                  {Math.round(todayNutrition.fiber)}g <span className="text-sm font-normal text-muted-foreground">/ {effectiveGoals.fiber}g</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-500 font-bold text-sm">Na</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sodium</p>
                <p className="text-lg font-semibold text-foreground">
                  {Math.round(todayNutrition.sodium)}mg
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-500 font-bold text-sm">S</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sugar</p>
                <p className="text-lg font-semibold text-foreground">
                  {Math.round(todayNutrition.sugar)}g
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Calories</div>
                <div className="flex items-end space-x-2">
                  <span className="text-xl font-bold text-foreground">{avgCalories.toLocaleString()}</span>
                  <span className="text-xs text-emerald-500 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" />+3%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Protein Goal</div>
                <div className="flex items-end space-x-2">
                  <span className="text-xl font-bold text-foreground">{proteinGoalPercent}%</span>
                  <span className="text-xs text-emerald-500 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" />+8%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Streak</div>
                <div className="flex items-end space-x-2">
                  <span className="text-xl font-bold text-foreground">{streak} days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calorie Intake Chart */}
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <span className="font-semibold text-foreground">Calorie Intake</span>
            </div>
            <span className="text-sm text-muted-foreground">This week</span>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`${value} cal`, 'Calories']}
                />
                <Area
                  type="monotone"
                  dataKey="calories"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#calorieGradient)"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#10b981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Daily Calories</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 border-t-2 border-dashed border-gray-400" />
              <span className="text-muted-foreground">Goal: {effectiveGoals.calories.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Foods */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Recent Foods</CardTitle>
          <Link href="/food-log" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">No foods logged today</p>
              <Link href="/food-log" className="text-primary hover:underline text-sm">
                Start logging your meals
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(log.consumedAt)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        {log.food?.name || 'Unknown Food'}
                      </span>
                      <MealTypeLabel mealType={log.mealType} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-foreground">
                      {Math.round((log.food?.calories || 0) * log.quantity)} cal
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/food-log"
          className="flex items-center justify-center p-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
        >
          Log Food
        </Link>
        <Link
          href="/goals"
          className="flex items-center justify-center p-4 bg-card border border-border text-foreground rounded-xl hover:bg-muted transition-colors font-medium"
        >
          Update Goals
        </Link>
      </div>
    </div>
  );
}
