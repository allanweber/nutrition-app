'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useForm } from '@tanstack/react-form';
import { ArrowLeft, BarChart2, ChevronDown, ChevronUp, Loader2, X } from 'lucide-react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

import { FoodSearchField } from '@/components/food-search-field';
import type { UnifiedFoodSearchResultItem } from '@/components/food-search-field/types';
import { PageHeader } from '@/components/page-header';
import { PhotoUploader } from '@/components/photo-uploader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProgressBar } from '@/components/dashboard/shared/progress-bar';
import { useFoodSearch } from '@/hooks/use-food-search';
import { customDishFormSchema, zodValidator } from '@/lib/form-validation';
import type { CustomDishFormData } from '@/lib/form-validation';
import { resizeForUpload } from '@/lib/image-resize';
import {
  MACRO_COLORS,
  MACRO_CELL_BG,
  MACRO_TEXT_COLORS,
  NUTRIENT_COLORS,
} from '@/lib/nutrition-constants';
import { cn } from '@/lib/utils';
import { useCreateDishMutation, useUpdateDishMutation } from '@/queries/dishes';
import { useFoodDetailQuery } from '@/queries/food-detail';
import { useGoalsQuery } from '@/queries/goals';
import type { NutritionGoals } from '@/types/goals';
import type { DishDetail } from '@/types/dish';
import { useQueryClient } from '@tanstack/react-query';

// ─── types ────────────────────────────────────────────────────────────────────

interface Ingredient {
  key: string;
  foodId: string;
  foodName: string;
  thumbnail?: string | null;
  quantity: number;           // grams
  caloriesPer100g: number;
  proteinPer100g: number;     // g per 100g food
  carbsPer100g: number;       // g per 100g food
  fatPer100g: number;         // g per 100g food
  fiberPer100g: number;       // g per 100g food
  sugarPer100g: number;       // g per 100g food
  sodiumMgPer100g: number;    // mg per 100g food
  isLoadingNutrition?: boolean;
}

