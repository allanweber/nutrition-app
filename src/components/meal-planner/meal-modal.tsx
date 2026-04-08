'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChefHat, Loader2, Utensils, X } from 'lucide-react';
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
import { useDishesQuery } from '@/queries/dishes';
import type { UnifiedFoodSearchResultItem } from '@/components/food-search-field/types';
import type { QuantityMeasure } from '@/components/quantity-unit-input';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, type MealType } from '@/lib/nutrition-constants';
import {
  useCreateMealMutation,
  useUpdateMealMutation,
  useAddMealItemMutation,
  useUpdateMealItemMutation,
  useDeleteMealItemMutation,
  useAddDishToMealMutation,
  useDeleteDishGroupFromMealMutation,
} from '@/queries/diet-plans';
import type { DietPlanMealDTO, MealItemDTO } from '@/server/services/diet-plan.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MealModalState =
  | { mode: 'create'; planId: string; day: number; existingMeals: DietPlanMealDTO[] }
  | { mode: 'edit'; planId: string; meal: DietPlanMealDTO };

interface MealModalProps {
  state: MealModalState;
  onClose: () => void;
}

export interface LocalDishGroup {
  /** Set when loaded from DB in edit mode */
  dbDishGroupId: string | null;
  /** Set when the user picks a new dish to add, OR loaded from dishSourceId in DB */
  dishId: string | null;
  dishName: string;
  /** Per-1x totals from the dish definition */
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  /** Serving multiplier — defaults to 1 */
  multiplier: number;
  /** Whether the multiplier was changed from its original value (only relevant for existing DB groups) */
  multiplierChanged: boolean;
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

function apiQuantity(item: LocalMealItem): number {
  return item.selectedMeasureId === 'base' ? item.quantityGrams : item.displayQty;
}

function buildLocalItemFromDTO(item: MealItemDTO): LocalMealItem {
  const baseMeasure: QuantityMeasure = {
    id: 'base',
    label: 'grams',
    defaultQty: 100,
    sliderMin: 10,
    sliderMax: 1000,
    sliderStep: 5,
    weightGrams: 1,
  };
  const altMeasures: QuantityMeasure[] = item.foodMeasures.map((m) => ({
    id: m.id,
    label: m.label,
    defaultQty: m.defaultQty,
    sliderMin: 0.25,
    sliderMax: 10,
    sliderStep: 0.25,
    weightGrams: m.weightGrams,
  }));
  const allMeasures = [...altMeasures, baseMeasure];
  const selectedMeasureId = item.altMeasureId ?? 'base';
  const selectedMeasure = allMeasures.find((m) => m.id === selectedMeasureId) ?? baseMeasure;
  return {
    id: item.id,
    foodId: item.foodId,
    foodName: item.foodName,
    brandName: item.brandName,
    thumbnail: item.thumbnail,
    caloriesPer100g: item.caloriesPer100g,
    proteinPer100g: item.proteinPer100g,
    carbsPer100g: item.carbsPer100g,
    fatPer100g: item.fatPer100g,
    measures: allMeasures,
    selectedMeasureId,
    displayQty: item.quantity,
    quantityGrams: item.quantity * selectedMeasure.weightGrams,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MealModal({ state, onClose }: MealModalProps) {
  const isEdit = state.mode === 'edit';
  const initialMealType: MealType = isEdit ? (state.meal.mealType as MealType) : 'breakfast';

  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [items, setItems] = useState<LocalMealItem[]>([]);
  const [dishGroups, setDishGroups] = useState<LocalDishGroup[]>([]);
  const [pendingFood, setPendingFood] = useState<UnifiedFoodSearchResultItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Track which dish groups were in the DB when edit mode opened (for removal detection)
  const initialDishGroupIds = useRef<string[]>([]);

  const foodSearch = useFoodSearch({ includeCustom: true });
  const dishesQuery = useDishesQuery();

  const pendingSelection = pendingFood
    ? pendingFood.id !== null
      ? { id: pendingFood.id, fatSecretId: pendingFood.fatSecretId ?? undefined }
      : { id: null as null, fatSecretId: pendingFood.fatSecretId! }
    : null;
  const detailQuery = useFoodDetailQuery(pendingSelection);

  // When a newly searched food's detail arrives, add it as a local item
  useEffect(() => {
    if (!pendingFood || !detailQuery.data) return;
    const newItem = buildLocalItem(pendingFood, detailQuery.data.food);
    setItems((prev) => [...prev, newItem]);
    setPendingFood(null);
    foodSearch.setQuery('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailQuery.data]);

  // Load existing items in edit mode — separate dish groups from individual food items
  useEffect(() => {
    if (!isEdit) return;
    const meal = (state as { mode: 'edit'; planId: string; meal: DietPlanMealDTO }).meal;

    const dishGroupsMap = new Map<string, MealItemDTO[]>();
    const regularItems: LocalMealItem[] = [];

    for (const item of meal.items) {
      if (item.dishGroupId) {
        if (!dishGroupsMap.has(item.dishGroupId)) dishGroupsMap.set(item.dishGroupId, []);
        dishGroupsMap.get(item.dishGroupId)!.push(item);
      } else {
        regularItems.push(buildLocalItemFromDTO(item));
      }
    }

    setItems(regularItems);

    const loadedGroups: LocalDishGroup[] = Array.from(dishGroupsMap.entries()).map(([id, groupItems]) => ({
      dbDishGroupId: id,
      dishId: groupItems[0].dishSourceId ?? null,
      dishName: groupItems[0].dishNameSnapshot ?? 'Unknown Dish',
      totalCalories: groupItems.reduce((s, i) => s + i.calories, 0),
      totalProtein: groupItems.reduce((s, i) => s + i.protein, 0),
      totalCarbs: groupItems.reduce((s, i) => s + i.carbs, 0),
      totalFat: groupItems.reduce((s, i) => s + i.fat, 0),
      multiplier: 1, // quantities already scaled in DB; display at 1×
      multiplierChanged: false,
    }));

    setDishGroups(loadedGroups);
    initialDishGroupIds.current = loadedGroups
      .filter((g) => g.dbDishGroupId)
      .map((g) => g.dbDishGroupId!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createMealMutation = useCreateMealMutation();
  const updateMealMutation = useUpdateMealMutation();
  const addItemMutation = useAddMealItemMutation();
  const updateItemMutation = useUpdateMealItemMutation();
  const deleteItemMutation = useDeleteMealItemMutation();
  const addDishToMealMutation = useAddDishToMealMutation();
  const deleteDishGroupMutation = useDeleteDishGroupFromMealMutation();

  const handleFoodSelect = useCallback((food: UnifiedFoodSearchResultItem) => {
    if (food.itemKind === 'dish' && food.dishId) {
      const dish = dishesQuery.data?.dishes.find((d) => d.id === food.dishId);
      if (!dish) return;
      setDishGroups((prev) => [
        ...prev,
        {
          dbDishGroupId: null,
          dishId: dish.id,
          dishName: dish.name,
          totalCalories: dish.totalCalories,
          totalProtein: dish.totalProtein,
          totalCarbs: dish.totalCarbs,
          totalFat: dish.totalFat,
          multiplier: 1,
          multiplierChanged: false,
        },
      ]);
      foodSearch.setQuery('');
      return;
    }
    setPendingFood(food);
  }, [dishesQuery.data, foodSearch]);

  function updateItem(index: number, updated: LocalMealItem) {
    setItems((prev) => prev.map((item, i) => (i === index ? updated : item)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function removeDishGroup(index: number) {
    setDishGroups((prev) => prev.filter((_, i) => i !== index));
  }

  function updateDishGroupMultiplier(index: number, multiplier: number) {
    setDishGroups((prev) => prev.map((g, i) => (i === index ? { ...g, multiplier, multiplierChanged: true } : g)));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      if (state.mode === 'create') {
        const existingMeal = state.existingMeals.find((m) => m.mealType === mealType);
        let mealId: string;
        if (existingMeal) {
          mealId = existingMeal.id;
        } else {
          const mealRes = await createMealMutation.mutateAsync({
            planId: state.planId,
            mealType,
            dayOfWeek: state.day,
          });
          mealId = mealRes.meal.id;
        }
        await Promise.all([
          ...items.map((item) =>
            addItemMutation.mutateAsync({
              planId: state.planId,
              mealId,
              foodId: item.foodId,
              altMeasureId: item.selectedMeasureId === 'base' ? null : item.selectedMeasureId,
              quantity: apiQuantity(item),
            }),
          ),
          ...dishGroups
            .filter((g) => g.dishId)
            .map((g) =>
              addDishToMealMutation.mutateAsync({ planId: state.planId, mealId, dishId: g.dishId!, multiplier: g.multiplier }),
            ),
        ]);
      } else {
        const meal = state.meal;
        const originalIds = new Set(meal.items.filter((i) => !i.dishGroupId).map((i) => i.id));
        const currentIds = new Set(items.filter((i) => i.id).map((i) => i.id!));

        const removedIds = [...originalIds].filter((id) => !currentIds.has(id));
        const newItems = items.filter((i) => !i.id);
        const modifiedItems = items.filter((i) => {
          if (!i.id) return false;
          const orig = meal.items.find((o) => o.id === i.id);
          if (!orig) return false;
          const newDisplayQty = apiQuantity(i);
          const newAltMeasureId = i.selectedMeasureId === 'base' ? null : i.selectedMeasureId;
          return (
            Math.abs(newDisplayQty - orig.quantity) > 0.01 ||
            newAltMeasureId !== orig.altMeasureId
          );
        });

        const currentDbGroupIds = new Set(
          dishGroups.filter((g) => g.dbDishGroupId).map((g) => g.dbDishGroupId!),
        );
        const removedDishGroupIds = initialDishGroupIds.current.filter(
          (id) => !currentDbGroupIds.has(id),
        );
        // Existing groups whose multiplier changed: delete + re-add
        const changedDishGroups = dishGroups.filter(
          (g) => g.dbDishGroupId && g.dishId && g.multiplierChanged,
        );
        const newDishGroups = dishGroups.filter((g) => !g.dbDishGroupId && g.dishId);

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
              quantity: apiQuantity(item),
            }),
          ),
          ...modifiedItems.map((item) =>
            updateItemMutation.mutateAsync({
              planId: state.planId,
              mealId: meal.id,
              itemId: item.id!,
              altMeasureId: item.selectedMeasureId === 'base' ? null : item.selectedMeasureId,
              quantity: apiQuantity(item),
            }),
          ),
          ...[...removedDishGroupIds, ...changedDishGroups.map((g) => g.dbDishGroupId!)].map((id) =>
            deleteDishGroupMutation.mutateAsync({
              planId: state.planId,
              mealId: meal.id,
              dishGroupId: id,
            }),
          ),
          ...[...newDishGroups, ...changedDishGroups].map((g) =>
            addDishToMealMutation.mutateAsync({
              planId: state.planId,
              mealId: meal.id,
              dishId: g.dishId!,
              multiplier: g.multiplier,
            }),
          ),
        ]);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  const foodKcal = items.reduce((s, i) => s + (i.caloriesPer100g / 100) * i.quantityGrams, 0);
  const dishKcal = dishGroups.reduce((s, g) => s + g.totalCalories * g.multiplier, 0);
  const totalKcal = foodKcal + dishKcal;

  const foodProtein = items.reduce((s, i) => s + (i.proteinPer100g / 100) * i.quantityGrams, 0);
  const dishProtein = dishGroups.reduce((s, g) => s + g.totalProtein * g.multiplier, 0);
  const totalProtein = foodProtein + dishProtein;

  const foodCarbs = items.reduce((s, i) => s + (i.carbsPer100g / 100) * i.quantityGrams, 0);
  const dishCarbs = dishGroups.reduce((s, g) => s + g.totalCarbs * g.multiplier, 0);
  const totalCarbs = foodCarbs + dishCarbs;

  const foodFat = items.reduce((s, i) => s + (i.fatPer100g / 100) * i.quantityGrams, 0);
  const dishFat = dishGroups.reduce((s, g) => s + g.totalFat * g.multiplier, 0);
  const totalFat = foodFat + dishFat;

  const hasContent = items.length > 0 || dishGroups.length > 0;

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="md:min-w-2xl min-h-[80vh] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">

        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-6 shrink-0">
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

        {/* ── Search (non-scrolling) ── */}
        <div className="px-6 pb-3 pt-2 shrink-0 relative z-10">
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

        {/* ── Scrollable items list ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {hasContent && (
            <div className="space-y-3">
              {/* Dish groups */}
              {dishGroups.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Dishes
                  </p>
                  {dishGroups.map((group, index) => (
                    <div
                      key={group.dbDishGroupId ?? `new-dish-${index}`}
                      className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-violet-50/60 border border-violet-200/60"
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                        <ChefHat className="h-4 w-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate leading-tight">
                          {group.dishName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span>
                            <span className="text-[9px] font-bold uppercase text-muted-foreground mr-0.5">KCAL</span>
                            <span className="text-xs font-bold text-foreground">{Math.round(group.totalCalories * group.multiplier)}</span>
                          </span>
                          <span>
                            <span className="text-[9px] font-bold uppercase text-muted-foreground mr-0.5">PROT</span>
                            <span className="text-xs font-bold text-rose-500">{Math.round(group.totalProtein * group.multiplier)}g</span>
                          </span>
                          <span>
                            <span className="text-[9px] font-bold uppercase text-muted-foreground mr-0.5">CARB</span>
                            <span className="text-xs font-bold text-amber-500">{Math.round(group.totalCarbs * group.multiplier)}g</span>
                          </span>
                          <span>
                            <span className="text-[9px] font-bold uppercase text-muted-foreground mr-0.5">FAT</span>
                            <span className="text-xs font-bold text-sky-500">{Math.round(group.totalFat * group.multiplier)}g</span>
                          </span>
                        </div>
                      </div>
                      {/* Multiplier input — shown when we know the source dish */}
                      {group.dishId && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            min={0.25}
                            max={20}
                            step={0.25}
                            value={group.multiplier}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!isNaN(v) && v > 0) updateDishGroupMultiplier(index, v);
                            }}
                            className="w-16 h-8 rounded-lg border border-violet-200 bg-background px-2 text-sm text-center font-semibold focus:outline-none focus:ring-1 focus:ring-violet-400"
                          />
                          <span className="text-xs text-muted-foreground">×</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeDishGroup(index)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded shrink-0"
                        aria-label="Remove dish"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Individual food items */}
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
            </div>
          )}

          {!hasContent && !detailQuery.isLoading && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Search and select foods or add a dish to this meal.
            </p>
          )}
        </div>

        {/* ── Summary + Footer ── */}
        <div className="px-6 pb-6 pt-3 space-y-4 shrink-0 border-t border-border/30">
          {hasContent && (
            <div className="rounded-xl bg-muted border border-border/50 px-5 py-4 flex items-center justify-between">
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

          <DialogFooter className="gap-3 sm:gap-3 flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasContent}
              className="flex-7 bg-primary text-primary-foreground hover:bg-primary/90"
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
