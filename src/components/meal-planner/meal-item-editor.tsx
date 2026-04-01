'use client';

import { Utensils, X } from 'lucide-react';
import { QuantityUnitInput, type QuantityMeasure } from '@/components/quantity-unit-input';

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
  onChange: (updated: LocalMealItem) => void;
  onRemove: () => void;
}

export function MealItemEditor({ item, onChange, onRemove }: MealItemEditorProps) {
  const kcal = (item.caloriesPer100g / 100) * item.quantityGrams;
  const protein = (item.proteinPer100g / 100) * item.quantityGrams;
  const carbs = (item.carbsPer100g / 100) * item.quantityGrams;
  const fat = (item.fatPer100g / 100) * item.quantityGrams;

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
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      {/* Thumbnail */}
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail} alt={item.foodName} className="w-full h-full object-cover" />
        ) : (
          <Utensils className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{item.foodName}</p>
            {item.brandName && (
              <p className="text-xs text-on-surface-variant truncate">{item.brandName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <QuantityUnitInput
          measures={item.measures}
          selectedMeasureId={item.selectedMeasureId}
          quantity={item.displayQty}
          onMeasureChange={handleMeasureChange}
          onQuantityChange={handleQtyChange}
        />

        {/* Live macros */}
        <div className="flex gap-3 text-xs text-on-surface-variant">
          <span className="font-medium text-foreground">{Math.round(kcal)} kcal</span>
          <span className="text-rose-500">{Math.round(protein)}g P</span>
          <span className="text-amber-500">{Math.round(carbs)}g C</span>
          <span className="text-sky-500">{Math.round(fat)}g F</span>
        </div>
      </div>
    </div>
  );
}
