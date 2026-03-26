'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

import { useForm, useStore } from '@tanstack/react-form';
import { X, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from '@/lib/nutrition-constants';
import { dishLogFormSchema, zodValidator } from '@/lib/form-validation';
import type { DishLogFormData } from '@/lib/form-validation';
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const detailQuery = useDishDetailQuery(open ? dishId : null);
  const logMutation = useLogDishMutation();
  const dish = detailQuery.data?.dish;

  const form = useForm({
    defaultValues: {
      multiplier: 1,
      mealType: defaultMealType as DishLogFormData['mealType'],
    },
    onSubmit: async ({ value }) => {
      if (!dishId) return;
      await logMutation.mutateAsync({
        dishId,
        multiplier: parseFloat(String(value.multiplier)),
        mealType: String(value.mealType),
        consumedAt,
      });
      onLogged();
    },
  });

  // Get live multiplier from form store for nutrition display
  const multiplier = useStore(form.store, (s) => parseFloat(String(s.values.multiplier)) || 1);

  // Reset form state when closed/reopened
  useEffect(() => {
    if (!open) {
      form.reset({ multiplier: 1, mealType: defaultMealType as DishLogFormData['mealType'] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultMealType]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const totals = dish
    ? {
        calories: Math.round(dish.totals.calories * multiplier),
        protein: Math.round(dish.totals.protein * multiplier * 10) / 10,
        carbs: Math.round(dish.totals.carbs * multiplier * 10) / 10,
        fat: Math.round(dish.totals.fat * multiplier * 10) / 10,
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
                        {Math.round(ing.quantity * multiplier)}g
                        <span className="ml-2 text-xs text-on-surface-variant/60">
                          {calcIngredientNutrient(ing.calories, multiplier)} kcal
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
                    Nutrition totals at {multiplier}×
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
        </div>

        {/* Footer — TanStack Form controls */}
        <form
          className="px-6 py-4 border-t border-outline-variant/10 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            {/* Multiplier */}
            <form.Field
              name="multiplier"
              validators={{ onChange: zodValidator(dishLogFormSchema.shape.multiplier) }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Servings</Label>
                  <Select
                    value={String(field.state.value)}
                    onValueChange={(v) => field.handleChange(v as never)}
                  >
                    <SelectTrigger
                      className={field.state.meta.errors.length > 0 ? 'border-destructive' : ''}
                      data-testid="dish-multiplier-select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MULTIPLIERS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Meal type */}
            <form.Field
              name="mealType"
              validators={{ onChange: zodValidator(dishLogFormSchema.shape.mealType) }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Meal</Label>
                  <Select
                    value={String(field.state.value)}
                    onValueChange={(v) => field.handleChange(v as never)}
                  >
                    <SelectTrigger
                      className={field.state.meta.errors.length > 0 ? 'border-destructive' : ''}
                      data-testid="dish-meal-type-select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPE_ORDER.filter((m) => ['breakfast', 'lunch', 'dinner', 'snack'].includes(m)).map((m) => (
                        <SelectItem key={m} value={m}>{MEAL_TYPE_LABELS[m]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          {logMutation.error && (
            <p className="text-sm text-destructive">
              {(logMutation.error as Error).message || 'Failed to log dish'}
            </p>
          )}

          <form.Subscribe selector={(state) => [state.isSubmitting]}>
            {([isSubmitting]) => (
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || logMutation.isPending || detailQuery.isLoading}
                data-testid="dish-log-submit"
              >
                {isSubmitting || logMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Adding…</>
                ) : (
                  'Add to Log'
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </>
  );
}
