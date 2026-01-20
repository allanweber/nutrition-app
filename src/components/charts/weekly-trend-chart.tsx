'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyNutritionSummary } from '@/types/nutritionix';

interface WeeklyTrendChartProps {
  data: DailyNutritionSummary[];
  metric: 'calories' | 'protein' | 'carbs' | 'fat';
}

const METRICS = {
  calories: { label: 'Calories', color: '#8b5cf6' },
  protein: { label: 'Protein (g)', color: '#3b82f6' },
  carbs: { label: 'Carbs (g)', color: '#10b981' },
  fat: { label: 'Fat (g)', color: '#f59e0b' },
};

export function WeeklyTrendChart({ data, metric }: WeeklyTrendChartProps) {
  const config = METRICS[metric];

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{config.label} Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }),
    value: item[metric],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.label} Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <Tooltip />
            <Bar 
              dataKey="value" 
              fill={config.color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}