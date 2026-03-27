'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Loader2, UtensilsCrossed, X } from 'lucide-react';

import { MealTypeSelect } from '@/components/meal-type-select';
import { DateNavigator } from '@/components/date-navigator';
import { QuantityUnitInput, type QuantityMeasure } from '@/components/quantity-unit-input';
import { MACRO_TEXT_COLORS, type MealType } from '@/lib/nutrition-constants';
import { useCreateFoodLogMutation, useUpdateFoodLogMutation } from '@/queries/food-logs';
import { useLogDishMutation } from '@/queries/dishes';
import type { FoodDetailResponse } from '@/queries/food-detail';

// ─── Dish measure (discrete servings) ─────────────────────────────────────────

const DISH_MEASURES: QuantityMeasure[] = [
  {
    id: 'serving',
    label: 'Serving',
    defaultQty: 1,
    sliderMin: 0.25,
    sliderMax: 3,
    sliderStep: 0.25,
    weightGrams: 1,
  },
];

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
  return [base, ...alt];
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type FoodModalMode =
  | {
      kind: 'log-food';
      foodDetail: FoodDetailResponse;
      initialMealType?: MealType;
      initialDate?: Date;
      onAdded: () => void;
    }
  | {
      kind: 'edit-food';
      logId: string;
      foodDetail: FoodDetailResponse;
      initialMealType: MealType;
      initialDate: Date;
      initialQuantityGrams: number;
      initialAltMeasureId: string | null;
      onUpdated: () => void;
    }
  | {
      kind: 'log-dish';
      dishId: string;
      dishTotals: { calories: number; protein: number; carbs: number; fat: number };
      initialMealType?: MealType;
      initialDate?: Date;
      onLogged: () => void;
    }
  | {
      kind: 'ingredient';
      foodDetail: FoodDetailResponse;
      onSelect: (data: {
        foodId: string;
        altMeasureId: string | null;
        quantityGrams: number;
      }) => void;
    };

