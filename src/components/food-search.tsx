/* eslint-disable @next/next/no-img-element */
'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { useQueries } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Flame, Beef, Wheat, Droplets, Plus } from 'lucide-react';
import {
  FOOD_IMAGE_QUERY_KEY,
  fetchFoodImageUrl,
  useInfiniteFoodSearchQuery,
  usePersistSelectedFoodMutation,
} from '@/queries/foods';

import type { NutritionSourceFood, SearchAggregatorResult } from '@/lib/nutrition-sources/types';

const EMPTY_FOODS: NutritionSourceFood[] = [];

type FoodSearchTab = 'common' | 'branded' | 'custom';

type Per100g = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium?: number;
};

type MacroSummary = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
};

type FoodSelection = {
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
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0;
}

function roundTo(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const p = 10 ** decimals;
  return Math.round(value * p) / p;
}

function safeGrams(value: unknown) {
  const num = asNumber(value);
  if (!Number.isFinite(num) || num <= 0) return 100;
  return Math.max(1, Math.round(num));
}

function computeQuantityFromGrams(input: { grams: number; servingWeightGrams: number; servingQty: number }) {
  const { grams, servingWeightGrams, servingQty } = input;
  if (!Number.isFinite(grams) || grams <= 0) return servingQty;
  if (!Number.isFinite(servingWeightGrams) || servingWeightGrams <= 0) return servingQty;
  if (!Number.isFinite(servingQty) || servingQty <= 0) return 1;

  const multiplier = grams / servingWeightGrams;
  return servingQty * multiplier;
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

  const defaultId = alt.length > 0 ? alt[0].id : base.id;

  return { options, defaultId };
}

