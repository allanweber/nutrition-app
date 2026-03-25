'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FoodSearchField } from '@/components/food-search-field';
import { useFoodSearch } from '@/hooks/use-food-search';
import { useCreateDishMutation } from '@/queries/dishes';
import type { UnifiedFoodSearchResultItem } from '@/components/food-search-field/types';

interface Ingredient {
  key: string;
  foodId: string;
  foodName: string;
  quantity: string;
}

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

export default function CreateDishPage() {
  const router = useRouter();
  const createMutation = useCreateDishMutation();
  const foodSearch = useFoodSearch({ includeCustom: true });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAddIngredient = useCallback((item: UnifiedFoodSearchResultItem) => {
    if (!item.id || item.itemKind === 'dish') return;
    setIngredients((prev) => [
      ...prev,
      { key: `${item.id}-${Date.now()}`, foodId: item.id!, foodName: item.name, quantity: '100' },
    ]);
    foodSearch.setQuery('');
  }, [foodSearch]);

  const handleRemove = (key: string) => {
    setIngredients((prev) => prev.filter((i) => i.key !== key));
  };

  const handleQuantityChange = (key: string, q: string) => {
    setIngredients((prev) => prev.map((i) => i.key === key ? { ...i, quantity: q } : i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (ingredients.length === 0) {
      setError('Add at least one ingredient');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name,
        description: description || null,
        ingredients: ingredients.map((ing, i) => ({
          foodId: ing.foodId,
          quantity: parseFloat(ing.quantity) || 100,
          seq: i + 1,
        })),
      });
      router.push('/my-foods?tab=dishes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dish');
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
        <h1 className="text-4xl font-headline font-bold text-foreground">Create Dish</h1>
        <p className="text-on-surface-variant mt-1">Combine foods into a multi-ingredient dish</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name + description */}
        <div className="rounded-xl border border-outline-variant/20 p-5 space-y-4 bg-surface-container-lowest">
          <h2 className="text-sm font-bold text-foreground">Dish Details</h2>
          <div className="space-y-1.5">
            <Label htmlFor="dish-name" className="text-xs font-semibold">Name *</Label>
            <Input
              id="dish-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., High-Protein Breakfast Bowl"
              data-testid="field-dish-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dish-description" className="text-xs font-semibold">Description</Label>
            <Input
              id="dish-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              data-testid="field-dish-description"
            />
          </div>
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
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={createMutation.isPending || ingredients.length === 0} data-testid="submit-create-dish">
            {createMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating…</> : 'Create Dish'}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/my-foods">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
