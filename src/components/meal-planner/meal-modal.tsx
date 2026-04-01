'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FoodSearchField } from '@/components/food-search-field';
import { MealTypeSelect } from '@/components/meal-type-select';
import { MealItemEditor, type LocalMealItem } from './meal-item-editor';
import { useFoodSearch } from '@/hooks/use-food-search';
import { useFoodDetailQuery, type FoodDetailResponse } from '@/queries/food-detail';
import type { UnifiedFoodSearchResultItem } from '@/components/food-search-field/types';
import type { QuantityMeasure } from '@/components/quantity-unit-input';
import type { MealType } from '@/lib/nutrition-constants';
import {
  useCreateMealMutation,
  useUpdateMealMutation,
  useAddMealItemMutation,
  useUpdateMealItemMutation,
  useDeleteMealItemMutation,
} from '@/queries/diet-plans';
import type { DietPlanMealDTO } from '@/server/services/diet-plan.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MealModalState =
  | { mode: 'create'; planId: string; day: number }
  | { mode: 'edit'; planId: string; meal: DietPlanMealDTO };

interface MealModalProps {
  state: MealModalState;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFoodMeasures(servings: FoodDetailResponse['servings']): QuantityMeasure[] {
  const base: QuantityMeasure = {
    id: 'base',
    label: 'g',
    defaultQty: 100,
    sliderMin: 10,
    sliderMax: 500,
    sliderStep: 5,
    weightGrams: 1,
  };
  const alt: QuantityMeasure[] = servings.map((s) => ({
    id: s.id,
    label: s.description,
    defaultQty: 1,
    sliderMin: 0.25,
    sliderMax: 10,
    sliderStep: 0.25,
    weightGrams: s.weightGrams,
  }));
  return [...alt, base];
}

function buildLocalItem(food: UnifiedFoodSearchResultItem, detail: FoodDetailResponse): LocalMealItem {
  const measures = buildFoodMeasures(detail.servings);
  const firstMeasure = measures[0];
  const displayQty = firstMeasure.defaultQty;
  const quantityGrams = displayQty * firstMeasure.weightGrams;
  return {
    foodId: detail.id,
    foodName: detail.name,
    brandName: detail.brandName,
    thumbnail: food.thumbnail,
    caloriesPer100g: detail.baseServing.calories,
    proteinPer100g: detail.baseServing.protein,
    carbsPer100g: detail.baseServing.carbs,
    fatPer100g: detail.baseServing.fat,
    measures,
    selectedMeasureId: firstMeasure.id,
    displayQty,
    quantityGrams,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MealModal({ state, onClose }: MealModalProps) {
  const isEdit = state.mode === 'edit';
  const initialMealType: MealType = isEdit ? (state.meal.mealType as MealType) : 'breakfast';

  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [items, setItems] = useState<LocalMealItem[]>([]);
  const [pendingFood, setPendingFood] = useState<UnifiedFoodSearchResultItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const foodSearch = useFoodSearch({ includeCustom: true });

  // Load detail for the pending (just-selected) food
  const pendingSelection = pendingFood
    ? pendingFood.id !== null
      ? { id: pendingFood.id, fatSecretId: pendingFood.fatSecretId ?? undefined }
      : { id: null as null, fatSecretId: pendingFood.fatSecretId! }
    : null;
  const detailQuery = useFoodDetailQuery(pendingSelection);

  // When detail loads for pending food, add it to items
  useEffect(() => {
    if (!pendingFood || !detailQuery.data) return;
    const newItem = buildLocalItem(pendingFood, detailQuery.data.food);
    setItems((prev) => [...prev, newItem]);
    setPendingFood(null);
    foodSearch.setQuery('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailQuery.data]);

  // In edit mode, initialise items from the existing meal (grams only)
  useEffect(() => {
    if (!isEdit) return;
    const meal = (state as { mode: 'edit'; planId: string; meal: DietPlanMealDTO }).meal;
    const initialItems: LocalMealItem[] = meal.items.map((item) => {
      const baseMeasure: QuantityMeasure = {
        id: 'base',
        label: 'g',
        defaultQty: 100,
        sliderMin: 10,
        sliderMax: 1000,
        sliderStep: 5,
        weightGrams: 1,
      };
      return {
        id: item.id,
        foodId: item.foodId,
        foodName: item.foodName,
        brandName: item.brandName,
        thumbnail: item.thumbnail,
        caloriesPer100g: (item.calories / item.quantity) * 100,
        proteinPer100g: (item.protein / item.quantity) * 100,
        carbsPer100g: (item.carbs / item.quantity) * 100,
        fatPer100g: (item.fat / item.quantity) * 100,
        measures: [baseMeasure],
        selectedMeasureId: 'base',
        displayQty: item.quantity,
        quantityGrams: item.quantity,
      };
    });
    setItems(initialItems);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createMealMutation = useCreateMealMutation();
  const updateMealMutation = useUpdateMealMutation();
  const addItemMutation = useAddMealItemMutation();
  const updateItemMutation = useUpdateMealItemMutation();
  const deleteItemMutation = useDeleteMealItemMutation();

  const handleFoodSelect = useCallback((food: UnifiedFoodSearchResultItem) => {
    setPendingFood(food);
  }, []);

  function updateItem(index: number, updated: LocalMealItem) {
    setItems((prev) => prev.map((item, i) => (i === index ? updated : item)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      if (state.mode === 'create') {
        // 1. Create the meal row
        const mealRes = await createMealMutation.mutateAsync({
          planId: state.planId,
          mealType,
          dayOfWeek: state.day,
        });
        const mealId = mealRes.meal.id;
        // 2. Add all items in parallel
        await Promise.all(
          items.map((item) =>
            addItemMutation.mutateAsync({
              planId: state.planId,
              mealId,
              foodId: item.foodId,
              altMeasureId: item.selectedMeasureId === 'base' ? null : item.selectedMeasureId,
              quantity: item.quantityGrams,
            }),
          ),
        );
      } else {
        const meal = state.meal;
        const originalIds = new Set(meal.items.map((i) => i.id));
        const currentIds = new Set(items.filter((i) => i.id).map((i) => i.id!));

        // Items removed
        const removedIds = [...originalIds].filter((id) => !currentIds.has(id));
        // Items added (no id)
        const newItems = items.filter((i) => !i.id);
        // Items modified (have id + exist in original)
        const modifiedItems = items.filter((i) => {
          if (!i.id) return false;
          const orig = meal.items.find((o) => o.id === i.id);
          if (!orig) return false;
          return (
            Math.abs(i.quantityGrams - orig.quantity) > 0.01 ||
            (i.selectedMeasureId === 'base' ? null : i.selectedMeasureId) !==
              orig.altMeasureId
          );
        });

        await Promise.all([
          // Patch meal type if changed
          mealType !== meal.mealType
            ? updateMealMutation.mutateAsync({ planId: state.planId, mealId: meal.id, mealType })
            : Promise.resolve(),
          // Delete removed items
          ...removedIds.map((id) =>
            deleteItemMutation.mutateAsync({ planId: state.planId, mealId: meal.id, itemId: id }),
          ),
          // Add new items
          ...newItems.map((item) =>
            addItemMutation.mutateAsync({
              planId: state.planId,
              mealId: meal.id,
              foodId: item.foodId,
              altMeasureId: item.selectedMeasureId === 'base' ? null : item.selectedMeasureId,
              quantity: item.quantityGrams,
            }),
          ),
          // Update modified items
          ...modifiedItems.map((item) =>
            updateItemMutation.mutateAsync({
              planId: state.planId,
              mealId: meal.id,
              itemId: item.id!,
              altMeasureId: item.selectedMeasureId === 'base' ? null : item.selectedMeasureId,
              quantity: item.quantityGrams,
            }),
          ),
        ]);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  // Totals
  const totalKcal = items.reduce((s, i) => s + (i.caloriesPer100g / 100) * i.quantityGrams, 0);
  const totalProtein = items.reduce((s, i) => s + (i.proteinPer100g / 100) * i.quantityGrams, 0);
  const totalCarbs = items.reduce((s, i) => s + (i.carbsPer100g / 100) * i.quantityGrams, 0);
  const totalFat = items.reduce((s, i) => s + (i.fatPer100g / 100) * i.quantityGrams, 0);

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Meal' : 'Add Meal'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Meal type */}
          <MealTypeSelect value={mealType} onChange={setMealType} id="meal-modal-type" />

          {/* Food search */}
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 ml-1">
              Add Food
            </p>
            <FoodSearchField
              state={foodSearch}
              onQueryChange={foodSearch.setQuery}
              onLoadMore={foodSearch.loadMore}
              onSelect={handleFoodSelect}
              placeholder="Search foods…"
              size="small"
            />
            {detailQuery.isLoading && pendingFood && (
              <div className="flex items-center gap-2 mt-2 text-sm text-on-surface-variant">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading food details…
              </div>
            )}
          </div>

          {/* Item list */}
          {items.length > 0 && (
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 ml-1">
                Items
              </p>
              <div className="rounded-xl border bg-background">
                {items.map((item, index) => (
                  <MealItemEditor
                    key={item.id ?? `new-${index}`}
                    item={item}
                    onChange={(updated) => updateItem(index, updated)}
                    onRemove={() => removeItem(index)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty hint */}
          {items.length === 0 && !detailQuery.isLoading && (
            <p className="text-sm text-on-surface-variant text-center py-4">
              Search and select foods to add them to this meal.
            </p>
          )}
        </div>

        {/* Totals footer */}
        {items.length > 0 && (
          <div className="border-t pt-3 flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">{Math.round(totalKcal)} kcal total</span>
            <div className="flex gap-3 text-xs text-on-surface-variant">
              <span className="text-rose-500 font-medium">{Math.round(totalProtein)}g P</span>
              <span className="text-amber-500 font-medium">{Math.round(totalCarbs)}g C</span>
              <span className="text-sky-500 font-medium">{Math.round(totalFat)}g F</span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || items.length === 0}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Meal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
