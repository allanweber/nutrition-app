'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { summarizeChartSeries } from '@/lib/chart-a11y';
import { CHART_HEX_COLORS, MACRO_HEX_COLORS } from '@/lib/nutrition-constants';
import { DailyNutritionSummary } from '@/types/food';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface WeeklyTrendChartProps {
  data: DailyNutritionSummary[];
  metric: 'calories' | 'protein' | 'carbs' | 'fat';
}

const METRICS = {
  calories: { label: 'Calories', color: CHART_HEX_COLORS.calories, unit: 'kcal' },
  protein: { label: 'Protein', color: MACRO_HEX_COLORS.protein, unit: 'g' },
  carbs: { label: 'Carbs', color: MACRO_HEX_COLORS.carbs, unit: 'g' },
  fat: { label: 'Fat', color: MACRO_HEX_COLORS.fat, unit: 'g' },
} as const;

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

  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    value: item[metric],
  }));

  const chartAriaLabel = summarizeChartSeries(
    chartData.map((d) => ({ label: d.date, value: d.value })),
    config.label,
    config.unit,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.label} Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div role="img" aria-label={chartAriaLabel}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} aria-hidden>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={config.color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
