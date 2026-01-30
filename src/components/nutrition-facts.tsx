'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';

import type { NutritionSourceFood } from '@/lib/nutrition-sources/types';

type MacroSummary = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
};

const DAILY_VALUES = {
  totalFat: 78,
  satFat: 20,
  cholesterol: 300,
  sodium: 2300,
  carbs: 275,
  fiber: 28,
  protein: 50,
  addedSugars: 50,
  vitaminA: 0.9,
  vitaminC: 90,
  vitaminD: 0.02,
  calcium: 1300,
  iron: 18,
  potassium: 4700,
};

const NUTRIENT_ATTR_IDS = {
  saturatedFat: 606,
  transFat: 605,
  polyunsaturatedFat: 646,
  monounsaturatedFat: 645,
  cholesterol: 601,
  potassium: 306,
  calcium: 301,
  iron: 303,
  vitaminA: 318,
  vitaminC: 401,
  vitaminD: 328,
} as const;

export type NutritionFactsSelection = {
  grams: number;
  servingUnit: string;
  quantity: string;
  macros: MacroSummary;
  servingLabel: string;
};

type ServingOption = {
  id: string;
  label: string;
  qty: number;
  measure: string;
  grams: number;
};

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return 0;
}

function roundTo(value: number, decimals: number) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function dvPercent(value: number | undefined, dailyValue: number) {
  if (value == null || !Number.isFinite(value) || dailyValue <= 0) return undefined;
  return Math.round((value / dailyValue) * 100);
}

function DvCell(props: { percent: number | undefined }) {
  const { percent } = props;
  return (
    <span className="text-[10px] text-muted-foreground tabular-nums">{percent == null ? '—' : `${percent}%`}</span>
  );
}

