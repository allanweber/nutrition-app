'use client';

import { useForm } from '@tanstack/react-form';
import { Loader2, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from '@/lib/nutrition-constants';
import { foodLogFormSchema, zodValidator } from '@/lib/form-validation';
import type { FoodLogFormData } from '@/lib/form-validation';
import { useCreateFoodLogMutation } from '@/queries/food-logs';
import type { FoodDetailResponse } from '@/queries/food-detail';

interface FoodLogAddFormProps {
  foodDetail: FoodDetailResponse;
  onAdded: () => void;
}

export function FoodLogAddForm({ foodDetail, onAdded }: FoodLogAddFormProps) {
  const createMutation = useCreateFoodLogMutation();

  const form = useForm({
    defaultValues: {
      mealType: 'breakfast' as FoodLogFormData['mealType'],
      servingId: 'base',
      quantity: 1,
    },
    onSubmit: async ({ value }) => {
      let altMeasureId: string | null = null;
      let quantity = String(value.quantity);

      if (value.servingId !== 'base' && foodDetail) {
        const serving = foodDetail.servings.find((s) => String(s.id) === String(value.servingId));
        if (serving) {
          altMeasureId = serving.id;
          quantity = String(parseFloat(String(value.quantity)) * serving.weightGrams);
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

  const servings = foodDetail.servings ?? [];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      {/* Meal type */}
      <form.Field
        name="mealType"
        validators={{ onChange: zodValidator(foodLogFormSchema.shape.mealType) }}
      >
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor="modal-meal-type">Meal</Label>
            <Select
              value={field.state.value}
              onValueChange={(v) => field.handleChange(v as FoodLogFormData['mealType'])}
            >
              <SelectTrigger
                id="modal-meal-type"
                className={field.state.meta.errors.length > 0 ? 'border-destructive' : ''}
                data-testid="meal-type-select"
              >
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
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>

      {/* Serving size */}
      <form.Field
        name="servingId"
        validators={{ onChange: zodValidator(foodLogFormSchema.shape.servingId) }}
      >
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor="modal-serving">Serving size</Label>
            <Select
              value={field.state.value}
              onValueChange={(v) => field.handleChange(v)}
            >
              <SelectTrigger
                id="modal-serving"
                className={field.state.meta.errors.length > 0 ? 'border-destructive' : ''}
                data-testid="serving-select"
              >
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
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>

      {/* Quantity */}
      <form.Field
        name="quantity"
        validators={{ onChange: zodValidator(foodLogFormSchema.shape.quantity) }}
      >
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor="modal-quantity">Quantity</Label>
            <Input
              id="modal-quantity"
              type="number"
              min="0.1"
              step="0.1"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value as never)}
              onBlur={field.handleBlur}
              className={field.state.meta.errors.length > 0 ? 'border-destructive' : ''}
              data-testid="quantity-input"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>

      {/* API error */}
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
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Adding…</>
        ) : (
          <><Plus className="h-4 w-4 mr-2" />Add to Log</>
        )}
      </Button>
    </form>
  );
}