export interface FoodModalProps {
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  name: string;
  subtitle?: string;
  imageUrl?: string;
  submitLabel?: string;
  mode: FoodModalMode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FoodModal({
  open,
  onClose,
  isLoading,
  name,
  subtitle,
  imageUrl,
  submitLabel,
  mode,
}: FoodModalProps) {
  const defaultMealType: MealType =
    mode.kind === 'ingredient' ? 'breakfast' : (mode.initialMealType ?? 'breakfast');
  const defaultDate: Date =
    mode.kind === 'ingredient' ? new Date() : (mode.initialDate ?? new Date());

  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [date, setDate] = useState<Date>(defaultDate);
  const [selectedMeasureId, setSelectedMeasureId] = useState<string>(
    mode.kind === 'log-dish' ? 'serving' : 'base',
  );
  const [quantity, setQuantity] = useState<number>(mode.kind === 'log-dish' ? 1 : 100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createFoodLog = useCreateFoodLogMutation();
  const updateFoodLog = useUpdateFoodLogMutation();
  const logDish = useLogDishMutation();

  // Reset state each time the modal opens
  useEffect(() => {
    if (!open) return;
    setMealType(mode.kind !== 'ingredient' ? (mode.initialMealType ?? 'breakfast') : 'breakfast');
    setDate(mode.kind !== 'ingredient' ? (mode.initialDate ?? new Date()) : new Date());
    if (mode.kind === 'log-dish') {
      setSelectedMeasureId('serving');
      setQuantity(1);
    } else if (mode.kind === 'edit-food') {
      setSelectedMeasureId(mode.initialAltMeasureId ?? 'base');
      if (mode.initialAltMeasureId) {
        const serving = mode.foodDetail.servings.find((s) => s.id === mode.initialAltMeasureId);
        setQuantity(serving ? mode.initialQuantityGrams / serving.weightGrams : mode.initialQuantityGrams);
      } else {
        setQuantity(mode.initialQuantityGrams);
      }
    } else {
      setSelectedMeasureId('base');
      setQuantity(100);
    }
    setSubmitError(null);
    setIsSubmitting(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Measures list
  const measures: QuantityMeasure[] = useMemo(() => {
    if (mode.kind === 'log-dish') return DISH_MEASURES;
    if (mode.kind === 'ingredient' || mode.kind === 'log-food' || mode.kind === 'edit-food') {
      return buildFoodMeasures(mode.foodDetail.servings);
    }
    return [];
  }, [mode]);

  // Live macro calculation
  const macros = useMemo(() => {
    if (mode.kind === 'log-dish') {
      const t = mode.dishTotals;
      return {
        calories: Math.round(t.calories * quantity),
        protein: Math.round(t.protein * quantity * 10) / 10,
        carbs: Math.round(t.carbs * quantity * 10) / 10,
        fat: Math.round(t.fat * quantity * 10) / 10,
      };
    }
    const base = mode.foodDetail.baseServing;
    const measure = measures.find((m) => m.id === selectedMeasureId) ?? measures[0];
    const grams = selectedMeasureId === 'base' ? quantity : quantity * measure.weightGrams;
    return {
      calories: Math.round((base.calories / 100) * grams),
      protein: Math.round((base.protein / 100) * grams * 10) / 10,
      carbs: Math.round((base.carbs / 100) * grams * 10) / 10,
      fat: Math.round((base.fat / 100) * grams * 10) / 10,
    };
  }, [mode, quantity, selectedMeasureId, measures]);

  const handleMeasureChange = (id: string, newQty: number) => {
    setSelectedMeasureId(id);
    setQuantity(newQty);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (mode.kind === 'log-food') {
        const measure = measures.find((m) => m.id === selectedMeasureId) ?? measures[0];
        const grams = selectedMeasureId === 'base' ? quantity : quantity * measure.weightGrams;
        const altMeasureId = selectedMeasureId === 'base' ? null : selectedMeasureId;
        await createFoodLog.mutateAsync({
          foodId: mode.foodDetail.id,
          altMeasureId,
          quantity: String(grams),
          mealType,
          consumedAt: format(date, 'yyyy-MM-dd'),
        });
        mode.onAdded();
      } else if (mode.kind === 'edit-food') {
        const measure = measures.find((m) => m.id === selectedMeasureId) ?? measures[0];
        const grams = selectedMeasureId === 'base' ? quantity : quantity * measure.weightGrams;
        const altMeasureId = selectedMeasureId === 'base' ? null : selectedMeasureId;
        await updateFoodLog.mutateAsync({
          logId: mode.logId,
          altMeasureId,
          quantity: grams,
          mealType,
          consumedAt: format(date, 'yyyy-MM-dd'),
        });
        mode.onUpdated();
      } else if (mode.kind === 'log-dish') {
        await logDish.mutateAsync({
          dishId: mode.dishId,
          multiplier: quantity,
          mealType,
          consumedAt: format(date, 'yyyy-MM-dd'),
        });
        mode.onLogged();
      } else {
        const measure = measures.find((m) => m.id === selectedMeasureId) ?? measures[0];
        const grams = selectedMeasureId === 'base' ? quantity : quantity * measure.weightGrams;
        const altMeasureId = selectedMeasureId === 'base' ? null : selectedMeasureId;
        mode.onSelect({ foodId: mode.foodDetail.id, altMeasureId, quantityGrams: grams });
      }
    } catch (err) {
      setSubmitError((err as Error).message ?? 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const acceptLabel = submitLabel ?? (mode.kind === 'ingredient' ? 'Add Ingredient' : mode.kind === 'edit-food' ? 'Save Changes' : 'Log Meal');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      data-testid="food-add-modal"
    >
      <div className="relative w-full max-w-[340px] bg-surface-container-lowest rounded-2xl shadow-2xl flex flex-col border border-outline-variant overflow-hidden max-h-[90vh]">

        {/* ── Header (image or green gradient fallback) ── */}
        <div className="relative h-24 overflow-hidden shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="340px"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-surface-container-highest flex items-center justify-center">
              <UtensilsCrossed className="h-10 w-10 text-on-surface-variant/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-3">
            {subtitle && (
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/70 truncate">
                {subtitle}
              </span>
            )}
            <h2 className="font-headline text-lg font-bold text-white leading-tight truncate">
              {name}
            </h2>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 z-[60] size-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors border border-outline-variant"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5 text-on-surface" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading nutrition info…</span>
            </div>
          ) : (
            <>
              {/* Quick Log section — hidden in ingredient mode */}
              {mode.kind !== 'ingredient' && (
                <section className="space-y-2.5">
                  <div className="flex flex-col gap-2">
                    <MealTypeSelect
                      value={mealType}
                      onChange={setMealType}
                      id="food-modal-meal-type"
                    />
                    {mode.kind !== 'edit-food' && (
                      <div>
                        <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 ml-1">
                          Date
                        </label>
                        <DateNavigator value={date} onChange={setDate} />
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Quantity & unit */}
              <QuantityUnitInput
                measures={measures}
                selectedMeasureId={selectedMeasureId}
                quantity={quantity}
                onMeasureChange={handleMeasureChange}
                onQuantityChange={setQuantity}
              />

              {/* Macros summary */}
              <section className="space-y-2 pt-1 border-t border-outline-variant/30">
                <h3 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center">
                  Macros for current amount
                </h3>
                <div className="space-y-2">
                  <div className="text-center p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Calories</p>
                    <p
                      className="text-xl font-headline font-bold text-primary"
                      data-testid="macros-calories"
                    >
                      {macros.calories} kcal
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-surface-container-low rounded-lg border border-outline-variant/20">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Protein</p>
                      <p
                        className={`text-xl font-headline font-bold ${MACRO_TEXT_COLORS.protein}`}
                        data-testid="macros-protein"
                      >
                        {macros.protein}g
                      </p>
                    </div>
                    <div className="text-center p-2 bg-surface-container-low rounded-lg border border-outline-variant/20">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Carbs</p>
                      <p
                        className={`text-xl font-headline font-bold ${MACRO_TEXT_COLORS.carbs}`}
                        data-testid="macros-carbs"
                      >
                        {macros.carbs}g
                      </p>
                    </div>
                    <div className="text-center p-2 bg-surface-container-low rounded-lg border border-outline-variant/20">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Fats</p>
                      <p
                        className={`text-xl font-headline font-bold ${MACRO_TEXT_COLORS.fat}`}
                        data-testid="macros-fat"
                      >
                        {macros.fat}g
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-3 bg-surface-container-high border-t border-outline-variant flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-outline-variant bg-background font-bold text-md text-on-surface-variant hover:bg-surface-container-low transition-colors"
            data-testid="food-modal-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="flex-1 py-2.5 rounded-lg bg-primary text-white font-bold text-md shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:pointer-events-none"
            data-testid="add-food-button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Adding…
              </>
            ) : (
              acceptLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
