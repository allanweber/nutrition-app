'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface FoodFormData {
  name: string;
  brandName: string;
  servingQty: string;
  servingUnit: string;
  servingWeightGrams: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  sodium: string;
}

function useCreateCustomFoodMutation() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/foods/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create food');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['foods', 'custom'] });
      router.push('/my-foods');
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

export default function CreateFoodPage() {
  const createMutation = useCreateCustomFoodMutation();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FoodFormData>({
    name: '', brandName: '', servingQty: '100', servingUnit: 'g',
    servingWeightGrams: '100', calories: '', protein: '', carbs: '', fat: '',
    fiber: '', sugar: '', sodium: '',
  });

  const set = (field: keyof FoodFormData) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

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
      await createMutation.mutateAsync(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create food');
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
        <h1 className="text-4xl font-headline font-bold text-foreground">Create Food</h1>
        <p className="text-on-surface-variant mt-1">Define a custom food with your own nutrition values (per 100g)</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="rounded-xl border border-outline-variant/20 p-5 space-y-4 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-foreground">Basic Information</h2>
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set('name')(e.target.value)}
              required
              placeholder="e.g., Homemade Granola"
              data-testid="field-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brandName" className="text-xs font-semibold">Brand Name</Label>
            <Input
              id="brandName"
              value={form.brandName}
              onChange={(e) => set('brandName')(e.target.value)}
              placeholder="Optional"
              data-testid="field-brandName"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Serving Qty" name="servingQty" value={form.servingQty} onChange={set('servingQty')} />
            <div className="space-y-1.5">
              <Label htmlFor="servingUnit" className="text-xs font-semibold">Serving Unit</Label>
              <Input
                id="servingUnit"
                value={form.servingUnit}
                onChange={(e) => set('servingUnit')(e.target.value)}
                placeholder="g, cup, tbsp…"
                data-testid="field-servingUnit"
              />
            </div>
            <NumberField label="Serving Weight" name="servingWeightGrams" value={form.servingWeightGrams} onChange={set('servingWeightGrams')} unit="g" />
          </div>
        </div>

        {/* Macros */}
        <div className="rounded-xl border border-outline-variant/20 p-5 space-y-4 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-foreground">Macros <span className="font-normal text-muted-foreground">(per 100g)</span></h2>
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Calories" name="calories" value={form.calories} onChange={set('calories')} required unit="kcal" />
            <NumberField label="Protein" name="protein" value={form.protein} onChange={set('protein')} required unit="g" />
            <NumberField label="Carbohydrates" name="carbs" value={form.carbs} onChange={set('carbs')} required unit="g" />
            <NumberField label="Fat" name="fat" value={form.fat} onChange={set('fat')} required unit="g" />
          </div>
        </div>

        {/* Extra nutrients */}
        <div className="rounded-xl border border-outline-variant/20 p-5 space-y-4 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-foreground">Additional Nutrients <span className="font-normal text-muted-foreground">(optional, per 100g)</span></h2>
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Fiber" name="fiber" value={form.fiber} onChange={set('fiber')} unit="g" />
            <NumberField label="Sugar" name="sugar" value={form.sugar} onChange={set('sugar')} unit="g" />
            <NumberField label="Sodium" name="sodium" value={form.sodium} onChange={set('sodium')} unit="mg" />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={createMutation.isPending} data-testid="submit-create-food">
            {createMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : 'Create Food'}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/my-foods">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
