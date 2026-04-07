'use client';

import { Utensils, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { QuantityMeasure } from '@/components/quantity-unit-input';

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
  const kcal = Math.round((item.caloriesPer100g / 100) * item.quantityGrams);
  const protein = Math.round((item.proteinPer100g / 100) * item.quantityGrams);
  const carbs = Math.round((item.carbsPer100g / 100) * item.quantityGrams);
  const fat = Math.round((item.fatPer100g / 100) * item.quantityGrams);

  function handleMeasureChange(id: string) {
    const measure = item.measures.find((m) => m.id === id) ?? item.measures[0];
    onChange({
      ...item,
      selectedMeasureId: id,
      displayQty: measure.defaultQty,
      quantityGrams: measure.defaultQty * measure.weightGrams,
    });
  }

  function handleQtyChange(raw: string) {
    const val = parseFloat(raw);
    if (isNaN(val) || val <= 0) return;
    const measure = item.measures.find((m) => m.id === item.selectedMeasureId) ?? item.measures[0];
    onChange({
      ...item,
      displayQty: val,
      quantityGrams: val * measure.weightGrams,
    });
  }

  return (
    <div className="flex items-center gap-3 p-3 border rounded-xl bg-background">
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail} alt={item.foodName} className="w-full h-full object-cover" />
        ) : (
          <Utensils className="h-4 w-4 text-primary" />
        )}
      </div>

      {/* Food info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate leading-tight">{item.foodName}</p>
        {item.brandName && (
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{item.brandName}</p>
        )}
        <div className="flex items-center gap-2.5 mt-1">
          <span>
            <span className="text-[9px] font-bold uppercase text-muted-foreground mr-0.5">KCAL</span>
            <span className="text-xs font-bold text-foreground">{kcal}</span>
          </span>
          <span>
            <span className="text-[9px] font-bold uppercase text-muted-foreground mr-0.5">PROT</span>
            <span className="text-xs font-bold text-rose-500">{protein}g</span>
          </span>
          <span>
            <span className="text-[9px] font-bold uppercase text-muted-foreground mr-0.5">CARB</span>
            <span className="text-xs font-bold text-amber-500">{carbs}g</span>
          </span>
          <span>
            <span className="text-[9px] font-bold uppercase text-muted-foreground mr-0.5">FAT</span>
            <span className="text-xs font-bold text-sky-500">{fat}g</span>
          </span>
        </div>
      </div>

      {/* Quantity + unit + remove */}
      <div className="flex items-center gap-1 shrink-0">
        <input
          type="number"
          min={0}
          step="any"
          value={item.displayQty}
          onChange={(e) => handleQtyChange(e.target.value)}
          className="w-14 text-center text-sm font-bold border rounded-lg py-1.5 px-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          aria-label="Quantity"
        />
        <Select value={item.selectedMeasureId} onValueChange={handleMeasureChange}>
          <SelectTrigger className="h-8 text-xs font-semibold border rounded-lg bg-background min-w-[90px] max-w-[130px] focus:ring-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {item.measures.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded"
          aria-label="Remove item"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
