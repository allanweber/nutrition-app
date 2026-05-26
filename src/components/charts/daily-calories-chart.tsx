'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { summarizeChartSeries } from '@/lib/chart-a11y';
import { CHART_HEX_COLORS } from '@/lib/nutrition-constants';
import { DailyNutritionSummary } from '@/types/food';
import type { NutritionGoals } from '@/types/goals';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DailyCaloriesChartProps {
  data: DailyNutritionSummary[];
  goals?: NutritionGoals | null;
}

export function DailyCaloriesChart({ data, goals }: DailyCaloriesChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calories This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    calories: item.calories,
  }));

  const goalLine = goals?.calories || 2000;

  const chartAriaLabel = `${summarizeChartSeries(
    chartData.map((d) => ({ label: d.date, value: d.calories })),
    'Daily calories',
    'kcal',
  )}. Goal line ${goalLine} kcal.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calories This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <div role="img" aria-label={chartAriaLabel}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} aria-hidden>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <ReferenceLine
                y={goalLine}
                stroke={CHART_HEX_COLORS.goalLine}
                strokeDasharray="5 5"
                label={`Goal: ${goalLine}`}
              />
              <Line
                type="monotone"
                dataKey="calories"
                stroke={CHART_HEX_COLORS.calories}
                strokeWidth={2}
                dot={{ fill: CHART_HEX_COLORS.calories, strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
