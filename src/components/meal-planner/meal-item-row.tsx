'use client';

import { Utensils } from 'lucide-react';
import type { MealItemDTO } from '@/server/services/diet-plan.service';
import { MACRO_TEXT_COLORS } from '@/lib/nutrition-constants';

interface MealItemRowProps {
  item: MealItemDTO;
}

export function MealItemRow({ item }: MealItemRowProps) {
  const serving = item.altMeasureLabel
    ? item.altMeasureLabel.toUpperCase()
    : `${Math.round(item.quantity)}G`;

  return (
    <>
      {/* Mobile: 3-line layout (no left icon) */}
      <div data-testid={`meal-item-row-${item.id}`} className="md:hidden py-3">
        <p className="text-sm font-semibold text-foreground truncate">{item.foodName}</p>
        <div className="mt-0.5 flex items-center justify-between gap-3">
          <p className="min-w-0 flex-1 text-xs text-muted-foreground uppercase tracking-wide truncate">
            {serving}
          </p>
          <div className="shrink-0 flex items-center gap-2 text-xs font-medium tabular-nums">
            <span className="text-foreground">{Math.round(item.calories)} kcal</span>
            <span className={MACRO_TEXT_COLORS.protein}>{Math.round(item.protein)}P</span>
            <span className={MACRO_TEXT_COLORS.carbs}>{Math.round(item.carbs)}C</span>
            <span className={MACRO_TEXT_COLORS.fat}>{Math.round(item.fat)}F</span>
          </div>
        </div>
      </div>

      {/* Desktop: tabular layout (keeps icon + macro columns) */}
      <div data-testid={`meal-item-row-${item.id}`} className="hidden md:flex items-center gap-3 py-3">
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          {item.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnail} alt={item.foodName} className="w-5 h-5 rounded object-cover" />
          ) : (
            <Utensils className="h-3.5 w-3.5 text-muted-foreground/40" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{item.foodName}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{serving}</p>
        </div>

        <div className="w-px h-8 bg-border shrink-0" />

        <div className="flex items-center shrink-0">
          <div className="flex flex-col items-center w-14 text-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">KCAL</span>
            <span className="text-sm font-semibold text-foreground">{Math.round(item.calories)}</span>
          </div>
          <div className="flex flex-col items-center w-12 text-center">
            <span className={`text-[10px] ${MACRO_TEXT_COLORS.protein} uppercase tracking-wider leading-tight`}>PROT</span>
            <span className={`text-sm font-semibold ${MACRO_TEXT_COLORS.protein}`}>{Math.round(item.protein)}g</span>
          </div>
          <div className="flex flex-col items-center w-12 text-center">
            <span className={`text-[10px] ${MACRO_TEXT_COLORS.carbs} uppercase tracking-wider leading-tight`}>CARB</span>
            <span className={`text-sm font-semibold ${MACRO_TEXT_COLORS.carbs}`}>{Math.round(item.carbs)}g</span>
          </div>
          <div className="flex flex-col items-center w-10 text-center">
            <span className={`text-[10px] ${MACRO_TEXT_COLORS.fat} uppercase tracking-wider leading-tight`}>FAT</span>
            <span className={`text-sm font-semibold ${MACRO_TEXT_COLORS.fat}`}>{Math.round(item.fat)}g</span>
          </div>
        </div>
      </div>
    </>
  );
}
