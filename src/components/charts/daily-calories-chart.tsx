'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyNutritionSummary, NutritionGoals } from '@/types/food';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calories This Week</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip />
            <ReferenceLine
              y={goalLine}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={`Goal: ${goalLine}`}
            />
            <Line
              type="monotone"
              dataKey="calories"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
