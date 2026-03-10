'use client';
import type { NutritionSourceFood } from '@/lib/nutrition-sources/types';
import { MacroBadges, MacroRow } from './macro-badges';
import { Per100g } from './types';
import Image from 'next/image';
import Link from 'next/link';

const toPer100g = (food: NutritionSourceFood): Per100g | null => {
    const grams = food.servingWeightGrams;
    if (!grams || grams <= 0) return null;
    const factor = 100 / grams;

    return {
      calories: Number(food.calories) * factor,
      protein: Number(food.protein) * factor,
      carbs: Number(food.carbs) * factor,
      fat: Number(food.fat) * factor,
      sodium: food.sodium != null ? Number(food.sodium) * factor : undefined,
    };
  };

export function FoodOption({
  food,
  index,
  selectFood,
}: {
  food: NutritionSourceFood;
  index: number;
  selectFood: (food: NutritionSourceFood) => void;
}) {
  const foodUrl = food.source === 'database' ? `/food/db-${food.id}` : `/food/${food.sourceId}`;
  const p100 = toPer100g(food);

  const macros: MacroRow = {
    calories: p100 ? p100.calories : Number(food.calories),
    protein: p100 ? p100.protein : Number(food.protein),
    carbs: p100 ? p100.carbs : Number(food.carbs),
    fat: p100 ? p100.fat : Number(food.fat),
  };

  const subtitle = (() => {
    const brandName = food.brandName?.trim();
    const servingLabel = p100
      ? '100 g'
      : `${food.servingQty ?? 1}${food.servingUnit ? ` ${food.servingUnit}` : ''}`;

    if (brandName) return `${brandName} · ${servingLabel}`;
    if (p100) return servingLabel;
    return `per serving · ${servingLabel}`;
  })();

  return (
    <>
      <button
        id={`food-option-${food.source}-${food.sourceId}`}
        type="button"
        role="option"
        data-testid={`food-result-${index}`}
        className="w-full mb-1 rounded-lg p-3 text-left transition-colors hover:bg-muted/80"
        onClick={() => selectFood(food)}
      >
        <div className="grid grid-cols-[44px_1fr] gap-4">
          <div className="flex flex-col items-center justify-center">
            {food.photo?.thumb ? (
              <Image
                src={food.photo.thumb}
                alt={food.name}
                className="h-11 w-11 rounded object-cover"
                loading="lazy"
                width={44}
                height={44}
              />
            ) : (
              <div className="h-11 w-11 rounded bg-muted" />
            )}
          </div>

          <div className="min-w-0">
            <Link
              href={foodUrl}
              className="truncate text-sm font-semibold text-foreground hover:underline hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {food.name}
            </Link>
            <div className="truncate text-xs text-muted-foreground">
              {subtitle}
            </div>
            <MacroBadges macros={macros} />
          </div>
        </div>
      </button>
    </>
  );
}
