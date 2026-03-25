'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from '@/lib/nutrition-constants';
import { useDishDetailQuery, useLogDishMutation } from '@/queries/dishes';
import type { DishIngredient } from '@/types/dish';

const MULTIPLIERS = [
  { value: '0.25', label: '¼×' },
  { value: '0.5', label: '½×' },
  { value: '1', label: '1×' },
  { value: '1.5', label: '1½×' },
  { value: '2', label: '2×' },
  { value: '3', label: '3×' },
];

interface DishLogModalProps {
  open: boolean;
  dishId: string | null;
  dishName?: string;
  onClose: () => void;
  onLogged: () => void;
  defaultMealType?: string;
  consumedAt?: string;
}

function calcIngredientNutrient(value: number, multiplier: number) {
  return Math.round(value * multiplier * 10) / 10;
}

export function DishLogModal({
  open,
  dishId,
  dishName,
  onClose,
  onLogged,
  defaultMealType = 'breakfast',
  consumedAt,
}: DishLogModalProps) {
  const [form, setForm] = useState({ multiplier: '1', mealType: defaultMealType, error: null as string | null });
  const overlayRef = useRef<HTMLDivElement>(null);

  const detailQuery = useDishDetailQuery(open ? dishId : null);
  const logMutation = useLogDishMutation();

  const dish = detailQuery.data?.dish;
  const mult = parseFloat(form.multiplier);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setForm({ multiplier: '1', mealType: defaultMealType, error: null });
    }
  }, [open, defaultMealType]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleSubmit = async () => {
    if (!dishId) return;
    setForm((f) => ({ ...f, error: null }));
    try {
      await logMutation.mutateAsync({
        dishId,
        multiplier: mult,
        mealType: form.mealType,
        consumedAt,
      });
      onLogged();
    } catch (err) {
      setForm((f) => ({ ...f, error: err instanceof Error ? err.message : 'Failed to log dish' }));
    }
  };

  if (!open) return null;

  const totals = dish
    ? {
        calories: Math.round((dish.totals.calories) * mult),
        protein: Math.round(dish.totals.protein * mult * 10) / 10,
        carbs: Math.round(dish.totals.carbs * mult * 10) / 10,
        fat: Math.round(dish.totals.fat * mult * 10) / 10,
      }
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        aria-hidden
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Log dish: ${dish?.name ?? dishName ?? ''}`}
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-outline-variant/10">
          <div>
            <h2 className="text-lg font-bold text-foreground">{dish?.name ?? dishName ?? 'Dish'}</h2>
            {dish?.description && (
              <p className="text-sm text-on-surface-variant mt-0.5">{dish.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-foreground transition-colors ml-4 shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {detailQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : detailQuery.isError ? (
            <p className="text-sm text-destructive">Failed to load dish details.</p>
          ) : dish ? (
            <>
              {/* Photo */}
              {(dish.photo?.highres ?? dish.photo?.thumb) && (
                <Image
                  src={(dish.photo?.highres ?? dish.photo?.thumb)!}
                  alt={dish.name}
                  width={640}
                  height={160}
                  className="w-full h-40 object-cover rounded-xl"
                />
              )}

              {/* Ingredients */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Ingredients ({dish.ingredients.length})
                </p>
                <div className="space-y-1.5">
                  {dish.ingredients.map((ing: DishIngredient) => (
                    <div key={ing.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{ing.foodName}</span>
                      <span className="text-on-surface-variant tabular-nums">
                        {Math.round(ing.quantity * mult)}g
                        <span className="ml-2 text-xs text-on-surface-variant/60">
                          {calcIngredientNutrient(ing.calories, mult)} kcal
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nutrition totals */}
              {totals && (
                <div className="rounded-xl bg-surface-container p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                    Nutrition totals at {mult}×
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Calories', value: totals.calories, unit: 'kcal' },
                      { label: 'Protein', value: totals.protein, unit: 'g' },
                      { label: 'Carbs', value: totals.carbs, unit: 'g' },
                      { label: 'Fat', value: totals.fat, unit: 'g' },
                    ].map(({ label, value, unit }) => (
                      <div key={label}>
                        <p className="text-lg font-black tabular-nums text-foreground">{value}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">{unit}</p>
                        <p className="text-[10px] text-on-surface-variant/60">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}

          {form.error && (
            <p className="text-sm text-destructive">{form.error}</p>
          )}
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 border-t border-outline-variant/10 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Multiplier */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Servings</Label>
              <Select value={form.multiplier} onValueChange={(v) => setForm((f) => ({ ...f, multiplier: v }))}>
                <SelectTrigger data-testid="dish-multiplier-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MULTIPLIERS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Meal type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Meal</Label>
              <Select value={form.mealType} onValueChange={(v) => setForm((f) => ({ ...f, mealType: v }))}>
                <SelectTrigger data-testid="dish-meal-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPE_ORDER.filter((m) => ['breakfast', 'lunch', 'dinner', 'snack'].includes(m)).map((m) => (
                    <SelectItem key={m} value={m}>{MEAL_TYPE_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={logMutation.isPending || detailQuery.isLoading}
            data-testid="dish-log-submit"
          >
            {logMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Adding…</>
            ) : (
              'Add to Log'
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
