import { NutritionSourceFood } from "@/lib/nutrition-sources/types";
import { ServingOption } from "./types";

export function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0;
}

export function roundTo(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const p = 10 ** decimals;
  return Math.round(value * p) / p;
}

export function safeGrams(value: unknown) {
  const num = asNumber(value);
  if (!Number.isFinite(num) || num <= 0) return 100;
  return Math.max(1, Math.round(num));
}

export function computeQuantityFromGrams(input: { grams: number; servingWeightGrams: number; servingQty: number }) {
  const { grams, servingWeightGrams, servingQty } = input;
  if (!Number.isFinite(grams) || grams <= 0) return servingQty;
  if (!Number.isFinite(servingWeightGrams) || servingWeightGrams <= 0) return servingQty;
  if (!Number.isFinite(servingQty) || servingQty <= 0) return 1;

  const multiplier = grams / servingWeightGrams;
  return servingQty * multiplier;
}

export function buildServingOptions(food: NutritionSourceFood): { options: ServingOption[]; defaultId: string } {
  const baseServingQty = Number.isFinite(food.servingQty) && food.servingQty > 0 ? food.servingQty : 1;
  const baseServingGrams =
    Number.isFinite(food.servingWeightGrams) && (food.servingWeightGrams ?? 0) > 0 ? food.servingWeightGrams! : 100;

  const base: ServingOption = {
    id: 'base',
    label: `${baseServingQty} ${food.servingUnit}`,
    qty: baseServingQty,
    measure: food.servingUnit,
    grams: baseServingGrams,
  };

  const alt = (food.altMeasures ?? [])
    .map((m, idx) => {
      const qty = asNumber(m.qty);
      const grams = asNumber(m.servingWeight);
      const measure = typeof m.measure === 'string' ? m.measure : 'serving';
      return {
        id: `alt-${m.seq ?? idx + 1}-${idx}`,
        label: measure,
        qty: qty || 1,
        measure,
        grams: grams || baseServingGrams,
      } satisfies ServingOption;
    })
    .sort((a, b) => {
      const aSeq = Number(a.id.split('-')[1]) || 0;
      const bSeq = Number(b.id.split('-')[1]) || 0;
      return aSeq - bSeq;
    });

  const options = (() => {
    const seen = new Set<string>();
    const unique: ServingOption[] = [];

    for (const option of [base, ...alt]) {
      const key = `${option.qty}-${option.measure}-${Math.round(option.grams)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(option);
    }

    return unique;
  })();

  const defaultId = alt.length > 0 ? alt[0].id : base.id;

  return { options, defaultId };
}