'use client';

import { useLayoutEffect, useMemo, useState } from 'react';

import type { NutritionSourceFood } from '@/lib/nutrition-sources/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, Plus } from 'lucide-react';

import { MacroBadges, type MacroRow } from './macro-badges';
import { ServingSelector } from './serving-selector';
import type { FoodSelection, MacroSummary } from './types';
import {
  asNumber,
  buildServingOptions,
  roundTo,
  safeGrams,
} from './utilities';

export default function SelectedFoodCard(props: {
  food: NutritionSourceFood;
  isBusy?: boolean;
  actionLabel?: string;
  onCancel: () => void;
  onConfirm: (selection: FoodSelection) => void | Promise<void>;
}) {
  const {
    food,
    isBusy = false,
    actionLabel = 'Add to Log',
    onCancel,
    onConfirm,
  } = props;

  const { options, defaultId } = useMemo(() => buildServingOptions(food), [food]);

  const foodUrl = food.source === 'database' ? `/food/db-${food.id}` : `/food/${food.sourceId}`;

  const [selectedOptionId, setSelectedOptionId] = useState<string>(defaultId);

  useLayoutEffect(() => {
    setSelectedOptionId(defaultId);
  }, [defaultId]);

  const selectedOption = useMemo(
    () => options.find((o) => o.id === selectedOptionId) ?? options.find((o) => o.id === defaultId) ?? options[0],
    [defaultId, options, selectedOptionId],
  );

  const selectedServingGrams = safeGrams(selectedOption?.grams);
  const selectedServingQty = selectedOption?.qty ?? 1;

  const [quantity, setQuantity] = useState<number>(() => selectedServingQty);

  useLayoutEffect(() => {
    setQuantity(selectedServingQty);
  }, [selectedServingQty, selectedOptionId]);

  const grams = (quantity / selectedServingQty) * selectedServingGrams;
  const multiplier = selectedServingGrams > 0 ? grams / selectedServingGrams : 1;

  const macros: MacroSummary = useMemo(
    () => ({
      calories: Math.round(asNumber(food.calories) * multiplier),
      fat: roundTo(asNumber(food.fat) * multiplier, 1),
      carbs: roundTo(asNumber(food.carbs) * multiplier, 1),
      protein: roundTo(asNumber(food.protein) * multiplier, 1),
      fiber:
        food.fiber != null
          ? roundTo(asNumber(food.fiber) * multiplier, 1)
          : undefined,
      sugar:
        food.sugar != null
          ? roundTo(asNumber(food.sugar) * multiplier, 1)
          : undefined,
      sodium:
        food.sodium != null
          ? Math.round(asNumber(food.sodium) * multiplier)
          : undefined,
    }),
    [
      food.calories,
      food.carbs,
      food.fat,
      food.fiber,
      food.protein,
      food.sodium,
      food.sugar,
      multiplier,
    ],
  );

  const selection: FoodSelection = useMemo(
    () => ({
      grams,
      servingUnit: selectedOption?.measure ?? food.servingUnit,
      quantity: String(roundTo(quantity, 2)),
      macros,
      servingLabel:
        selectedOption?.label ?? `${food.servingQty ?? 1} ${food.servingUnit}`,
    }),
    [
      food.servingQty,
      food.servingUnit,
      grams,
      macros,
      quantity,
      selectedOption?.label,
      selectedOption?.measure,
    ],
  );

  const macroRow: MacroRow = useMemo(
    () => ({
      calories: selection.macros.calories,
      protein: selection.macros.protein,
      carbs: selection.macros.carbs,
      fat: selection.macros.fat,
    }),
    [selection.macros],
  );

  const brandName = food.brandName?.trim();

  return (
    <div className="space-y-4" data-testid="selected-food-card">
      <div className="min-w-0">
        <Link
          href={foodUrl}
          className="block truncate text-lg font-semibold text-foreground hover:underline hover:text-primary transition-colors"
        >
          {food.name}
        </Link>
        {brandName ? (
          <div className="truncate text-xs text-muted-foreground">{brandName}</div>
        ) : null}
        <MacroBadges macros={macroRow} />
      </div>

      <div className="w-full space-y-4">
        <ServingSelector
          options={options}
          selectedOptionId={selectedOptionId}
          quantity={quantity}
          selectedMeasure={selectedOption?.measure ?? food.servingUnit}
          onOptionChange={setSelectedOptionId}
          onQuantityChange={setQuantity}
          showWillLog={true}
          willLogQuantity={selection.quantity}
          willLogUnit={selection.servingUnit}
        />

        <div className="flex w-full gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void onConfirm(selection)}
            disabled={isBusy}
            className="flex-1"
            data-testid="add-food-button"
          >
            {isBusy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Working...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {actionLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
