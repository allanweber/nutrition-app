'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MacroPieChartProps {
  protein: number;
  carbs: number;
  fat: number;
}

const COLORS = {
  protein: '#3b82f6', // blue-500
  carbs: '#10b981', // green-500
  fat: '#f59e0b', // amber-500
};

export function MacroPieChart({ protein, carbs, fat }: MacroPieChartProps) {
  const data = [
    { name: 'Protein', value: protein, color: COLORS.protein },
    { name: 'Carbs', value: carbs, color: COLORS.carbs },
    { name: 'Fat', value: fat, color: COLORS.fat },
  ].filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Macronutrient Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = protein + carbs + fat;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Macronutrient Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${Math.round((entry.value / total) * 100)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => `${value}g`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.protein }} />
            <span>Protein: {protein}g</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.carbs }} />
            <span>Carbs: {carbs}g</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.fat }} />
            <span>Fat: {fat}g</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}