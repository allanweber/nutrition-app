'use client';

import { useForm } from '@tanstack/react-form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { PhotoUploader } from '@/components/photo-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { customFoodFormSchema, zodValidator } from '@/lib/form-validation';
import type { CustomFoodFormData } from '@/lib/form-validation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// ─── types ───────────────────────────────────────────────────────────────────

interface InitialFood {
  name?: string;
  brandName?: string;
  servingQty?: number | null;
  servingUnit?: string | null;
  servingWeightGrams?: number | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
  sugar?: number | null;
  sodium?: number | null;
  images?: { thumb?: string | null } | null;
}

interface CustomFoodFormProps {
  /** present → edit mode; absent → create mode */
  foodId?: string;
  initialFood?: InitialFood;
}

// ─── number field helper ──────────────────────────────────────────────────────

function NumberField({
  label,
  name,
  fieldApi,
  required,
  unit,
}: {
  label: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldApi: any;
  required?: boolean;
  unit?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs font-semibold">
        {label}
        {required && ' *'}
        {unit && <span className="font-normal text-muted-foreground ml-1">({unit})</span>}
      </Label>
      <Input
        id={name}
        type="number"
        min="0"
        step="0.1"
        value={fieldApi.state.value}
        onChange={(e) => fieldApi.handleChange(e.target.value)}
        onBlur={fieldApi.handleBlur}
        className={fieldApi.state.meta.errors.length > 0 ? 'border-destructive' : ''}
        data-testid={`field-${name}`}
      />
      {fieldApi.state.meta.errors.length > 0 && (
        <p className="text-sm text-destructive">{fieldApi.state.meta.errors[0]}</p>
      )}
    </div>
  );
}

// ─── mutations ────────────────────────────────────────────────────────────────

function useCustomFoodMutation(foodId: string | undefined) {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const url = foodId ? `/api/foods/custom/${foodId}` : '/api/foods/custom';
      const method = foodId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || (foodId ? 'Failed to update food' : 'Failed to create food'));
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['foods', 'custom'] });
      router.push('/my-foods');
    },
  });
}

// ─── component ───────────────────────────────────────────────────────────────

