'use client';

import { Utensils } from 'lucide-react';
import type { MealItemDTO } from '@/server/services/diet-plan.service';

interface MealItemRowProps {
  item: MealItemDTO;
}

export function MealItemRow({ item }: MealItemRowProps) {
  const serving = item.altMeasureLabel ?? `${Math.round(item.quantity)}g`;

  return (
    <div className="flex items-center gap-3 py-1.5">
      {/* Thumbnail */}
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail} alt={item.foodName} className="w-full h-full object-cover" />
        ) : (
          <Utensils className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Name + serving */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.foodName}</p>
        <p className="text-xs text-on-surface-variant">{serving}</p>
      </div>

      {/* Macros */}
      <div className="flex items-center gap-2 shrink-0 text-xs">
        <span className="text-foreground font-medium">{Math.round(item.calories)} kcal</span>
        <span className="text-rose-500">{Math.round(item.protein)}g P</span>
        <span className="text-amber-500">{Math.round(item.carbs)}g C</span>
        <span className="text-sky-500">{Math.round(item.fat)}g F</span>
      </div>
    </div>
  );
}
