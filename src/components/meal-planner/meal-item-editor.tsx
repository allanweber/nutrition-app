'use client';

import { Utensils, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuantityUnitInput } from '@/components/quantity-unit-input';
import type { QuantityMeasure } from '@/components/quantity-unit-input';
import { MACRO_TEXT_COLORS } from '@/lib/nutrition-constants';

export interface LocalMealItem {
  /** undefined = new item not yet saved */
  id?: string;
  foodId: string;
  foodName: string;
  brandName: string | null;
  thumbnail: string | null;
  /** Nutrition per 100g */
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  /** Available measures built from food detail servings */
  measures: QuantityMeasure[];
  selectedMeasureId: string;
  /** Display quantity (in the selected measure unit) */
  displayQty: number;
  /** Computed: displayQty × measure.weightGrams */
  quantityGrams: number;
}

interface MealItemEditorProps {
  item: LocalMealItem;
  index?: number;
  onChange: (updated: LocalMealItem) => void;
  onRemove: () => void;
}

export function MealItemEditor({ item, index, onChange, onRemove }: MealItemEditorProps) {
  const kcal = Math.round((item.caloriesPer100g / 100) * item.quantityGrams);
  const protein = Math.round((item.proteinPer100g / 100) * item.quantityGrams);
  const carbs = Math.round((item.carbsPer100g / 100) * item.quantityGrams);
  const fat = Math.round((item.fatPer100g / 100) * item.quantityGrams);

  function handleMeasureChange(id: string, newQty: number) {
    const measure = item.measures.find((m) => m.id === id) ?? item.measures[0];
    onChange({
      ...item,
      selectedMeasureId: id,
      displayQty: newQty,
      quantityGrams: newQty * measure.weightGrams,
    });
  }

  function handleQtyChange(qty: number) {
    const measure = item.measures.find((m) => m.id === item.selectedMeasureId) ?? item.measures[0];
    onChange({
      ...item,
      displayQty: qty,
      quantityGrams: qty * measure.weightGrams,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 border rounded-xl bg-background">
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail} alt={item.foodName} className="w-full h-full object-cover" />
        ) : (
          <Utensils className="h-4 w-4 text-primary" />
        )}
      </div>

      {/* Food name + macros — grows to push quantity+remove to the right on wide screens */}
      <div className="flex-1 min-w-32">
        <p className="text-sm font-semibold text-foreground truncate leading-tight">{item.foodName}</p>
        {item.brandName && (
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{item.brandName}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span>
            <span className="text-[9px] font-bold uppercase text-muted-foreground mr-0.5">KCAL</span>
            <span className="text-xs font-bold text-foreground">{kcal}</span>
          </span>
          <span>
            <span className="text-[9px] font-bold uppercase text-muted-foreground mr-0.5">PROT</span>
            <span className={`text-xs font-bold ${MACRO_TEXT_COLORS.protein}`}>{protein}g</span>
          </span>
          <span>
            <span className="text-[9px] font-bold uppercase text-muted-foreground mr-0.5">CARB</span>
            <span className={`text-xs font-bold ${MACRO_TEXT_COLORS.carbs}`}>{carbs}g</span>
          </span>
          <span>
            <span className="text-[9px] font-bold uppercase text-muted-foreground mr-0.5">FAT</span>
            <span className={`text-xs font-bold ${MACRO_TEXT_COLORS.fat}`}>{fat}g</span>
          </span>
        </div>
      </div>

      {/* Quantity + unit selector — fixed width, wraps to new line on small screens */}
      <div className="w-56 shrink-0">
        <QuantityUnitInput
          measures={item.measures}
          selectedMeasureId={item.selectedMeasureId}
          quantity={item.displayQty}
          onMeasureChange={handleMeasureChange}
          onQuantityChange={handleQtyChange}
          showSlider={false}
          showLabel={false}
          qtyInputTestId={index !== undefined ? `meal-item-qty-input-${index}` : 'quantity-input'}
          measureSelectTestId={index !== undefined ? `meal-item-measure-select-${index}` : 'measure-select'}
        />
      </div>

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        data-testid={index !== undefined ? `meal-item-remove-${index}` : undefined}
        onClick={onRemove}
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
        aria-label="Remove item"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