interface CustomDishFormProps {
  /** present → edit mode; absent → create mode */
  dishId?: string;
  initialDish?: DishDetail;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

// ─── ingredient row ───────────────────────────────────────────────────────────

function IngredientRow({
  ingredient,
  onRemove,
  onQuantityChange,
}: {
  ingredient: Ingredient;
  onRemove: () => void;
  onQuantityChange: (q: number) => void;
}) {
  const q = ingredient.quantity;
  const kcal = round1((ingredient.caloriesPer100g / 100) * q);
  const protein = round1((ingredient.proteinPer100g / 100) * q);
  const carbs = round1((ingredient.carbsPer100g / 100) * q);
  const fat = round1((ingredient.fatPer100g / 100) * q);

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    onQuantityChange(clamp(Number(e.target.value), 1, 500));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) onQuantityChange(clamp(v, 1, 500));
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-outline-variant/20 bg-card px-4 py-3">
      {/* Row 1: thumbnail + name + badges */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {ingredient.thumbnail ? (
          <Image
            src={ingredient.thumbnail}
            alt=""
            width={44}
            height={44}
            className="rounded-lg shrink-0 object-cover"
          />
        ) : (
          <div className="w-11 h-11 rounded-lg bg-muted shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight truncate">{ingredient.foodName}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {ingredient.isLoadingNutrition ? (
              <>
                <div className="animate-pulse rounded-full bg-muted h-4 w-12" />
                <div className="animate-pulse rounded-full bg-muted h-4 w-10" />
                <div className="animate-pulse rounded-full bg-muted h-4 w-10" />
                <div className="animate-pulse rounded-full bg-muted h-4 w-10" />
              </>
            ) : (
              <>
                <Badge variant="outline" className="border-transparent bg-primary/10 text-primary text-[10px] px-1.5 py-0">
                  {kcal} kcal
                </Badge>
                <Badge variant="outline" className={cn('border-transparent text-[10px] px-1.5 py-0', MACRO_CELL_BG.protein, MACRO_TEXT_COLORS.protein)}>
                  P: {protein}g
                </Badge>
                <Badge variant="outline" className={cn('border-transparent text-[10px] px-1.5 py-0', MACRO_CELL_BG.carbs, MACRO_TEXT_COLORS.carbs)}>
                  C: {carbs}g
                </Badge>
                <Badge variant="outline" className={cn('border-transparent text-[10px] px-1.5 py-0', MACRO_CELL_BG.fat, MACRO_TEXT_COLORS.fat)}>
                  F: {fat}g
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Row 2 (small) / same row (large): slider + input + remove */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto">
        <span className="text-[10px] text-muted-foreground shrink-0">1G</span>
        <input
          type="range"
          min={1}
          max={500}
          step={1}
          value={q}
          onChange={handleSlider}
          className="flex-1 sm:w-28 accent-primary h-1.5"
          aria-label={`Quantity slider for ${ingredient.foodName}`}
        />
        <span className="text-[10px] text-muted-foreground shrink-0">500G</span>
        <div className="flex items-center shrink-0 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring overflow-hidden">
          <Input
            type="number"
            min={1}
            max={500}
            value={q}
            onChange={handleInput}
            className="w-14 text-right text-sm border-0 focus-visible:ring-0 shadow-none pr-1"
            aria-label={`Quantity in grams for ${ingredient.foodName}`}
          />
          <span className="text-xs text-muted-foreground pr-2 select-none">g</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── nutrition summary ────────────────────────────────────────────────────────

interface NutrientRowProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  labelColor: string;   // text color class e.g. text-[#D54069]
  trackBg: string;      // track background class e.g. bg-[#FFEBEC]
  fillBg: string;       // fill class e.g. bg-[#D54069]
}

function NutrientRow({ label, value, goal, unit, labelColor, trackBg, fillBg }: NutrientRowProps) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <div>
          <h4 className={cn('text-sm font-bold font-headline', labelColor)}>{label}</h4>
          <p className="text-[11px] text-muted-foreground font-medium">
            {value.toLocaleString()}{unit} / {goal.toLocaleString()}{unit} goal
          </p>
        </div>
        <span className={cn('text-sm font-bold font-headline', labelColor)}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className={cn('h-3 w-full rounded-full overflow-hidden', trackBg)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', fillBg)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DishNutritionSummary({
  ingredients,
  goals,
}: {
  ingredients: Ingredient[];
  goals: NutritionGoals | undefined;
}) {
  const [open, setOpen] = useState(false);

  const totals = useMemo(() => {
    return ingredients.reduce(
      (acc, ing) => {
        const f = ing.quantity / 100;
        return {
          calories: acc.calories + ing.caloriesPer100g * f,
          protein:  acc.protein  + ing.proteinPer100g  * f,
          carbs:    acc.carbs    + ing.carbsPer100g    * f,
          fat:      acc.fat      + ing.fatPer100g      * f,
          fiber:    acc.fiber    + ing.fiberPer100g    * f,
          sugar:    acc.sugar    + ing.sugarPer100g    * f,
          sodium:   acc.sodium   + ing.sodiumMgPer100g * f,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
    );
  }, [ingredients]);

  const hasIngredients = ingredients.length > 0;
  const kcalGoal = goals?.calories ?? 2000;
  const kcalPct = kcalGoal > 0 ? Math.round((totals.calories / kcalGoal) * 100) : 0;

  return (
    <div className="bg-card rounded-[2rem] p-8 border border-outline-variant/30 shadow-xl overflow-hidden">
      <CollapsiblePrimitive.Root open={open} onOpenChange={setOpen}>
        {/* Header — always visible */}
        <div className="flex items-start justify-between mb-8">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#008d4d] flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Nutrition Deep-Dive
          </h2>
          <CollapsiblePrimitive.Trigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden -mt-1 -mr-2">
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsiblePrimitive.Trigger>
        </div>

        {/* Kcal — always visible */}
        <div className="mb-8">
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-6xl font-extrabold text-foreground tracking-tighter tabular-nums">
              {hasIngredients ? Math.round(totals.calories) : '—'}
            </span>
            <span className="text-lg font-bold text-[#008d4d]">kcal</span>
          </div>
          {hasIngredients && (
            <p className="text-sm font-medium text-muted-foreground mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#008d4d] shrink-0" />
              {kcalPct}% of your daily {kcalGoal.toLocaleString()} kcal goal
            </p>
          )}
        </div>

        {/* Collapsible macros — always mounted; CSS hides on mobile when closed, always visible on lg+ */}
        <CollapsiblePrimitive.Content forceMount className="data-[state=closed]:hidden lg:data-[state=closed]:block">
          {!hasIngredients ? (
            <p className="text-sm text-muted-foreground">Add ingredients to see nutrition</p>
          ) : (
            <div className="space-y-5">
              <NutrientRow
                label="Protein"
                value={round1(totals.protein)}
                goal={goals?.protein ?? 0}
                unit="g"
                labelColor="text-[#D54069]"
                trackBg="bg-[#FFEBEC]"
                fillBg="bg-[#D54069]"
              />
              <NutrientRow
                label="Carbohydrates"
                value={round1(totals.carbs)}
                goal={goals?.carbs ?? 0}
                unit="g"
                labelColor="text-[#CC7A40]"
                trackBg="bg-[#FEF6D4]"
                fillBg="bg-[#CC7A40]"
              />
              <NutrientRow
                label="Total Fats"
                value={round1(totals.fat)}
                goal={goals?.fat ?? 0}
                unit="g"
                labelColor="text-[#408FBE]"
                trackBg="bg-[#DFF2FE]"
                fillBg="bg-[#408FBE]"
              />
              <NutrientRow
                label="Fiber"
                value={round1(totals.fiber)}
                goal={goals?.fiber ?? 30}
                unit="g"
                labelColor="text-[#7E22CE]"
                trackBg="bg-[#F3E8FF]"
                fillBg="bg-[#7E22CE]"
              />
              <NutrientRow
                label="Sugar"
                value={round1(totals.sugar)}
                goal={50}
                unit="g"
                labelColor="text-[#E11D48]"
                trackBg="bg-[#FFF1F2]"
                fillBg="bg-[#E11D48]"
              />
              <NutrientRow
                label="Sodium"
                value={Math.round(totals.sodium)}
                goal={goals?.sodium ?? 2300}
                unit="mg"
                labelColor="text-[#475569]"
                trackBg="bg-[#F1F5F9]"
                fillBg="bg-[#475569]"
              />
            </div>
          )}
        </CollapsiblePrimitive.Content>
      </CollapsiblePrimitive.Root>
    </div>
  );
}

// ─── component ───────────────────────────────────────────────────────────────

export function CustomDishForm({ dishId, initialDish }: CustomDishFormProps) {
  const isEdit = Boolean(dishId);
  const router = useRouter();
  const qc = useQueryClient();
  const createMutation = useCreateDishMutation();
  const updateMutation = useUpdateDishMutation();
  const mutation = isEdit ? updateMutation : createMutation;
  const goalsQuery = useGoalsQuery();

  const foodSearch = useFoodSearch({ includeCustom: true });

  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialDish?.ingredients.map((ing) => ({
      key: ing.id,
      foodId: ing.foodId,
      foodName: ing.foodName,
      thumbnail: ing.thumbnail ?? null,
      quantity: ing.quantity,
      caloriesPer100g: ing.quantity > 0 ? (ing.calories / ing.quantity) * 100 : 0,
      proteinPer100g:  ing.quantity > 0 ? (ing.protein  / ing.quantity) * 100 : 0,
      carbsPer100g:    ing.quantity > 0 ? (ing.carbs    / ing.quantity) * 100 : 0,
      fatPer100g:      ing.quantity > 0 ? (ing.fat      / ing.quantity) * 100 : 0,
      fiberPer100g:    0,
      sugarPer100g:    0,
      sodiumMgPer100g: 0,
    })) ?? [],
  );
  const [ingredientError, setIngredientError] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  // ── ingredient detail fetch state ──
  const [pendingIngredientItem, setPendingIngredientItem] =
    useState<UnifiedFoodSearchResultItem | null>(null);
  const [pendingIngredientKey, setPendingIngredientKey] = useState<string | null>(null);

  const ingredientFoodSelection = pendingIngredientItem
    ? pendingIngredientItem.id !== null
      ? { id: pendingIngredientItem.id, fatSecretId: pendingIngredientItem.fatSecretId ?? undefined }
      : pendingIngredientItem.fatSecretId
        ? { id: null as null, fatSecretId: pendingIngredientItem.fatSecretId }
        : null
    : null;
  const ingredientDetailQuery = useFoodDetailQuery(ingredientFoodSelection);

  // Hydrate nutrition for newly added ingredient
  useEffect(() => {
    const detail = ingredientDetailQuery.data?.food;
    if (!detail || !pendingIngredientKey) return;
    const base = detail.baseServing;
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.key === pendingIngredientKey
          ? {
              ...ing,
              foodId:           detail.id,   // use local DB UUID from detail response
              caloriesPer100g:  base.calories,
              proteinPer100g:   base.protein,
              carbsPer100g:     base.carbs,
              fatPer100g:       base.fat,
              fiberPer100g:     base.fiber  ?? 0,
              sugarPer100g:     base.sugar  ?? 0,
              sodiumMgPer100g:  base.sodium ?? 0,
              isLoadingNutrition: false,
            }
          : ing,
      ),
    );
    setPendingIngredientItem(null);
    setPendingIngredientKey(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredientDetailQuery.data, pendingIngredientKey]);

  const form = useForm({
    defaultValues: {
      name: initialDish?.name ?? '',
      description: initialDish?.description ?? '',
    } as CustomDishFormData,
    onSubmit: async ({ value }) => {
      if (ingredients.length === 0) {
        setIngredientError('Add at least one ingredient');
        return;
      }
      if (ingredients.some((i) => i.isLoadingNutrition)) {
        setIngredientError('Please wait for ingredient data to load');
        return;
      }
      setIngredientError(null);

      const ingredientPayload = ingredients.map((ing, i) => ({
        foodId: ing.foodId,
        quantity: ing.quantity,
        seq: i + 1,
      }));

      if (isEdit && dishId) {
        await updateMutation.mutateAsync({
          dishId,
          name: value.name,
          description: value.description || null,
          ingredients: ingredientPayload,
        });
      } else {
        const result = await createMutation.mutateAsync({
          name: value.name,
          description: value.description || null,
          ingredients: ingredientPayload,
        });

        if (pendingImageFile) {
          try {
            const resized = await resizeForUpload(pendingImageFile);
            const fd = new FormData();
            fd.append('thumb', resized.thumb, 'thumb.jpg');
            fd.append('display', resized.display, 'display.jpg');
            await fetch(`/api/dishes/${result.dish.id}/photo`, { method: 'POST', body: fd });
          } catch {
            // image upload is non-blocking; dish was created successfully
          }
        }
      }

      router.push('/my-foods?tab=dishes');
    },
  });

  // Reset form when initialDish loads (edit mode)
  useEffect(() => {
    if (!initialDish) return;
    form.reset({
      name: initialDish.name ?? '',
      description: initialDish.description ?? '',
    });
    setIngredients(
      initialDish.ingredients.map((ing) => ({
        key: ing.id,
        foodId: ing.foodId,
        foodName: ing.foodName,
        thumbnail: ing.thumbnail ?? null,
        quantity: ing.quantity,
        caloriesPer100g: ing.quantity > 0 ? (ing.calories / ing.quantity) * 100 : 0,
        proteinPer100g:  ing.quantity > 0 ? (ing.protein  / ing.quantity) * 100 : 0,
        carbsPer100g:    ing.quantity > 0 ? (ing.carbs    / ing.quantity) * 100 : 0,
        fatPer100g:      ing.quantity > 0 ? (ing.fat      / ing.quantity) * 100 : 0,
        fiberPer100g:    0,
        sugarPer100g:    0,
        sodiumMgPer100g: 0,
      })),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDish]);

  const handleAddIngredient = useCallback(
    (item: UnifiedFoodSearchResultItem) => {
      if ((!item.id && !item.fatSecretId) || item.itemKind === 'dish') return;
      const key = `${item.id ?? item.fatSecretId}-${Date.now()}`;
      setIngredients((prev) => [
        ...prev,
        {
          key,
          foodId: item.id ?? '',   // placeholder; replaced with detail.id after fetch
          foodName: item.name,
          thumbnail: item.thumbnail ?? null,
          quantity: 100,
          caloriesPer100g: 0,
          proteinPer100g:  0,
          carbsPer100g:    0,
          fatPer100g:      0,
          fiberPer100g:    0,
          sugarPer100g:    0,
          sodiumMgPer100g: 0,
          isLoadingNutrition: true,
        },
      ]);
      setPendingIngredientItem(item);
      setPendingIngredientKey(key);
      setIngredientError(null);
      foodSearch.setQuery('');
    },
    [foodSearch],
  );

  const handleRemove = (key: string) => {
    setIngredients((prev) => prev.filter((i) => i.key !== key));
  };

  const handleQuantityChange = (key: string, q: number) => {
    setIngredients((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: q } : i)));
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      <Link
        href="/my-foods?tab=dishes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        My Dishes
      </Link>
      <PageHeader
        overline={isEdit ? 'Edit Dish' : undefined}
        title={isEdit ? (initialDish?.name ?? 'Edit Dish') : 'Create Dish'}
        subtitle={
          isEdit
            ? (initialDish?.description ?? undefined)
            : 'Combine foods into a multi-ingredient dish'
        }
        className="mb-8"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Summary — first in DOM: top on mobile, right on desktop */}
          <aside className="order-first lg:order-last lg:sticky lg:top-24">
            <DishNutritionSummary ingredients={ingredients} goals={goalsQuery.data} />
          </aside>

          {/* Form fields */}
          <div className="space-y-6">
            {/* Photo */}
            <div className="rounded-xl border border-outline-variant/20 p-5 bg-card">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Photo</h2>
              <PhotoUploader
                currentThumb={isEdit ? (initialDish?.photo?.thumb ?? null) : null}
                uploadUrl={isEdit && dishId ? `/api/dishes/${dishId}/photo` : undefined}
                onFileSelected={!isEdit ? (file) => setPendingImageFile(file) : undefined}
                onUploaded={isEdit ? () => qc.invalidateQueries({ queryKey: ['dishes'] }) : undefined}
                onDeleted={isEdit ? () => qc.invalidateQueries({ queryKey: ['dishes'] }) : undefined}
                disabled={mutation.isPending}
              />
            </div>

            {/* Name + Description */}
            <div className="rounded-xl border border-outline-variant/20 p-5 space-y-4 bg-card">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dish Details</h2>

              <form.Field
                name="name"
                validators={{ onChange: zodValidator(customDishFormSchema.shape.name) }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="dish-name" className="text-xs font-semibold">Name *</Label>
                    <Input
                      id="dish-name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g., High-Protein Breakfast Bowl"
                      className={field.state.meta.errors.length > 0 ? 'border-destructive' : ''}
                      data-testid="field-dish-name"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="description"
                validators={{ onChange: zodValidator(customDishFormSchema.shape.description) }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="dish-description" className="text-xs font-semibold">Description</Label>
                    <Input
                      id="dish-description"
                      value={field.state.value ?? ''}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Optional description"
                      className={field.state.meta.errors.length > 0 ? 'border-destructive' : ''}
                      data-testid="field-dish-description"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            {/* Search */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Search Foods
              </h2>
              <FoodSearchField
                state={foodSearch}
                onQueryChange={foodSearch.setQuery}
                onLoadMore={foodSearch.loadMore}
                onSelect={handleAddIngredient}
                placeholder="Search foods to add…"
                inputTestId="ingredient-search"
              />
            </div>

            {/* Ingredients */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Ingredients
                </h2>
                {ingredients.length > 0 && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {ingredients.length} {ingredients.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>

              {ingredients.length > 0 ? (
                <div className="space-y-2 rounded-xl bg-[#ecefe6] dark:bg-muted/60 p-3">
                  {ingredients.map((ing) => (
                    <IngredientRow
                      key={ing.key}
                      ingredient={ing}
                      onRemove={() => handleRemove(ing.key)}
                      onQuantityChange={(q) => handleQuantityChange(ing.key, q)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No ingredients added yet.</p>
              )}

              {ingredientError && (
                <p className="text-sm text-destructive">{ingredientError}</p>
              )}
            </div>

            {mutation.error && (
              <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" asChild className="flex-1">
                <Link href="/my-foods?tab=dishes">Cancel</Link>
              </Button>
              <form.Subscribe selector={(state) => [state.isSubmitting]}>
                {([isSubmitting]) => (
                  <Button
                    type="submit"
                    className="flex-2"
                    disabled={
                      isSubmitting ||
                      mutation.isPending ||
                      ingredients.length === 0 ||
                      ingredients.some((i) => i.isLoadingNutrition)
                    }
                    data-testid={isEdit ? 'submit-edit-dish' : 'submit-create-dish'}
                  >
                    {isSubmitting || mutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {isEdit ? 'Saving…' : 'Creating…'}
                      </>
                    ) : isEdit ? (
                      'Save Changes'
                    ) : (
                      'Create Dish'
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
