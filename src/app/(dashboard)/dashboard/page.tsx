'use client';

import { useDailyNutrition } from '@/hooks/use-daily-nutrition';
import { useNutritionGoals } from '@/hooks/use-nutrition-goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

function MacroCard({
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
  const isOver = current > goal;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm ${isOver ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
          {Math.round(current)}{unit} / {goal}{unit}
        </span>
      </div>
      <Progress value={percentage} className={`h-2 ${color}`} />
    </div>
  );
}

function CalorieRing({
  consumed,
  goal,
}: {
  consumed: number;
  goal: number;
}) {
  const percentage = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
  const remaining = Math.max(goal - consumed, 0);
  const isOver = consumed > goal;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r="45"
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r="45"
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            className={isOver ? 'text-red-500' : 'text-green-500'}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{Math.round(consumed)}</span>
          <span className="text-xs text-gray-500">kcal</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        {isOver ? (
          <span className="text-red-600 font-medium">
            {Math.round(consumed - goal)} over goal
          </span>
        ) : (
          <span className="text-gray-600">
            {Math.round(remaining)} remaining
          </span>
        )}
      </div>
    </div>
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

export default function DashboardPage() {
  const { data: nutrition, logs, isLoading: nutritionLoading } = useDailyNutrition();
  const { data: goals, isLoading: goalsLoading } = useNutritionGoals();

  const isLoading = nutritionLoading || goalsLoading;

  // Default goals if none set
  const effectiveGoals = goals || {
    calories: 2000,
    protein: 150,
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Loading your nutrition data...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Calories Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Calories</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CalorieRing
              consumed={todayNutrition.calories}
              goal={effectiveGoals.calories}
            />
          </CardContent>
        </Card>

        {/* Macros Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Macronutrients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MacroCard
              label="Protein"
              current={todayNutrition.protein}
              goal={effectiveGoals.protein}
              unit="g"
              color="[&>[data-slot=progress-indicator]]:bg-blue-500"
            />
            <MacroCard
              label="Carbohydrates"
              current={todayNutrition.carbs}
              goal={effectiveGoals.carbs}
              unit="g"
              color="[&>[data-slot=progress-indicator]]:bg-amber-500"
            />
            <MacroCard
              label="Fat"
              current={todayNutrition.fat}
              goal={effectiveGoals.fat}
              unit="g"
              color="[&>[data-slot=progress-indicator]]:bg-rose-500"
            />
            <MacroCard
              label="Fiber"
              current={todayNutrition.fiber}
              goal={effectiveGoals.fiber}
              unit="g"
              color="[&>[data-slot=progress-indicator]]:bg-green-500"
            />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today&apos;s Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{todayNutrition.foodCount}</div>
                <div className="text-xs text-gray-500">Foods Logged</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
                <div className="text-xs text-gray-500">Entries</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{Math.round(todayNutrition.sodium)}</div>
                <div className="text-xs text-gray-500">Sodium (mg)</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{Math.round(todayNutrition.sugar)}</div>
                <div className="text-xs text-gray-500">Sugar (g)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Foods */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Foods</CardTitle>
            <Link href="/food-log" className="text-sm text-blue-600 hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No foods logged today</p>
                <Link href="/food-log" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                  Start logging
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {log.food?.name || 'Unknown Food'}
                        </span>
                        <MealTypeLabel mealType={log.mealType} />
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.quantity} {log.servingUnit || log.food?.servingUnit || 'serving'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {Math.round((log.food?.calories || 0) * log.quantity)} kcal
                      </div>
                      <div className="text-xs text-gray-500">
                        P: {Math.round((log.food?.protein || 0) * log.quantity)}g |
                        C: {Math.round((log.food?.carbs || 0) * log.quantity)}g |
                        F: {Math.round((log.food?.fat || 0) * log.quantity)}g
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/food-log"
              className="block w-full p-3 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Log Food
            </Link>
            <Link
              href="/goals"
              className="block w-full p-3 text-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Update Goals
            </Link>
            <Link
              href="/foods/search"
              className="block w-full p-3 text-center bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Search Foods
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
