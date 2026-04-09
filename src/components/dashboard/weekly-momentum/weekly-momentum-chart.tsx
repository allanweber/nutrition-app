'use client';

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { type WeeklyDay } from '@/server/services/dashboard.service';
import { MACRO_HEX_COLORS } from '@/lib/nutrition-constants';

interface MomentumTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: WeeklyDay & { value: number } }>;
}

function MomentumTooltip({ active, payload }: MomentumTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0]!.payload as WeeklyDay & { value: number };
  if (!d.hasData) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1.5">
        {d.caloriesConsumed.toLocaleString()} <span className="font-normal text-muted-foreground">kcal</span>
      </p>
      <div className="flex flex-col gap-1">
        <MacroRow label="Protein" value={d.protein} color={MACRO_HEX_COLORS.protein} />
        <MacroRow label="Carbs"   value={d.carbs}   color={MACRO_HEX_COLORS.carbs} />
        <MacroRow label="Fat"     value={d.fat}     color={MACRO_HEX_COLORS.fat} />
      </div>
    </div>
  );
}

function MacroRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium text-foreground">{value}g</span>
    </div>
  );
}

interface WeeklyMomentumChartProps {
  days: WeeklyDay[];
}

export function WeeklyMomentumChart({ days }: WeeklyMomentumChartProps) {
  const chartData = days.map((d) => ({
    ...d,
    value: Math.round(Math.min(d.adherenceRatio, 1) * 100),
  }));

  return (
    <div className="flex flex-col h-full gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Insights
        </p>
        <h2 className="text-2xl font-extrabold font-headline text-foreground">
          Weekly Momentum
        </h2>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
            barCategoryGap="30%"
          >
            <Tooltip
              content={<MomentumTooltip />}
              cursor={{ fill: 'var(--color-secondary)', radius: 4 }}
            />
            <YAxis domain={[0, 100]} hide />
            <XAxis
              dataKey="dayLabel"
              axisLine={false}
              tickLine={false}
              tick={({ x, y, payload, index }) => {
                const isCurrentDay = chartData[index]?.isCurrentDay ?? false;
                return (
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={600}
                    fill={
                      isCurrentDay
                        ? 'var(--color-primary)'
                        : 'var(--color-muted-foreground)'
                    }
                  >
                    {payload.value}
                  </text>
                );
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} minPointSize={3}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.isCurrentDay
                      ? 'var(--color-primary)'
                      : entry.hasData
                        ? 'color-mix(in oklch, var(--color-primary) 35%, transparent)'
                        : 'var(--color-secondary)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
