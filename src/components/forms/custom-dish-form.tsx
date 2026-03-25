'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useForm } from '@tanstack/react-form';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';

import { FoodSearchField } from '@/components/food-search-field';
import type { UnifiedFoodSearchResultItem } from '@/components/food-search-field/types';
import { PhotoUploader } from '@/components/photo-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFoodSearch } from '@/hooks/use-food-search';
import { customDishFormSchema, zodValidator } from '@/lib/form-validation';
import type { CustomDishFormData } from '@/lib/form-validation';
import { useCreateDishMutation, useUpdateDishMutation } from '@/queries/dishes';
import type { DishDetail } from '@/types/dish';
import { useQueryClient } from '@tanstack/react-query';

// ─── types ────────────────────────────────────────────────────────────────────

interface Ingredient {
  key: string;
  foodId: string;
  foodName: string;
  thumbnail?: string | null;
  quantity: string;
}

interface CustomDishFormProps {
  /** present → edit mode; absent → create mode */
  dishId?: string;
  initialDish?: DishDetail;
}

// ─── ingredient row ───────────────────────────────────────────────────────────

function IngredientRow({
  ingredient,
  onRemove,
  onQuantityChange,
}: {
  ingredient: Ingredient;
  onRemove: () => void;
  onQuantityChange: (q: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
      {ingredient.thumbnail ? (
        <Image
          src={ingredient.thumbnail}
          alt=""
          width={32}
          height={32}
          className="rounded shrink-0 object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded bg-muted shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{ingredient.foodName}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Input
          type="number"
          min="0.1"
          step="0.1"
          value={ingredient.quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          className="w-24 text-right"
          aria-label="Quantity in grams"
        />
        <span className="text-xs text-muted-foreground">g</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
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

  const foodSearch = useFoodSearch({ includeCustom: true });
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialDish?.ingredients.map((ing) => ({
      key: ing.id,
      foodId: ing.foodId,
      foodName: ing.foodName,
      thumbnail: ing.thumbnail ?? null,
      quantity: ing.quantity.toString(),
    })) ?? [],
  );
  const [ingredientError, setIngredientError] = useState<string | null>(null);

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
      setIngredientError(null);

      const ingredientPayload = ingredients.map((ing, i) => ({
        foodId: ing.foodId,
        quantity: parseFloat(ing.quantity) || 100,
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
        await createMutation.mutateAsync({
          name: value.name,
          description: value.description || null,
          ingredients: ingredientPayload,
        });
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
        quantity: ing.quantity.toString(),
      })),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDish]);

  const handleAddIngredient = useCallback(
    (item: UnifiedFoodSearchResultItem) => {
      if (!item.id || item.itemKind === 'dish') return;
      setIngredients((prev) => [
        ...prev,
        { key: `${item.id}-${Date.now()}`, foodId: item.id!, foodName: item.name, thumbnail: item.thumbnail ?? null, quantity: '100' },
      ]);
      foodSearch.setQuery('');
      setIngredientError(null);
    },
    [foodSearch],
  );

  const handleRemove = (key: string) => {
    setIngredients((prev) => prev.filter((i) => i.key !== key));
  };

  const handleQuantityChange = (key: string, q: string) => {
    setIngredients((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: q } : i)));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div className="mb-8">
        <Link
          href="/my-foods?tab=dishes"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          My Foods
        </Link>
        <h1 className="text-4xl font-headline font-bold text-foreground">
          {isEdit ? 'Edit Dish' : 'Create Dish'}
        </h1>
        <p className="text-on-surface-variant mt-1">
          {isEdit ? 'Update dish details and ingredients' : 'Combine foods into a multi-ingredient dish'}
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
        {isEdit && dishId && (
          <div className="rounded-xl border border-outline-variant/20 p-5 bg-surface-container-lowest">
            <h2 className="text-sm font-bold text-foreground mb-4">Photo</h2>
            <PhotoUploader
              currentThumb={initialDish?.photo?.thumb ?? null}
              uploadUrl={`/api/dishes/${dishId}/photo`}
              label="Dish Photo"
              onUploaded={() => qc.invalidateQueries({ queryKey: ['dishes'] })}
              onDeleted={() => qc.invalidateQueries({ queryKey: ['dishes'] })}
              disabled={mutation.isPending}
            />
          </div>
        )}

        {/* Name + description */}
        <div className="rounded-xl border border-outline-variant/20 p-5 space-y-4 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-foreground">Dish Details</h2>

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

        {/* Ingredients */}
        <div className="rounded-xl border border-outline-variant/20 p-5 space-y-4 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-foreground">
            Ingredients
            {ingredients.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">({ingredients.length})</span>
            )}
          </h2>

          <FoodSearchField
            state={foodSearch}
            onQueryChange={foodSearch.setQuery}
            onLoadMore={foodSearch.loadMore}
            onSelect={handleAddIngredient}
            preferCustomTab
            placeholder="Search foods to add as ingredient…"
          />

          {ingredients.length > 0 && (
            <div className="space-y-2">
              {ingredients.map((ing) => (
                <IngredientRow
                  key={ing.key}
                  ingredient={ing}
                  onRemove={() => handleRemove(ing.key)}
                  onQuantityChange={(q) => handleQuantityChange(ing.key, q)}
                />
              ))}
            </div>
          )}

          {ingredientError && (
            <p className="text-sm text-destructive">{ingredientError}</p>
          )}
        </div>

        {mutation.error && (
          <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
        )}

        <div className="flex gap-3">
          <form.Subscribe selector={(state) => [state.isSubmitting]}>
            {([isSubmitting]) => (
              <Button
                type="submit"
                disabled={isSubmitting || mutation.isPending || ingredients.length === 0}
                data-testid={isEdit ? 'submit-edit-dish' : 'submit-create-dish'}
              >
                {isSubmitting || mutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{isEdit ? 'Saving…' : 'Creating…'}</>
                  : isEdit ? 'Save Changes' : 'Create Dish'}
              </Button>
            )}
          </form.Subscribe>
          <Button variant="outline" asChild>
            <Link href="/my-foods?tab=dishes">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
