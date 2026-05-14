'use client';

import { useForm } from '@tanstack/react-form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/page-header';
import { PhotoUploader } from '@/components/photo-uploader';
import { ServingUnitSelect } from '@/components/serving-unit-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { customFoodFormSchema, zodValidator } from '@/lib/form-validation';
import type { CustomFoodFormData, ServingUnit } from '@/lib/form-validation';
import { resizeForUpload } from '@/lib/image-resize';
import { cn } from '@/lib/utils';
import {
  MACRO_CELL_BG,
  MACRO_CELL_TEXT,
} from '@/lib/nutrition-constants';
import { MacroInputCard } from '@/components/macro-input-card';
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

  return useMutation({
    mutationFn: async (data: Record<string, unknown>): Promise<{ food: { id: string } }> => {
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
    },
    onError: (err) => {
      toast.error((err as Error).message ?? 'Failed to save.');
    },
  });
}

// ─── step label ───────────────────────────────────────────────────────────────

function StepLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
      {children}
    </p>
  );
}

// ─── component ───────────────────────────────────────────────────────────────

export function CustomFoodForm({ foodId, initialFood }: CustomFoodFormProps) {
  const isEdit = Boolean(foodId);
  const router = useRouter();
  const qc = useQueryClient();
  const mutation = useCustomFoodMutation(foodId);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  const toStr = (v: number | null | undefined) => (v != null ? String(v) : '');

  const defaultValues: CustomFoodFormData = {
    name: initialFood?.name ?? '',
    brandName: initialFood?.brandName ?? '',
    servingQty: (initialFood?.servingQty ?? '') as unknown as number,
    servingUnit: (initialFood?.servingUnit as ServingUnit | undefined) ?? undefined,
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

      const result = await mutation.mutateAsync(payload);

      if (!isEdit && pendingImageFile) {
        try {
          const resized = await resizeForUpload(pendingImageFile);
          const fd = new FormData();
          fd.append('thumb', resized.thumb, 'thumb.jpg');
          fd.append('display', resized.display, 'display.jpg');
          await fetch(`/api/foods/custom/${result.food.id}/photo`, { method: 'POST', body: fd });
        } catch {
          // image upload is non-blocking; food was created successfully
        }
      }

      router.push('/my-foods');
    },
  });

  // Reset form when initialFood loads (edit mode)
  useEffect(() => {
    if (!initialFood) return;
    form.reset({
      name: initialFood.name ?? '',
      brandName: initialFood.brandName ?? '',
      servingQty: (initialFood.servingQty != null ? String(initialFood.servingQty) : '') as unknown as number,
      servingUnit: (initialFood.servingUnit as ServingUnit | undefined) ?? undefined,
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16">
      {/* Back link */}
      <Link
        href="/my-foods"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        My Foods
      </Link>

      {/* Page header */}
      <PageHeader
        title={isEdit ? (initialFood?.name ?? 'Edit Food') : 'Create Food'}
        subtitle={
          isEdit
            ? (initialFood?.brandName ?? 'Update nutrition values (per 100g)')
            : 'Define a custom food with your own nutrition values (per 100g)'
        }
        className="mb-5"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-10"
      >
        {/* Step 1: Photo */}
        <section>
          <StepLabel>Step 1: Food Photo</StepLabel>
          <PhotoUploader
            currentThumb={isEdit ? (initialFood?.images?.thumb ?? null) : null}
            uploadUrl={isEdit && foodId ? `/api/foods/custom/${foodId}/photo` : undefined}
            onFileSelected={!isEdit ? (file) => setPendingImageFile(file) : undefined}
            onUploaded={isEdit ? () => qc.invalidateQueries({ queryKey: ['foods', 'custom'] }) : undefined}
            onDeleted={isEdit ? () => qc.invalidateQueries({ queryKey: ['foods', 'custom'] }) : undefined}
            disabled={mutation.isPending}
          />
        </section>

        {/* Step 2: General Info */}
        <section>
          <StepLabel>Step 2: General Info</StepLabel>
          <div className="rounded-xl border border-border p-6 bg-background space-y-6">
            {/* Name + Brand */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form.Field
                name="name"
                validators={{ onChange: zodValidator(customFoodFormSchema.shape.name), onSubmit: zodValidator(customFoodFormSchema.shape.name) }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold">Food Name *</Label>
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
                    <Label htmlFor="brandName" className="text-xs font-semibold">
                      Brand Name <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="brandName"
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value as never)}
                      onBlur={field.handleBlur}
                      placeholder="e.g., Chobani"
                      className={field.state.meta.errors.length > 0 ? 'border-destructive' : ''}
                      data-testid="field-brandName"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            {/* Serving fields */}
            <div className="grid grid-cols-3 gap-4">
              <form.Field
                name="servingQty"
                validators={{
                  onChange: zodValidator(customFoodFormSchema.shape.servingQty),
                  onSubmit: ({ value }) => (!value && value !== 0 ? 'Serving qty is required' : undefined),
                }}
              >
                {(field) => <NumberField label="Serving Qty" name="servingQty" fieldApi={field} required />}
              </form.Field>

              <form.Field
                name="servingUnit"
                validators={{
                  onChange: zodValidator(customFoodFormSchema.shape.servingUnit),
                  onSubmit: ({ value }) => (!value ? 'Serving unit is required' : undefined),
                }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="servingUnit" className="text-xs font-semibold">Serving Unit *</Label>
                    <ServingUnitSelect
                      id="servingUnit"
                      value={field.state.value as string}
                      onChange={(v) => field.handleChange(v as never)}
                      error={field.state.meta.errors[0] as string | undefined}
                      disabled={mutation.isPending}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field
                name="servingWeightGrams"
                validators={{
                  onChange: zodValidator(customFoodFormSchema.shape.servingWeightGrams),
                  onSubmit: ({ value }) => (!value && value !== 0 ? 'Weight is required' : undefined),
                }}
              >
                {(field) => <NumberField label="Weight" name="servingWeightGrams" fieldApi={field} required unit="g" />}
              </form.Field>
            </div>
          </div>
        </section>

        {/* Step 3: Nutrition Details */}
        <section>
          <StepLabel>Step 3: Nutrition Details (per 100g)</StepLabel>

          {/* Macro cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <form.Field
              name="calories"
              validators={{ onChange: zodValidator(customFoodFormSchema.shape.calories), onSubmit: zodValidator(customFoodFormSchema.shape.calories) }}
            >
              {(field) => (
                <MacroInputCard label="Calories" name="calories" fieldApi={field} unit="kcal" />
              )}
            </form.Field>

            <form.Field
              name="protein"
              validators={{ onChange: zodValidator(customFoodFormSchema.shape.protein), onSubmit: zodValidator(customFoodFormSchema.shape.protein) }}
            >
              {(field) => (
                <MacroInputCard
                  label="Protein"
                  name="protein"
                  fieldApi={field}
                  unit="g"
                  bgClass={cn(MACRO_CELL_BG.protein, 'border-border')}
                  textClass={MACRO_CELL_TEXT.protein}
                />
              )}
            </form.Field>

            <form.Field
              name="carbs"
              validators={{ onChange: zodValidator(customFoodFormSchema.shape.carbs), onSubmit: zodValidator(customFoodFormSchema.shape.carbs) }}
            >
              {(field) => (
                <MacroInputCard
                  label="Carbs"
                  name="carbs"
                  fieldApi={field}
                  unit="g"
                  bgClass={cn(MACRO_CELL_BG.carbs, 'border-border')}
                  textClass={MACRO_CELL_TEXT.carbs}
                />
              )}
            </form.Field>

            <form.Field
              name="fat"
              validators={{ onChange: zodValidator(customFoodFormSchema.shape.fat), onSubmit: zodValidator(customFoodFormSchema.shape.fat) }}
            >
              {(field) => (
                <MacroInputCard
                  label="Fat"
                  name="fat"
                  fieldApi={field}
                  unit="g"
                  bgClass={cn(MACRO_CELL_BG.fat, 'border-border')}
                  textClass={MACRO_CELL_TEXT.fat}
                />
              )}
            </form.Field>
          </div>

          {/* Additional nutrients */}
          <div className="rounded-xl border border-border p-6 bg-background mt-4">
            <div className="flex items-baseline gap-2 mb-4">
              <p className="text-sm font-bold text-foreground">Additional Nutrients</p>
              <span className="text-xs text-muted-foreground">(optional)</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
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
        </section>

        {/* Footer actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" asChild className="flex-1">
            <Link href="/my-foods">Cancel</Link>
          </Button>
          <form.Subscribe selector={(state): [boolean, boolean, CustomFoodFormData] => [state.isSubmitting, state.canSubmit, state.values]}>
            {([isSubmitting, canSubmit, values]) => {
              const v = values as CustomFoodFormData;
              const hasRequired = Boolean(v.name && v.calories !== ('' as never) && v.protein !== ('' as never) && v.carbs !== ('' as never) && v.fat !== ('' as never));
              return (
              <Button
                type="submit"
                disabled={!canSubmit || !hasRequired || isSubmitting || mutation.isPending}
                className="flex-2"
                data-testid={isEdit ? 'submit-edit-food' : 'submit-create-food'}
              >
                {isSubmitting || mutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                  : isEdit ? 'Save Changes' : 'Create Food'}
              </Button>
              );
            }}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}
