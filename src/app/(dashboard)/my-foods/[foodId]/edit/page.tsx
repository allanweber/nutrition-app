'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhotoUploader } from '@/components/photo-uploader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useCustomFoodDetailQuery(foodId: string) {
  return useQuery({
    queryKey: ['foods', 'custom', foodId],
    queryFn: async () => {
      const res = await fetch(`/api/foods/custom/${foodId}`);
      if (!res.ok) throw new Error('Failed to fetch food');
      return res.json();
    },
  });
}

function NumberField({
  label, name, value, onChange, required, unit,
}: {
  label: string; name: string; value: string;
  onChange: (v: string) => void; required?: boolean; unit?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs font-semibold">
        {label}{required && ' *'}{unit && <span className="font-normal text-muted-foreground ml-1">({unit})</span>}
      </Label>
      <Input
        id={name}
        type="number"
        min="0"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        data-testid={`field-${name}`}
      />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FoodEditForm({ foodId, food }: { foodId: string; food: any }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [photoThumb, setPhotoThumb] = useState<string | null>(food.images?.thumb ?? null);
  const [form, setForm] = useState({
    name: food.name ?? '',
    brandName: food.brandName ?? '',
    servingQty: food.servingQty?.toString() ?? '',
    servingUnit: food.servingUnit ?? '',
    servingWeightGrams: food.servingWeightGrams?.toString() ?? '',
    calories: food.calories?.toString() ?? '',
    protein: food.protein?.toString() ?? '',
    carbs: food.carbs?.toString() ?? '',
    fat: food.fat?.toString() ?? '',
    fiber: food.fiber?.toString() ?? '',
    sugar: food.sugar?.toString() ?? '',
    sodium: food.sodium?.toString() ?? '',
  });

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/foods/custom/${foodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update food');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['foods', 'custom'] });
      router.push('/my-foods');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload: Record<string, unknown> = {
      name: form.name,
      calories: parseFloat(form.calories),
      protein: parseFloat(form.protein),
      carbs: parseFloat(form.carbs),
      fat: parseFloat(form.fat),
    };
    if (form.brandName) payload.brandName = form.brandName;
    if (form.servingQty) payload.servingQty = parseFloat(form.servingQty);
    if (form.servingUnit) payload.servingUnit = form.servingUnit;
    if (form.servingWeightGrams) payload.servingWeightGrams = parseFloat(form.servingWeightGrams);
    if (form.fiber) payload.fiber = parseFloat(form.fiber);
    if (form.sugar) payload.sugar = parseFloat(form.sugar);
    if (form.sodium) payload.sodium = parseFloat(form.sodium);

    try {
      await updateMutation.mutateAsync(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update food');
    }
  };

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
        <h1 className="text-4xl font-headline font-bold text-foreground">Edit Food</h1>
        <p className="text-on-surface-variant mt-1">Update nutrition values (per 100g)</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo */}
        <div className="rounded-xl border border-outline-variant/20 p-5 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-foreground mb-4">Photo</h2>
          <PhotoUploader
            currentThumb={photoThumb}
            uploadUrl={`/api/foods/custom/${foodId}/photo`}
            label="Food Photo"
            onUploaded={(thumb) => {
              setPhotoThumb(thumb);
              qc.invalidateQueries({ queryKey: ['foods', 'custom'] });
            }}
            onDeleted={() => {
              setPhotoThumb(null);
              qc.invalidateQueries({ queryKey: ['foods', 'custom'] });
            }}
            disabled={updateMutation.isPending}
          />
        </div>

        <div className="rounded-xl border border-outline-variant/20 p-5 space-y-4 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-foreground">Basic Information</h2>
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => set('name')(e.target.value)} required data-testid="field-name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brandName" className="text-xs font-semibold">Brand Name</Label>
            <Input id="brandName" value={form.brandName} onChange={(e) => set('brandName')(e.target.value)} data-testid="field-brandName" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Serving Qty" name="servingQty" value={form.servingQty} onChange={set('servingQty')} />
            <div className="space-y-1.5">
              <Label htmlFor="servingUnit" className="text-xs font-semibold">Serving Unit</Label>
              <Input id="servingUnit" value={form.servingUnit} onChange={(e) => set('servingUnit')(e.target.value)} data-testid="field-servingUnit" />
            </div>
            <NumberField label="Serving Weight" name="servingWeightGrams" value={form.servingWeightGrams} onChange={set('servingWeightGrams')} unit="g" />
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant/20 p-5 space-y-4 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-foreground">Macros <span className="font-normal text-muted-foreground">(per 100g)</span></h2>
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Calories" name="calories" value={form.calories} onChange={set('calories')} required unit="kcal" />
            <NumberField label="Protein" name="protein" value={form.protein} onChange={set('protein')} required unit="g" />
            <NumberField label="Carbohydrates" name="carbs" value={form.carbs} onChange={set('carbs')} required unit="g" />
            <NumberField label="Fat" name="fat" value={form.fat} onChange={set('fat')} required unit="g" />
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant/20 p-5 space-y-4 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-foreground">Additional Nutrients <span className="font-normal text-muted-foreground">(optional)</span></h2>
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Fiber" name="fiber" value={form.fiber} onChange={set('fiber')} unit="g" />
            <NumberField label="Sugar" name="sugar" value={form.sugar} onChange={set('sugar')} unit="g" />
            <NumberField label="Sodium" name="sodium" value={form.sodium} onChange={set('sodium')} unit="mg" />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={updateMutation.isPending} data-testid="submit-edit-food">
            {updateMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : 'Save Changes'}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/my-foods">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function EditFoodPage() {
  const params = useParams<{ foodId: string }>();
  const foodId = params.foodId;
  const foodQuery = useCustomFoodDetailQuery(foodId);

  if (foodQuery.isLoading) {
    return <div className="flex justify-center pt-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (foodQuery.isError || !foodQuery.data?.food) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-24">
        <p className="text-destructive">Food not found or you don&apos;t have permission to edit it.</p>
        <Link href="/my-foods" className="text-sm text-primary mt-4 inline-block">← Back to My Foods</Link>
      </div>
    );
  }

  return <FoodEditForm foodId={foodId} food={foodQuery.data.food} />;
}
