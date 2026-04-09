'use client';

import { Utensils } from 'lucide-react';
import type { MealItemDTO } from '@/server/services/diet-plan.service';

interface MealItemRowProps {
  item: MealItemDTO;
}

export function MealItemRow({ item }: MealItemRowProps) {
  const serving = item.altMeasureLabel
    ? item.altMeasureLabel.toUpperCase()
    : `${Math.round(item.quantity)}G`;

  return (
    <div data-testid={`meal-item-row-${item.id}`} className="flex items-center gap-3 py-3">
      {/* Icon */}
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail} alt={item.foodName} className="w-5 h-5 rounded object-cover" />
        ) : (
          <Utensils className="h-3.5 w-3.5 text-muted-foreground/40" />
        )}
      </div>

      {/* Name + serving */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{item.foodName}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{serving}</p>
      </div>

      {/* Vertical divider */}
      <div className="w-px h-8 bg-border shrink-0" />

      {/* Macro columns */}
      <div className="flex items-center shrink-0">
        <div className="flex flex-col items-center w-14 text-center">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">KCAL</span>
          <span className="text-sm font-semibold text-foreground">{Math.round(item.calories)}</span>
        </div>
        <div className="flex flex-col items-center w-12 text-center">
          <span className="text-[10px] text-rose-500 uppercase tracking-wider leading-tight">PROT</span>
          <span className="text-sm font-semibold text-rose-500">{Math.round(item.protein)}g</span>
        </div>
        <div className="flex flex-col items-center w-12 text-center">
          <span className="text-[10px] text-amber-500 uppercase tracking-wider leading-tight">CARB</span>
          <span className="text-sm font-semibold text-amber-500">{Math.round(item.carbs)}g</span>
        </div>
        <div className="flex flex-col items-center w-10 text-center">
          <span className="text-[10px] text-sky-500 uppercase tracking-wider leading-tight">FAT</span>
          <span className="text-sm font-semibold text-sky-500">{Math.round(item.fat)}g</span>
        </div>
      </div>
    </div>
  );
}