function formatAmount(value: number | undefined, unit: string) {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value} ${unit}`;
}

function computeQuantityFromGrams(input: { grams: number; servingWeightGrams: number; servingQty: number }) {
  const { grams, servingWeightGrams, servingQty } = input;
  if (!Number.isFinite(grams) || grams <= 0) return servingQty;
  if (!Number.isFinite(servingWeightGrams) || servingWeightGrams <= 0) return servingQty;
  if (!Number.isFinite(servingQty) || servingQty <= 0) return 1;

  const multiplier = grams / servingWeightGrams;
  return servingQty * multiplier;
}

function safeGrams(value: unknown) {
  const num = asNumber(value);
  if (!Number.isFinite(num) || num <= 0) return 100;
  return Math.max(1, Math.round(num));
}

function buildServingOptions(food: NutritionSourceFood): { options: ServingOption[]; defaultId: string } {
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
        label: `${qty || 1} ${measure}`,
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

  // Default to the first alt-measure if available (typically the most human-friendly serving).
  const defaultId = alt.length > 0 ? alt[0].id : base.id;

  return { options, defaultId };
}

export default function NutritionFacts(props: {
  food: NutritionSourceFood;
  isBusy?: boolean;
  actionLabel?: string;
  showActionButton?: boolean;
  showCancelButton?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onChange?: (selection: NutritionFactsSelection) => void;
  onServingSelectOpenChange?: (open: boolean) => void;
}) {
  const {
    food,
    isBusy = false,
    actionLabel = 'Add to Log',
    showActionButton = true,
    showCancelButton = true,
    onCancel,
    onConfirm,
    onChange,
    onServingSelectOpenChange,
  } = props;

  const { options, defaultId } = useMemo(() => buildServingOptions(food), [food]);

  const [selectedOptionId, setSelectedOptionId] = useState<string>(defaultId);
  const selectedOption = useMemo(
    () => options.find((o) => o.id === selectedOptionId) ?? options[0],
    [options, selectedOptionId],
  );

  const [grams, setGrams] = useState<number>(() => safeGrams(selectedOption?.grams));

  useEffect(() => {
    setSelectedOptionId(defaultId);
  }, [defaultId]);

  useEffect(() => {
    setGrams(safeGrams(selectedOption?.grams));
  }, [selectedOptionId, selectedOption?.grams]);

  const baseServingGrams =
    Number.isFinite(food.servingWeightGrams) && (food.servingWeightGrams ?? 0) > 0 ? food.servingWeightGrams! : 100;

  const selectedUnitGrams = selectedOption?.grams ?? baseServingGrams;
  const maxUnits = Math.max(1, Math.floor(500 / Math.max(1, selectedUnitGrams)) || 1);
  const unitCount = Math.max(1, Math.min(maxUnits, Math.round(grams / Math.max(1, selectedUnitGrams))));

  const multiplier = baseServingGrams > 0 ? grams / baseServingGrams : 1;

  const nutrientByAttrId = useMemo(() => {
    const map = new Map<number, number>();
    for (const nutrient of food.fullNutrients ?? []) {
      const attrId = asNumber(nutrient?.attr_id);
      const value = asNumber(nutrient?.value);
      if (!Number.isFinite(attrId) || attrId <= 0) continue;
      if (!Number.isFinite(value)) continue;
      if (map.has(attrId)) continue;
      map.set(attrId, value);
    }
    return map;
  }, [food.fullNutrients]);

  const satFatG = (() => {
    const base = nutrientByAttrId.get(NUTRIENT_ATTR_IDS.saturatedFat);
    if (base == null) return undefined;
    return roundTo(base * multiplier, 1);
  })();

  const transFatG = (() => {
    const base = nutrientByAttrId.get(NUTRIENT_ATTR_IDS.transFat);
    if (base == null) return undefined;
    return roundTo(base * multiplier, 1);
  })();

  const polyFatG = (() => {
    const base = nutrientByAttrId.get(NUTRIENT_ATTR_IDS.polyunsaturatedFat);
    if (base == null) return undefined;
    return roundTo(base * multiplier, 1);
  })();

  const monoFatG = (() => {
    const base = nutrientByAttrId.get(NUTRIENT_ATTR_IDS.monounsaturatedFat);
    if (base == null) return undefined;
    return roundTo(base * multiplier, 1);
  })();

  const cholesterolMg = (() => {
    const base = nutrientByAttrId.get(NUTRIENT_ATTR_IDS.cholesterol);
    if (base == null) return undefined;
    return Math.round(base * multiplier);
  })();

  const potassiumMg = (() => {
    const base = nutrientByAttrId.get(NUTRIENT_ATTR_IDS.potassium);
    if (base == null) return undefined;
    return Math.round(base * multiplier);
  })();

  const calciumMg = (() => {
    const base = nutrientByAttrId.get(NUTRIENT_ATTR_IDS.calcium);
    if (base == null) return undefined;
    return Math.round(base * multiplier);
  })();

  const ironMg = (() => {
    const base = nutrientByAttrId.get(NUTRIENT_ATTR_IDS.iron);
    if (base == null) return undefined;
    return roundTo(base * multiplier, 1);
  })();

  const vitaminAMg = (() => {
    const baseIU = nutrientByAttrId.get(NUTRIENT_ATTR_IDS.vitaminA);
    if (baseIU == null) return undefined;
    const scaledIU = baseIU * multiplier;
    // Best-effort conversion: assume Vitamin A value is IU (retinol). 1 IU ≈ 0.3 mcg RAE.
    const mcg = scaledIU * 0.3;
    return roundTo(mcg / 1000, 3);
  })();

  const vitaminCMg = (() => {
    const base = nutrientByAttrId.get(NUTRIENT_ATTR_IDS.vitaminC);
    if (base == null) return undefined;
    return roundTo(base * multiplier, 1);
  })();

  const vitaminDMg = (() => {
    const baseMcg = nutrientByAttrId.get(NUTRIENT_ATTR_IDS.vitaminD);
    if (baseMcg == null) return undefined;
    const mcg = baseMcg * multiplier;
    return roundTo(mcg / 1000, 3);
  })();

  const macros: MacroSummary = useMemo(
    () => ({
      calories: Math.round(asNumber(food.calories) * multiplier),
      fat: roundTo(asNumber(food.fat) * multiplier, 1),
      carbs: roundTo(asNumber(food.carbs) * multiplier, 1),
      protein: roundTo(asNumber(food.protein) * multiplier, 1),
      fiber: food.fiber != null ? roundTo(asNumber(food.fiber) * multiplier, 1) : undefined,
      sugar: food.sugar != null ? roundTo(asNumber(food.sugar) * multiplier, 1) : undefined,
      sodium: food.sodium != null ? Math.round(asNumber(food.sodium) * multiplier) : undefined,
    }),
    [food.calories, food.carbs, food.fat, food.fiber, food.protein, food.sodium, food.sugar, multiplier],
  );

  const quantityValue = computeQuantityFromGrams({
    grams,
    servingWeightGrams: selectedOption?.grams ?? baseServingGrams,
    servingQty: selectedOption?.qty ?? 1,
  });

  const selection: NutritionFactsSelection = useMemo(
    () => ({
      grams,
      servingUnit: selectedOption?.measure ?? food.servingUnit,
      quantity: String(roundTo(quantityValue, 2)),
      macros,
      servingLabel: selectedOption?.label ?? `${food.servingQty} ${food.servingUnit}`,
    }),
    [food.servingQty, food.servingUnit, grams, macros, quantityValue, selectedOption?.label, selectedOption?.measure],
  );

  useEffect(() => {
    onChange?.(selection);
  }, [onChange, selection]);

  const imageUrl = (food.photo?.highres || food.photo?.thumb || '').trim();
  const showImage = imageUrl.length > 0;

  return (
    <div className="p-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-2xl font-semibold text-foreground ml-4">{food.name}</div>
          {food.brandName ? (
            <div className="truncate text-xs text-muted-foreground">{food.brandName}</div>
          ) : null}
        </div>
        {showCancelButton ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="shrink-0">
            Cancel
          </Button>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[132px_1fr]">
        <div className="flex items-start justify-center">
          {showImage ? (
            <img
              src={imageUrl}
              alt={food.name}
              className="h-[112px] w-[112px] rounded-md border bg-muted object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-[112px] w-[112px] rounded-md border bg-muted" />
          )}
        </div>

        <div className="min-w-0">
          <div className="w-full max-w-[440px] space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-foreground">Serving</label>
              <Select
                value={selectedOptionId}
                onValueChange={(value) => {
                  setSelectedOptionId(value);
                }}
                onOpenChange={onServingSelectOpenChange}
              >
                <SelectTrigger className="h-9 text-sm w-full max-w-[440px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label} ({Math.round(o.grams)}g)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="flex flex-nowrap items-center gap-2 text-xs">
                <span className="font-medium text-foreground">Serving size</span>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={String(grams)}
                  onChange={(e) => {
                    const next = safeGrams(e.target.value);
                    setGrams(next);
                  }}
                  className="h-8 w-[72px] text-sm"
                  aria-label="Serving size in grams"
                  data-testid="serving-grams-input"
                />
                <span className="text-muted-foreground">g</span>
                <span className="min-w-0 truncate text-muted-foreground">
                  ({Math.round(selectedOption?.grams ?? baseServingGrams)}g = {selectedOption?.label})
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-7">1x</span>
                <input
                  type="range"
                  min={1}
                  max={maxUnits}
                  step={1}
                  value={String(unitCount)}
                  onChange={(e) => {
                    const nextUnits = Math.max(1, Math.min(maxUnits, Math.round(asNumber(e.target.value))));
                    setGrams(safeGrams(nextUnits * selectedUnitGrams));
                  }}
                  className="w-full flex-1"
                  aria-label="Serving size slider"
                />
                <span className="w-10 text-right">{maxUnits}x</span>
              </div>
            </div>

            <div className="inline-block w-full max-w-[440px] border-2 border-foreground bg-background p-4 text-[12px] leading-tight">
              <div className="flex items-end justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-wide">Amount per serving</div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground">per {grams}g</div>
                  <div className="text-[10px] font-semibold text-muted-foreground">% Daily Value*</div>
                </div>
              </div>

              <div className="mt-2 border-t-2 border-foreground pt-2">
                <div className="flex items-baseline justify-between">
                  <div className="text-lg font-bold">Calories</div>
                  <div className="text-2xl font-black tabular-nums">{macros.calories}</div>
                </div>
              </div>

              <div className="mt-2 h-2 bg-foreground" />

              <div className="mt-2 border-t border-foreground pt-2">
                <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-2">
                  <span>Total Fat</span>
                  <span className="font-semibold tabular-nums">{macros.fat}g</span>
                  <DvCell percent={dvPercent(macros.fat, DAILY_VALUES.totalFat)} />
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                  <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                    <span className="pl-3 text-muted-foreground">Saturated Fat</span>
                    <span className="font-semibold tabular-nums">{formatAmount(satFatG, 'g')}</span>
                    <DvCell percent={dvPercent(satFatG, DAILY_VALUES.satFat)} />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                  <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                    <span className="pl-3 text-muted-foreground">Trans Fat</span>
                    <span className="font-semibold tabular-nums">{formatAmount(transFatG, 'g')}</span>
                    <DvCell percent={dvPercent(transFatG, DAILY_VALUES.totalFat)} />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                  <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                    <span className="pl-3 text-muted-foreground">Polyunsaturated Fat</span>
                    <span className="font-semibold tabular-nums">{formatAmount(polyFatG, 'g')}</span>
                    <DvCell percent={dvPercent(polyFatG, DAILY_VALUES.totalFat)} />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                  <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                    <span className="pl-3 text-muted-foreground">Monounsaturated Fat</span>
                    <span className="font-semibold tabular-nums">{formatAmount(monoFatG, 'g')}</span>
                    <DvCell percent={dvPercent(monoFatG, DAILY_VALUES.totalFat)} />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                  <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                    <span>Cholesterol</span>
                    <span className="font-semibold tabular-nums">{formatAmount(cholesterolMg, 'mg')}</span>
                    <DvCell percent={dvPercent(cholesterolMg, DAILY_VALUES.cholesterol)} />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                  <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                    <span>Sodium</span>
                    <span className="font-semibold tabular-nums">{formatAmount(macros.sodium, 'mg')}</span>
                    <DvCell percent={dvPercent(macros.sodium, DAILY_VALUES.sodium)} />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                  <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                    <span>Total Carbohydrate</span>
                    <span className="font-semibold tabular-nums">{macros.carbs}g</span>
                    <DvCell percent={dvPercent(macros.carbs, DAILY_VALUES.carbs)} />
                  </div>
                </div>
                {macros.fiber != null ? (
                  <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                    <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                      <span className="pl-3 text-muted-foreground">Dietary Fiber</span>
                      <span className="font-semibold tabular-nums">{macros.fiber}g</span>
                      <DvCell percent={dvPercent(macros.fiber, DAILY_VALUES.fiber)} />
                    </div>
                  </div>
                ) : null}
                {macros.sugar != null ? (
                  <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                    <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                      <span className="pl-3 text-muted-foreground">Total Sugars</span>
                      <span className="font-semibold tabular-nums">{macros.sugar}g</span>
                      <DvCell percent={dvPercent(macros.sugar, DAILY_VALUES.addedSugars)} />
                    </div>
                  </div>
                ) : null}
                <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                  <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                    <span>Protein</span>
                    <span className="font-semibold tabular-nums">{macros.protein}g</span>
                    <DvCell percent={dvPercent(macros.protein, DAILY_VALUES.protein)} />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                  <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                    <span>Vitamin D</span>
                    <span className="font-semibold tabular-nums">{formatAmount(vitaminDMg, 'mg')}</span>
                    <DvCell percent={dvPercent(vitaminDMg, DAILY_VALUES.vitaminD)} />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                  <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                    <span>Vitamin A</span>
                    <span className="font-semibold tabular-nums">{formatAmount(vitaminAMg, 'mg')}</span>
                    <DvCell percent={dvPercent(vitaminAMg, DAILY_VALUES.vitaminA)} />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                  <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                    <span>Vitamin C</span>
                    <span className="font-semibold tabular-nums">{formatAmount(vitaminCMg, 'mg')}</span>
                    <DvCell percent={dvPercent(vitaminCMg, DAILY_VALUES.vitaminC)} />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                  <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                    <span>Calcium</span>
                    <span className="font-semibold tabular-nums">{formatAmount(calciumMg, 'mg')}</span>
                    <DvCell percent={dvPercent(calciumMg, DAILY_VALUES.calcium)} />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                  <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                    <span>Iron</span>
                    <span className="font-semibold tabular-nums">{formatAmount(ironMg, 'mg')}</span>
                    <DvCell percent={dvPercent(ironMg, DAILY_VALUES.iron)} />
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-foreground/70 pt-1.5">
                  <div className="grid w-full grid-cols-[1fr_auto_auto] items-baseline gap-2">
                    <span>Potassium</span>
                    <span className="font-semibold tabular-nums">{formatAmount(potassiumMg, 'mg')}</span>
                    <DvCell percent={dvPercent(potassiumMg, DAILY_VALUES.potassium)} />
                  </div>
                </div>
              </div>
              <div className="mt-2 border-t border-foreground/70 pt-2 text-[10px] text-muted-foreground">
                * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet.
                2,000 calories a day is used for general nutrition advice.
              </div>
            </div>

            {showActionButton ? (
              <div>
                <Button
                  onClick={onConfirm}
                  disabled={isBusy}
                  className="w-full"
                  data-testid="add-food-button"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Working...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      {actionLabel}
                    </>
                  )}
                </Button>
                <div className="mt-2 text-xs text-muted-foreground">
                  Will log {selection.quantity} × {selection.servingUnit}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