function SearchTabs({
  activeTab,
  onTabChange,
  commonCount,
  brandedCount,
  customCount,
}: {
  activeTab: FoodSearchTab;
  onTabChange: (tab: FoodSearchTab) => void;
  commonCount: number;
  brandedCount: number;
  customCount: number;
}) {
  return (
    <div className="border-b bg-muted/40 p-3">
      <div className="sm:hidden">
        <Select value={activeTab} onValueChange={(value) => onTabChange(value as FoodSearchTab)}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="common">Common ({commonCount})</SelectItem>
            <SelectItem value="branded">Branded ({brandedCount})</SelectItem>
            <SelectItem value="custom">Custom ({customCount})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="hidden w-full gap-1 rounded-lg bg-muted p-1 sm:flex">
        <button
          type="button"
          className={`flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'common'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onTabChange('common')}
        >
          <span>Common</span>
          <span
            className={`ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ${
              activeTab === 'common'
                ? 'bg-muted text-foreground'
                : 'bg-background/70 text-muted-foreground'
            }`}
          >
            {commonCount}
          </span>
        </button>

        <button
          type="button"
          className={`flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'branded'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onTabChange('branded')}
        >
          <span>Branded</span>
          <span
            className={`ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ${
              activeTab === 'branded'
                ? 'bg-muted text-foreground'
                : 'bg-background/70 text-muted-foreground'
            }`}
          >
            {brandedCount}
          </span>
        </button>

        <button
          type="button"
          className={`flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'custom'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onTabChange('custom')}
        >
          <span>Custom</span>
          <span
            className={`ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ${
              activeTab === 'custom'
                ? 'bg-muted text-foreground'
                : 'bg-background/70 text-muted-foreground'
            }`}
          >
            {customCount}
          </span>
        </button>
      </div>
    </div>
  );
}

function KeyboardHints() {
  return (
    <div className="mt-3 flex items-center justify-center gap-6 border-t pt-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↑</kbd>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↓</kbd>
        <span>to navigate</span>
      </div>
      <div className="flex items-center gap-2">
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
        <span>to select</span>
      </div>
      <div className="flex items-center gap-2">
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
        <span>to clear</span>
      </div>
    </div>
  );
}

type MacroRow = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

function MacroBadges({ macros }: { macros: MacroRow }) {
  return (
    <div className="mt-2.5 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
      <div className="inline-flex w-full max-w-[220px] items-center justify-between gap-2 rounded-md bg-orange-100 px-2.5 py-1.5 text-xs font-medium text-orange-600 tabular-nums">
      <span className="inline-flex items-center gap-1">
        <Flame className="h-3 w-3" />
        Calories
      </span>
      <span>{Math.round(macros.calories)} kcal</span>
      </div>
      <div className="inline-flex w-full max-w-[220px] items-center justify-between gap-2 rounded-md bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-600 tabular-nums">
      <span className="inline-flex items-center gap-1">
        <Beef className="h-3 w-3" />
        Protein
      </span>
      <span>{roundTo(macros.protein, 2)}g</span>
      </div>
      <div className="inline-flex w-full max-w-[220px] items-center justify-between gap-2 rounded-md bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-700 tabular-nums">
      <span className="inline-flex items-center gap-1">
        <Wheat className="h-3 w-3" />
        Carbs
      </span>
      <span>{roundTo(macros.carbs, 2)}g</span>
      </div>
      <div className="inline-flex w-full max-w-[220px] items-center justify-between gap-2 rounded-md bg-rose-100 px-2.5 py-1.5 text-xs font-medium text-rose-700 tabular-nums">
      <span className="inline-flex items-center gap-1">
        <Droplets className="h-3 w-3" />
        Fat
      </span>
      <span>{roundTo(macros.fat, 2)}g</span>
      </div>
    </div>
  );
}

function FoodThumbAndMacros({
  food,
  macros,
  variant = 'row',
  belowImage,
  children,
}: {
  food: NutritionSourceFood;
  macros: MacroRow;
  variant?: 'row' | 'stacked';
  belowImage?: ReactNode;
  children?: ReactNode;
}) {
  if (variant === 'stacked') {
    const imageUrl = food.photo?.highres || food.photo?.thumb;

    return (
      <div className="space-y-3">
        <div className="flex w-full flex-col items-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={food.name}
              className="aspect-square w-full max-w-[260px] rounded-md bg-muted object-cover"
              loading="lazy"
            />
          ) : (
            <div className="aspect-square w-full max-w-[260px] rounded-md bg-muted" />
          )}
          {belowImage ? <div className="mt-2 w-full text-center">{belowImage}</div> : null}
        </div>

        {children ? <div className="min-w-0">{children}</div> : null}
        <MacroBadges macros={macros} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[44px_1fr] gap-4">
      <div className="flex flex-col items-center justify-center">
        {food.photo?.thumb ? (
          <img
            src={food.photo.thumb}
            alt={food.name}
            className="h-11 w-11 rounded object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-11 w-11 rounded bg-muted" />
        )}
        {belowImage ? <div className="mt-2 text-center">{belowImage}</div> : null}
      </div>

      <div className="min-w-0">
        {children}
        <MacroBadges macros={macros} />
      </div>
    </div>
  );
}

function FoodResultOption({
  food,
  index,
  highlightIndex,
  setHighlightIndex,
  selectFood,
  toPer100g,
}: {
  food: NutritionSourceFood;
  index: number;
  highlightIndex: number;
  setHighlightIndex: (index: number) => void;
  selectFood: (food: NutritionSourceFood) => void;
  toPer100g: (food: NutritionSourceFood) => Per100g | null;
}) {
  const p100 = toPer100g(food);
  const isActive = index === highlightIndex;

  const macroRow: MacroRow = {
    calories: p100 ? p100.calories : Number(food.calories),
    protein: p100 ? p100.protein : Number(food.protein),
    carbs: p100 ? p100.carbs : Number(food.carbs),
    fat: p100 ? p100.fat : Number(food.fat),
  };

  const subtitle = (() => {
    const brandName = food.brandName?.trim();
    const servingLabel = p100
      ? '100 g'
      : `${food.servingQty ?? 1}${food.servingUnit ? ` ${food.servingUnit}` : ''}`;

    if (brandName) return `${brandName} · ${servingLabel}`;
    if (p100) return servingLabel;
    return `per serving · ${servingLabel}`;
  })();

  return (
   <>
    <button
      id={`food-option-${food.source}-${food.sourceId}`}
      type="button"
      role="option"
      aria-selected={isActive}
      onMouseEnter={() => setHighlightIndex(index)}
      onClick={() => selectFood(food)}
      data-testid={`food-result-${index}`}
      className={`w-full mb-1 rounded-lg p-3 text-left transition-colors ${
        isActive ? 'bg-muted' : 'hover:bg-muted/60'
      }`}
    >
      <FoodThumbAndMacros
        food={food}
        macros={macroRow}
      >
        <div className="truncate text-sm font-semibold text-foreground">{food.name}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </FoodThumbAndMacros>
    </button>
   </>
  );
}

function  SelectedFoodPanel(props: {
  food: NutritionSourceFood;
  isBusy?: boolean;
  actionLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  onChange?: (selection: FoodSelection) => void;
  onServingSelectOpenChange?: (open: boolean) => void;
}) {
  const {
    food,
    isBusy = false,
    actionLabel = 'Add to Log',
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

  const selection: FoodSelection = useMemo(
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

  const canSeeFood =
    (food.source === 'fatsecret' && food.sourceId.trim().length > 0) ||
    (typeof food.id === 'number' && Number.isFinite(food.id));

  const foodDetailsHref = (() => {
    if (food.source === 'fatsecret' && food.sourceId.trim().length > 0) {
      return `/food/${encodeURIComponent(food.sourceId)}`;
    }
    if (typeof food.id === 'number' && Number.isFinite(food.id)) {
      return `/food/${encodeURIComponent(`db-${food.id}`)}`;
    }
    return null;
  })();

  const brandName = food.brandName?.trim();

  return (
    <div className="p-3">
      <div className="min-w-0">
        <div className="truncate text-2xl font-semibold text-foreground">{food.name}</div>
        {brandName ? <div className="truncate text-xs text-muted-foreground">{brandName}</div> : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[340px_1fr]">
        <div className="p-3">
          <FoodThumbAndMacros
            food={food}
            macros={{
              calories: macros.calories,
              protein: macros.protein,
              carbs: macros.carbs,
              fat: macros.fat,
            }}
            variant="stacked"
            belowImage={
              canSeeFood && foodDetailsHref ? (
                <a
                  href={foodDetailsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-primary underline underline-offset-2 whitespace-nowrap"
                >
                  see more details...
                </a>
              ) : null
            }
          />
        </div>

        <div className="space-y-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-foreground">Serving</label>
          <Select
            value={selectedOptionId}
            onValueChange={(value) => setSelectedOptionId(value)}
            onOpenChange={onServingSelectOpenChange}
          >
            <SelectTrigger className="h-9 w-full text-sm">
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
              onChange={(e) => setGrams(safeGrams(e.target.value))}
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

          <div className="text-xs text-muted-foreground">
            Will log {selection.quantity} × {selection.servingUnit}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isBusy}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isBusy}
              className="flex-1"
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
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchInputWithBadge({
  inputRef,
  query,
  setQuery,
  showDropdown,
  onFocus,
  onKeyDown,
  activeOptionId,
  children,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  setQuery: (value: string) => void;
  showDropdown: boolean;
  onFocus: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  activeOptionId?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative rounded-xl bg-border/60 p-[1px] transition-colors focus-within:bg-gradient-to-r focus-within:from-green-500/35 focus-within:via-emerald-500/25 focus-within:to-green-500/35">
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 sm:block">
          <span className="inline-flex h-10 items-center rounded-full bg-green-600 px-5 text-sm font-semibold text-white shadow-sm">
            Search Foods
          </span>
        </div>

        <Input
          ref={inputRef}
          placeholder="Search for your favorite food or meal"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          className="h-16 w-full rounded-[11px] border-0 bg-background pl-4 pr-6 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-transparent focus-visible:shadow-none sm:pl-[160px]"
          data-testid="food-search-input"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? 'food-search-listbox' : undefined}
          aria-activedescendant={activeOptionId}
        />

        {children}
      </div>
    </div>
  );
}

interface FoodSearchProps {
  onAddFood: (payload: {
    food: NutritionSourceFood;
    quantity: string;
    servingUnit: string;
    grams: number;
    macros: MacroSummary;
  }) => void | Promise<void>;
  onAdded?: () => void;
  actionLabel?: string;
  pageSize?: number;
}

export default function FoodSearch({
  onAddFood,
  onAdded,
  actionLabel = 'Add to Log',
  pageSize = 25,
}: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<NutritionSourceFood | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FoodSearchTab>('common');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [factsSelection, setFactsSelection] = useState<FoodSelection | null>(null);
  const [isServingSelectOpen, setIsServingSelectOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const requestedLoadMoreRef = useRef(false);

  const persistMutation = usePersistSelectedFoodMutation();

  useEffect(() => {
    const trimmed = query.trim();
    setHighlightIndex(0);
    setError(null);

    if (trimmed.length < 3) {
      setDebouncedQuery('');
      requestedLoadMoreRef.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      setDebouncedQuery(trimmed);
      setIsOpen(true);
    }, 500);

    return () => clearTimeout(timeout);
  }, [query]);

  const searchQueryHook = useInfiniteFoodSearchQuery(debouncedQuery, pageSize);

  const mergedSearchResults = useMemo((): SearchAggregatorResult | undefined => {
    const pages = searchQueryHook.data?.pages ?? [];
    if (pages.length === 0) return undefined;

    const normalizeKey = (food: NutritionSourceFood) =>
      `${food.source}:${food.sourceId}:${(food.name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')}:${(
        food.brandName ?? ''
      )
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')}`;

    const seen = new Set<string>();
    const mergedFoods: NutritionSourceFood[] = [];

    for (const p of pages) {
      for (const food of p.foods) {
        const key = normalizeKey(food);
        if (seen.has(key)) continue;
        seen.add(key);
        mergedFoods.push(food);
      }
    }

    const last = pages[pages.length - 1];

    return {
      ...last,
      foods: mergedFoods,
      hasMore: Boolean(searchQueryHook.hasNextPage),
      pageSize,
    };
  }, [pageSize, searchQueryHook.data, searchQueryHook.hasNextPage]);

  const foodUrlsNeedingImages = useMemo(() => {
    const foods = mergedSearchResults?.foods ?? [];
    const urls: string[] = [];
    const seen = new Set<string>();

    for (const food of foods) {
      const url = (food.foodUrl ?? '').trim();
      if (!url) continue;
      if (food.photo?.thumb || food.photo?.highres) continue;
      if (seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
      if (urls.length >= 20) break;
    }

    return urls;
  }, [mergedSearchResults?.foods]);

  const foodImageQueries = useQueries({
    queries: foodUrlsNeedingImages.map((foodUrl) => ({
      queryKey: FOOD_IMAGE_QUERY_KEY(foodUrl),
      queryFn: () => fetchFoodImageUrl(foodUrl),
      enabled: debouncedQuery.trim().length >= 3,
      staleTime: 30 * 24 * 60 * 60 * 1000,
      gcTime: 30 * 24 * 60 * 60 * 1000,
      retry: 1,
    })),
  });

  const enrichedSearchResults = useMemo(() => {
    if (!mergedSearchResults) return undefined;
    if (foodUrlsNeedingImages.length === 0) return mergedSearchResults;

    const urlToImage = new Map<string, string>();
    for (let i = 0; i < foodUrlsNeedingImages.length; i += 1) {
      const url = foodUrlsNeedingImages[i];
      const imageUrl = foodImageQueries[i]?.data;
      if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
        urlToImage.set(url, imageUrl);
      }
    }

    if (urlToImage.size === 0) return mergedSearchResults;

    return {
      ...mergedSearchResults,
      foods: mergedSearchResults.foods.map((food) => {
        if (food.photo?.thumb || food.photo?.highres) return food;
        const url = (food.foodUrl ?? '').trim();
        const imageUrl = url ? urlToImage.get(url) : undefined;
        if (!imageUrl) return food;
        return {
          ...food,
          photo: {
            thumb: imageUrl,
            highres: imageUrl,
          },
        };
      }),
    };
  }, [foodImageQueries, foodUrlsNeedingImages, mergedSearchResults]);

  const isSearching = searchQueryHook.isFetching && !searchQueryHook.isFetchingNextPage && !searchQueryHook.data;
  const isLoadingMore = searchQueryHook.isFetchingNextPage;

  useEffect(() => {
    if (debouncedQuery.trim().length < 3) return;
    if (!searchQueryHook.isError) return;
    const message = searchQueryHook.error instanceof Error ? searchQueryHook.error.message : 'Food search failed.';
    setError(message);
  }, [debouncedQuery, searchQueryHook.error, searchQueryHook.isError]);

  const foods = enrichedSearchResults?.foods ?? EMPTY_FOODS;
  const hasMore = Boolean(searchQueryHook.hasNextPage);

  const commonFoods = useMemo(
    () => foods.filter((food) => !food.isCustom && food.source !== 'database' && !food.brandName?.trim()),
    [foods],
  );
  const brandedFoods = useMemo(
    () => foods.filter((food) => !food.isCustom && food.source !== 'database' && Boolean(food.brandName?.trim())),
    [foods],
  );
  const customFoods = useMemo(
    () => foods.filter((food) => food.isCustom || food.source === 'database'),
    [foods],
  );

  const foodsForTab = useMemo(() => {
    switch (activeTab) {
      case 'common':
        return commonFoods;
      case 'branded':
        return brandedFoods;
      case 'custom':
        return customFoods;
      default:
        return commonFoods;
    }
  }, [activeTab, commonFoods, brandedFoods, customFoods]);

  useEffect(() => {
    // If the currently selected tab has no results, automatically switch to the
    // first tab that does. This keeps the default UX (and E2E flows) working
    // when results are returned from DB/custom sources.
    if (foodsForTab.length > 0) return;

    const nextTab: FoodSearchTab | null =
      commonFoods.length > 0
        ? 'common'
        : brandedFoods.length > 0
          ? 'branded'
          : customFoods.length > 0
            ? 'custom'
            : null;

    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
      setHighlightIndex(0);
    }
  }, [activeTab, brandedFoods.length, commonFoods.length, customFoods.length, foodsForTab.length]);

  const showPanel = isOpen && (selectedFood !== null || query.trim().length >= 3);
  const showDropdown = showPanel && !selectedFood && query.trim().length >= 3;

  useEffect(() => {
    setHighlightIndex((prev) => {
      if (foodsForTab.length === 0) return 0;
      return Math.min(prev, foodsForTab.length - 1);
    });
  }, [foodsForTab.length]);

  const activeOptionId = useMemo(() => {
    if (!showDropdown) return undefined;
    const activeFood = foodsForTab[highlightIndex];
    if (!activeFood) return undefined;
    return `food-option-${activeFood.source}-${activeFood.sourceId}`;
  }, [foodsForTab, highlightIndex, showDropdown]);

  const toPer100g = (food: NutritionSourceFood): Per100g | null => {
    const grams = food.servingWeightGrams;
    if (!grams || grams <= 0) return null;
    const factor = 100 / grams;

    return {
      calories: Number(food.calories) * factor,
      protein: Number(food.protein) * factor,
      carbs: Number(food.carbs) * factor,
      fat: Number(food.fat) * factor,
      sodium: food.sodium != null ? Number(food.sodium) * factor : undefined,
    };
  };

  const selectFood = (food: NutritionSourceFood) => {
    setSelectedFood(food);
    setFactsSelection(null);
    setError(null);
    setIsOpen(true);
    setHighlightIndex(0);

    persistMutation.mutate(food, {
      onSuccess: (persisted) => {
        setSelectedFood(persisted);
      },
      onError: (err) => {
        console.error('Error persisting food:', err);
        setError(err instanceof Error ? err.message : 'Failed to load food details.');
      },
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showPanel) return;

    if (!selectedFood && e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => {
        const next = Math.min(prev + 1, Math.max(foodsForTab.length - 1, 0));
        const nextFood = foodsForTab[next];
        if (nextFood) {
          document.getElementById(`food-option-${nextFood.source}-${nextFood.sourceId}`)?.scrollIntoView({
            block: 'nearest',
          });
        }
        return next;
      });
      return;
    }

    if (!selectedFood && e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        const nextFood = foodsForTab[next];
        if (nextFood) {
          document.getElementById(`food-option-${nextFood.source}-${nextFood.sourceId}`)?.scrollIntoView({
            block: 'nearest',
          });
        }
        return next;
      });
      return;
    }

    if (!selectedFood && e.key === 'Enter') {
      if (foodsForTab.length === 0) return;
      e.preventDefault();
      const picked = foodsForTab[highlightIndex];
      if (picked) selectFood(picked);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      if (selectedFood) {
        setSelectedFood(null);
        setHighlightIndex(0);
        if (query.trim().length < 3) setIsOpen(false);
        return;
      }

      setQuery('');
      setIsOpen(false);
      setHighlightIndex(0);
    }
  };

  const handleAddFood = async () => {
    if (!selectedFood) return;
    if (!factsSelection) {
      setError('Please confirm serving size.');
      return;
    }

    setAdding(true);
    setError(null);

    try {
      await Promise.resolve(
        onAddFood({
          food: selectedFood,
          quantity: factsSelection.quantity,
          servingUnit: factsSelection.servingUnit,
          grams: factsSelection.grams,
          macros: factsSelection.macros,
        }),
      );

      onAdded?.();
      setSelectedFood(null);
      setFactsSelection(null);
    } catch (err) {
      console.error('Error adding food:', err);
      setError('Failed to add food. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const isRadixSelectInteraction = (el: Element) => {
        if (
          el.closest('[data-radix-popper-content-wrapper]') ||
          el.closest('[data-radix-select-content]') ||
          el.closest('[data-radix-select-viewport]') ||
          el.closest('[data-radix-collection-item]')
        ) {
          return true;
        }

        const inPortal = el.closest('[data-radix-portal]');
        if (!inPortal) return false;
        return Boolean(el.closest('[role="listbox"]') || el.closest('[role="option"]'));
      };

      // Radix `Select` (shadcn/ui) renders its menu in a Portal.
      // Clicking it would otherwise look like an "outside" click and close our panel.
      const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
      for (const node of path) {
        if (node instanceof Element && isRadixSelectInteraction(node)) return;
      }

      if (target instanceof Element && isRadixSelectInteraction(target)) return;

      if (isServingSelectOpen) return;

      if (!containerRef.current) return;
      if (!containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isServingSelectOpen]);

  useEffect(() => {
    requestedLoadMoreRef.current = false;
  }, [activeTab, foods.length, isLoadingMore]);

  useEffect(() => {
    if (!showDropdown) return;
    if (!hasMore) return;
    if (isLoadingMore || isSearching) return;

    const root = listRef.current;
    const target = loadMoreSentinelRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (requestedLoadMoreRef.current) return;

        requestedLoadMoreRef.current = true;
        void searchQueryHook.fetchNextPage();
      },
      { root, threshold: 0.1 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isSearching, searchQueryHook, showDropdown]);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Search Input */}
      <div className="space-y-1">
        <SearchInputWithBadge
          inputRef={inputRef}
          query={query}
          setQuery={setQuery}
          showDropdown={showDropdown}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          activeOptionId={activeOptionId}
        >
          {showPanel && (
            <div
              className="absolute left-0 top-full z-50 mt-3 w-full overflow-hidden rounded-xl border bg-background shadow-lg"
              data-testid="search-results"
            >
              {selectedFood ? (
                <SelectedFoodPanel
                  food={selectedFood}
                  isBusy={adding || persistMutation.isPending}
                  actionLabel={actionLabel}
                  onCancel={() => {
                    setSelectedFood(null);
                    setFactsSelection(null);
                    setHighlightIndex(0);
                    if (query.trim().length < 3) setIsOpen(false);
                  }}
                  onConfirm={handleAddFood}
                  onChange={(next) => setFactsSelection(next)}
                  onServingSelectOpenChange={setIsServingSelectOpen}
                />
              ) : (
                <>
                  <SearchTabs
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                      setActiveTab(tab);
                      setHighlightIndex(0);
                    }}
                    commonCount={commonFoods.length}
                    brandedCount={brandedFoods.length}
                    customCount={customFoods.length}
                  />

                  <div
                    ref={listRef}
                    id="food-search-listbox"
                    role="listbox"
                    aria-label="Food search results"
                    className="max-h-[440px] overflow-y-auto p-3"
                  >
                    {isSearching && (
                      <div className="flex items-center justify-center py-6 text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </div>
                    )}

                    {!isSearching && foodsForTab.length === 0 && (
                      <div
                        className="px-3 py-8 text-center text-sm text-muted-foreground"
                        data-testid="empty-state"
                      >
                        No foods found. Try different search terms.
                      </div>
                    )}

                    {!isSearching &&
                      foodsForTab.map((food, index) => (
                        <FoodResultOption
                          key={`${food.source}-${food.sourceId}`}
                          food={food}
                          index={index}
                          highlightIndex={highlightIndex}
                          setHighlightIndex={setHighlightIndex}
                          selectFood={selectFood}
                          toPer100g={toPer100g}
                        />
                      ))}

                    {/* Infinite scroll sentinel */}
                    <div ref={loadMoreSentinelRef} className="h-1" />

                    {hasMore && (
                      <div className="pt-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void searchQueryHook.fetchNextPage()}
                          disabled={isLoadingMore || isSearching}
                          className="w-full"
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading more...
                            </>
                          ) : (
                            'Load more'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="hidden bg-background px-3 pb-3 sm:block">
                    <KeyboardHints />
                  </div>
                </>
              )}
            </div>
          )}
        </SearchInputWithBadge>

        {query.trim().length > 0 && query.trim().length < 3 && (
          <div className="mt-1 text-xs text-muted-foreground">Type at least 3 characters to search</div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="rounded-lg bg-red-50 p-3 text-red-600 dark:bg-red-950/30 dark:text-red-400"
          data-testid="error-message"
        >
          {error}
        </div>
      )}

      {/* Loading State (only when dropdown is not shown) */}
      {isSearching && !showDropdown && (
        <div className="flex items-center justify-center py-4 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Searching...
        </div>
      )}

      {/* Empty results message (only when dropdown is closed) */}
      {!selectedFood && !showDropdown && query.trim().length >= 3 && !isSearching && foods.length === 0 && (
        <div className="py-8 text-center text-muted-foreground" data-testid="empty-state">
          No foods found. Try different search terms.
        </div>
      )}
    </div>
  );
}