export function CustomFoodForm({ foodId, initialFood }: CustomFoodFormProps) {
  const isEdit = Boolean(foodId);
  const qc = useQueryClient();
  const mutation = useCustomFoodMutation(foodId);

  const toStr = (v: number | null | undefined) => (v != null ? String(v) : '');

  const defaultValues: CustomFoodFormData = {
    name: initialFood?.name ?? '',
    brandName: initialFood?.brandName ?? '',
    servingQty: (initialFood?.servingQty ?? '') as unknown as number,
    servingUnit: initialFood?.servingUnit ?? '',
    servingWeightGrams: (initialFood?.servingWeightGrams ?? '') as unknown as number,
    calories: (initialFood?.calories != null ? String(initialFood.calories) : '') as unknown as number,
    protein: (initialFood?.protein != null ? String(initialFood.protein) : '') as unknown as number,
    carbs: (initialFood?.carbs != null ? String(initialFood.carbs) : '') as unknown as number,
    fat: (initialFood?.fat != null ? String(initialFood.fat) : '') as unknown as number,
    fiber: (toStr(initialFood?.fiber)) as unknown as number,
    sugar: (toStr(initialFood?.sugar)) as unknown as number,
    sodium: (toStr(initialFood?.sodium)) as unknown as number,
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const payload: Record<string, unknown> = {
        name: value.name,
        calories: parseFloat(String(value.calories)),
        protein: parseFloat(String(value.protein)),
        carbs: parseFloat(String(value.carbs)),
        fat: parseFloat(String(value.fat)),
      };
      if (value.brandName) payload.brandName = value.brandName;
      const servingQty = parseFloat(String(value.servingQty));
      if (!Number.isNaN(servingQty)) payload.servingQty = servingQty;
      if (value.servingUnit) payload.servingUnit = value.servingUnit;
      const servingWeightGrams = parseFloat(String(value.servingWeightGrams));
      if (!Number.isNaN(servingWeightGrams)) payload.servingWeightGrams = servingWeightGrams;
      const fiber = parseFloat(String(value.fiber));
      if (!Number.isNaN(fiber)) payload.fiber = fiber;
      const sugar = parseFloat(String(value.sugar));
      if (!Number.isNaN(sugar)) payload.sugar = sugar;
      const sodium = parseFloat(String(value.sodium));
      if (!Number.isNaN(sodium)) payload.sodium = sodium;

      await mutation.mutateAsync(payload);
    },
  });

  // Reset form when initialFood loads (edit mode)
  useEffect(() => {
    if (!initialFood) return;
    form.reset({
      name: initialFood.name ?? '',
      brandName: initialFood.brandName ?? '',
      servingQty: (initialFood.servingQty != null ? String(initialFood.servingQty) : '') as unknown as number,
      servingUnit: initialFood.servingUnit ?? '',
      servingWeightGrams: (initialFood.servingWeightGrams != null ? String(initialFood.servingWeightGrams) : '') as unknown as number,
      calories: (initialFood.calories != null ? String(initialFood.calories) : '') as unknown as number,
      protein: (initialFood.protein != null ? String(initialFood.protein) : '') as unknown as number,
      carbs: (initialFood.carbs != null ? String(initialFood.carbs) : '') as unknown as number,
      fat: (initialFood.fat != null ? String(initialFood.fat) : '') as unknown as number,
      fiber: (toStr(initialFood.fiber)) as unknown as number,
      sugar: (toStr(initialFood.sugar)) as unknown as number,
      sodium: (toStr(initialFood.sodium)) as unknown as number,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFood]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div className="mb-8">
        <Link
          href="/my-foods"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          My Foods
        </Link>
        <h1 className="text-4xl font-headline font-bold text-foreground">
          {isEdit ? 'Edit Food' : 'Create Food'}
        </h1>
        <p className="text-on-surface-variant mt-1">
          {isEdit
            ? 'Update nutrition values (per 100g)'
            : 'Define a custom food with your own nutrition values (per 100g)'}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        {/* Photo — edit mode only, outside TanStack Form */}
        {isEdit && foodId && (
          <div className="rounded-xl border border-outline-variant/20 p-5 bg-surface-container-lowest">
            <h2 className="text-sm font-bold text-foreground mb-4">Photo</h2>
            <PhotoUploader
              currentThumb={initialFood?.images?.thumb ?? null}
              uploadUrl={`/api/foods/custom/${foodId}/photo`}
              label="Food Photo"
              onUploaded={() => qc.invalidateQueries({ queryKey: ['foods', 'custom'] })}
              onDeleted={() => qc.invalidateQueries({ queryKey: ['foods', 'custom'] })}
              disabled={mutation.isPending}
            />
          </div>
        )}

        {/* Basic info */}
        <div className="rounded-xl border border-outline-variant/20 p-5 space-y-4 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-foreground">Basic Information</h2>

          <form.Field
            name="name"
            validators={{ onChange: zodValidator(customFoodFormSchema.shape.name), onSubmit: zodValidator(customFoodFormSchema.shape.name) }}
          >
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">Name *</Label>
                <Input
                  id="name"
                  value={field.state.value as string}
                  onChange={(e) => field.handleChange(e.target.value as never)}
                  onBlur={field.handleBlur}
                  placeholder="e.g., Homemade Granola"
                  className={field.state.meta.errors.length > 0 ? 'border-destructive' : ''}
                  data-testid="field-name"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="brandName"
            validators={{ onChange: zodValidator(customFoodFormSchema.shape.brandName) }}
          >
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor="brandName" className="text-xs font-semibold">Brand Name</Label>
                <Input
                  id="brandName"
                  value={field.state.value as string}
                  onChange={(e) => field.handleChange(e.target.value as never)}
                  onBlur={field.handleBlur}
                  placeholder="Optional"
                  className={field.state.meta.errors.length > 0 ? 'border-destructive' : ''}
                  data-testid="field-brandName"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-3 gap-3">
            <form.Field
              name="servingQty"
              validators={{ onChange: zodValidator(customFoodFormSchema.shape.servingQty) }}
            >
              {(field) => <NumberField label="Serving Qty" name="servingQty" fieldApi={field} />}
            </form.Field>

            <form.Field
              name="servingUnit"
              validators={{ onChange: zodValidator(customFoodFormSchema.shape.servingUnit) }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor="servingUnit" className="text-xs font-semibold">Serving Unit</Label>
                  <Input
                    id="servingUnit"
                    value={field.state.value as string}
                    onChange={(e) => field.handleChange(e.target.value as never)}
                    onBlur={field.handleBlur}
                    placeholder="g, cup, tbsp…"
                    className={field.state.meta.errors.length > 0 ? 'border-destructive' : ''}
                    data-testid="field-servingUnit"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="servingWeightGrams"
              validators={{ onChange: zodValidator(customFoodFormSchema.shape.servingWeightGrams) }}
            >
              {(field) => <NumberField label="Serving Weight" name="servingWeightGrams" fieldApi={field} unit="g" />}
            </form.Field>
          </div>
        </div>

        {/* Macros */}
        <div className="rounded-xl border border-outline-variant/20 p-5 space-y-4 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-foreground">
            Macros <span className="font-normal text-muted-foreground">(per 100g)</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="calories"
              validators={{ onChange: zodValidator(customFoodFormSchema.shape.calories), onSubmit: zodValidator(customFoodFormSchema.shape.calories) }}
            >
              {(field) => <NumberField label="Calories" name="calories" fieldApi={field} required unit="kcal" />}
            </form.Field>
            <form.Field
              name="protein"
              validators={{ onChange: zodValidator(customFoodFormSchema.shape.protein), onSubmit: zodValidator(customFoodFormSchema.shape.protein) }}
            >
              {(field) => <NumberField label="Protein" name="protein" fieldApi={field} required unit="g" />}
            </form.Field>
            <form.Field
              name="carbs"
              validators={{ onChange: zodValidator(customFoodFormSchema.shape.carbs), onSubmit: zodValidator(customFoodFormSchema.shape.carbs) }}
            >
              {(field) => <NumberField label="Carbohydrates" name="carbs" fieldApi={field} required unit="g" />}
            </form.Field>
            <form.Field
              name="fat"
              validators={{ onChange: zodValidator(customFoodFormSchema.shape.fat), onSubmit: zodValidator(customFoodFormSchema.shape.fat) }}
            >
              {(field) => <NumberField label="Fat" name="fat" fieldApi={field} required unit="g" />}
            </form.Field>
          </div>
        </div>

        {/* Optional nutrients */}
        <div className="rounded-xl border border-outline-variant/20 p-5 space-y-4 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-foreground">
            Additional Nutrients <span className="font-normal text-muted-foreground">(optional, per 100g)</span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <form.Field
              name="fiber"
              validators={{ onChange: zodValidator(customFoodFormSchema.shape.fiber) }}
            >
              {(field) => <NumberField label="Fiber" name="fiber" fieldApi={field} unit="g" />}
            </form.Field>
            <form.Field
              name="sugar"
              validators={{ onChange: zodValidator(customFoodFormSchema.shape.sugar) }}
            >
              {(field) => <NumberField label="Sugar" name="sugar" fieldApi={field} unit="g" />}
            </form.Field>
            <form.Field
              name="sodium"
              validators={{ onChange: zodValidator(customFoodFormSchema.shape.sodium) }}
            >
              {(field) => <NumberField label="Sodium" name="sodium" fieldApi={field} unit="mg" />}
            </form.Field>
          </div>
        </div>

        {mutation.error && (
          <p className="text-sm text-destructive">
            {(mutation.error as Error).message}
          </p>
        )}

        <div className="flex gap-3">
          <form.Subscribe selector={(state) => [state.isSubmitting]}>
            {([isSubmitting]) => (
              <Button
                type="submit"
                disabled={isSubmitting || mutation.isPending}
                data-testid={isEdit ? 'submit-edit-food' : 'submit-create-food'}
              >
                {isSubmitting || mutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                  : isEdit ? 'Save Changes' : 'Create Food'}
              </Button>
            )}
          </form.Subscribe>
          <Button variant="outline" asChild>
            <Link href="/my-foods">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
