'use client';

import { useEffect, useRef } from 'react';
import { useForm } from '@tanstack/react-form';
import { X, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from '@/lib/nutrition-constants';
import { useCreateFoodLogMutation } from '@/queries/food-logs';
import type { FoodAddModalProps } from '@/components/food-search-field/types';

export function FoodLogAddModal({ open, food, foodDetail, isDetailLoading, onClose, onAdded }: FoodAddModalProps) {
  const createMutation = useCreateFoodLogMutation();
  const overlayRef = useRef<HTMLDivElement>(null);

  const form = useForm({
    defaultValues: {
      mealType: 'breakfast',
      servingId: 'base',
      quantity: '1',
    },
    onSubmit: async ({ value }) => {
      if (!foodDetail) return;

      let altMeasureId: string | null = null;
      let quantity = value.quantity;

      if (value.servingId !== 'base' && foodDetail) {
        const serving = foodDetail.servings.find((s) => String(s.id) === value.servingId);
        if (serving) {
          altMeasureId = serving.id;
          quantity = String(parseFloat(value.quantity) * serving.weightGrams);
        }
      }

      await createMutation.mutateAsync({
        foodId: foodDetail.id,
        altMeasureId,
        quantity,
        mealType: value.mealType,
      });

      onAdded();
    },
  });

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !food) return null;

  const servings = foodDetail?.servings ?? [];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      data-testid="food-add-modal"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Dialog */}
      <div
        className="relative z-10 bg-background border border-border rounded-lg shadow-xl w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border">
          <div>
            <h2 id="add-modal-title" className="font-semibold text-foreground">
              Add to Diary
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-[280px]">{food.name}</p>
            {food.brandName && (
              <p className="text-xs text-muted-foreground">{food.brandName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {isDetailLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading nutrition info…</span>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              {/* Meal type */}
              <form.Field name="mealType">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="modal-meal-type">Meal</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                    >
                      <SelectTrigger id="modal-meal-type" data-testid="meal-type-select">
                        <SelectValue />
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
                )}
              </form.Field>

              {/* Serving size */}
              <form.Field name="servingId">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="modal-serving">Serving size</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                    >
                      <SelectTrigger id="modal-serving" data-testid="serving-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="base">100g (base)</SelectItem>
                        {servings.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.description} ({s.weightGrams}g · {s.calories.toFixed(0)} kcal)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Quantity */}
              <form.Field name="quantity">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="modal-quantity">Quantity</Label>
                    <Input
                      id="modal-quantity"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      data-testid="quantity-input"
                    />
                  </div>
                )}
              </form.Field>

              {/* Error */}
              {createMutation.error && (
                <p className="text-sm text-destructive">
                  {(createMutation.error as Error).message ?? "Couldn't save entry. Try again."}
                </p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
                data-testid="add-food-button"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Log
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
