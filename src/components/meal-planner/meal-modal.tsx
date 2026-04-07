'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Utensils } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FoodSearchField } from '@/components/food-search-field';
import { MealItemEditor, type LocalMealItem } from './meal-item-editor';
import { useFoodSearch } from '@/hooks/use-food-search';
import { useFoodDetailQuery, type FoodDetailResponse } from '@/queries/food-detail';
import type { UnifiedFoodSearchResultItem } from '@/components/food-search-field/types';
import type { QuantityMeasure } from '@/components/quantity-unit-input';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, type MealType } from '@/lib/nutrition-constants';
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
    label: 'grams',
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

  const pendingSelection = pendingFood
    ? pendingFood.id !== null
      ? { id: pendingFood.id, fatSecretId: pendingFood.fatSecretId ?? undefined }
      : { id: null as null, fatSecretId: pendingFood.fatSecretId! }
    : null;
  const detailQuery = useFoodDetailQuery(pendingSelection);

  useEffect(() => {
    if (!pendingFood || !detailQuery.data) return;
    const newItem = buildLocalItem(pendingFood, detailQuery.data.food);
    setItems((prev) => [...prev, newItem]);
    setPendingFood(null);
    foodSearch.setQuery('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailQuery.data]);

  useEffect(() => {
    if (!isEdit) return;
    const meal = (state as { mode: 'edit'; planId: string; meal: DietPlanMealDTO }).meal;
    const initialItems: LocalMealItem[] = meal.items.map((item) => {
      const baseMeasure: QuantityMeasure = {
        id: 'base',
        label: 'grams',
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
        const mealRes = await createMealMutation.mutateAsync({
          planId: state.planId,
          mealType,
          dayOfWeek: state.day,
        });
        const mealId = mealRes.meal.id;
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

        const removedIds = [...originalIds].filter((id) => !currentIds.has(id));
        const newItems = items.filter((i) => !i.id);
        const modifiedItems = items.filter((i) => {
          if (!i.id) return false;
          const orig = meal.items.find((o) => o.id === i.id);
          if (!orig) return false;
          return (
            Math.abs(i.quantityGrams - orig.quantity) > 0.01 ||
            (i.selectedMeasureId === 'base' ? null : i.selectedMeasureId) !== orig.altMeasureId
          );
        });

        await Promise.all([
          mealType !== meal.mealType
            ? updateMealMutation.mutateAsync({ planId: state.planId, mealId: meal.id, mealType })
            : Promise.resolve(),
          ...removedIds.map((id) =>
            deleteItemMutation.mutateAsync({ planId: state.planId, mealId: meal.id, itemId: id }),
          ),
          ...newItems.map((item) =>
            addItemMutation.mutateAsync({
              planId: state.planId,
              mealId: meal.id,
              foodId: item.foodId,
              altMeasureId: item.selectedMeasureId === 'base' ? null : item.selectedMeasureId,
              quantity: item.quantityGrams,
            }),
          ),
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

  const totalKcal = items.reduce((s, i) => s + (i.caloriesPer100g / 100) * i.quantityGrams, 0);
  const totalProtein = items.reduce((s, i) => s + (i.proteinPer100g / 100) * i.quantityGrams, 0);
  const totalCarbs = items.reduce((s, i) => s + (i.carbsPer100g / 100) * i.quantityGrams, 0);
  const totalFat = items.reduce((s, i) => s + (i.fatPer100g / 100) * i.quantityGrams, 0);

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      {/* <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden"> */}
      <DialogContent className="md:min-w-2xl min-h-[55vh] flex flex-col">

        {/* ── Header ── */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Utensils className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold leading-tight">
                {isEdit ? 'Edit Meal' : 'Create Meal'}
              </DialogTitle>
              <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
                <SelectTrigger className="h-auto w-auto border-none p-0 shadow-none bg-transparent focus:ring-0 gap-1 [&>svg]:hidden">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    <SelectValue />
                  </span>
                  <span className="text-primary text-[11px] font-bold">››</span>
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPE_ORDER.map((type) => (
                    <SelectItem key={type} value={type}>
                      {MEAL_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        {/* ── Scrollable body ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 space-y-4 pb-2">

          {/* Search */}
          <div>
            <FoodSearchField
              state={foodSearch}
              onQueryChange={foodSearch.setQuery}
              onLoadMore={foodSearch.loadMore}
              onSelect={handleFoodSelect}
              placeholder="Search for a food item..."
              size="small"
            />
            {detailQuery.isLoading && pendingFood && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading food details…
              </div>
            )}
          </div>

          {/* Selected items */}
          {items.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Selected Items
              </p>
              <div className="space-y-2">
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
            <p className="text-sm text-muted-foreground text-center py-6">
              Search and select foods to add them to this meal.
            </p>
          )}
        </div>

        {/* ── Summary + Footer ── */}
        <div className="px-6 pb-6 pt-3 space-y-4">
          {items.length > 0 && (
            <div className="rounded-xl bg-muted/60 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Total Meal Summary
                </p>
                <p className="text-2xl font-bold text-foreground mt-0.5 leading-none">
                  {Math.round(totalKcal)}{' '}
                  <span className="text-sm font-semibold text-muted-foreground">Total Kcal</span>
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Protein</p>
                  <p className="text-base font-bold text-rose-500 leading-tight">
                    {Math.round(totalProtein)}<span className="text-xs font-semibold">g</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Carbs</p>
                  <p className="text-base font-bold text-amber-500 leading-tight">
                    {Math.round(totalCarbs)}<span className="text-xs font-semibold">g</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Fats</p>
                  <p className="text-base font-bold text-sky-500 leading-tight">
                    {Math.round(totalFat)}<span className="text-xs font-semibold">g</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || items.length === 0}
              className="flex-1 bg-foreground text-background hover:bg-foreground/90"
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Save Meal'}
            </Button>
          </DialogFooter>
        </div>

      </DialogContent>
    </Dialog>
  );
}
