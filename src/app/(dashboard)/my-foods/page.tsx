'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, Loader2, UtensilsCrossed, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDishesQuery, useDeleteDishMutation } from '@/queries/dishes';

interface CustomFood {
  id: string;
  name: string;
  brandName: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  thumbnail: string | null;
  createdAt: string;
}

function useCustomFoodsQuery() {
  return useQuery({
    queryKey: ['foods', 'custom'],
    queryFn: async (): Promise<{ foods: CustomFood[] }> => {
      const res = await fetch('/api/foods/custom');
      if (!res.ok) throw new Error('Failed to fetch custom foods');
      return res.json();
    },
  });
}

function useDeleteCustomFoodMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (foodId: string) => {
      const res = await fetch(`/api/foods/custom/${foodId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete food');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foods', 'custom'] }),
  });
}

export default function MyFoodsPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'foods' | 'dishes'>(
    searchParams.get('tab') === 'dishes' ? 'dishes' : 'foods'
  );
  const foodsQuery = useCustomFoodsQuery();
  const dishesQuery = useDishesQuery();
  const deleteFood = useDeleteCustomFoodMutation();
  const deleteDish = useDeleteDishMutation();

  const [confirmDeleteFood, setConfirmDeleteFood] = useState<string | null>(null);
  const [confirmDeleteDish, setConfirmDeleteDish] = useState<string | null>(null);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-headline font-bold text-foreground">My Foods</h1>
          <p className="text-on-surface-variant mt-1">Your custom food and dish library</p>
        </div>
        <div className="flex gap-2">
          {tab === 'foods' ? (
            <Button asChild>
              <Link href="/my-foods/create">
                <Plus className="h-4 w-4 mr-1.5" />
                New Food
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/my-foods/dishes/create">
                <Plus className="h-4 w-4 mr-1.5" />
                New Dish
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit mb-8">
        <button
          onClick={() => setTab('foods')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'foods' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="tab-custom-foods"
        >
          <span className="flex items-center gap-1.5">
            <UtensilsCrossed className="h-4 w-4" />
            Custom Foods
          </span>
        </button>
        <button
          onClick={() => setTab('dishes')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'dishes' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
          data-testid="tab-dishes"
        >
          <span className="flex items-center gap-1.5">
            <ChefHat className="h-4 w-4" />
            Dishes
          </span>
        </button>
      </div>

      {/* Custom Foods Tab */}
      {tab === 'foods' && (
        <div>
          {foodsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (foodsQuery.data?.foods ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
                <UtensilsCrossed className="h-8 w-8 text-on-surface-variant/40" />
              </div>
              <h2 className="text-xl font-bold text-foreground">No custom foods yet</h2>
              <p className="text-sm text-on-surface-variant max-w-sm">
                Create your own foods with exact nutrition info and reuse them across your logs.
              </p>
              <Button asChild>
                <Link href="/my-foods/create"><Plus className="h-4 w-4 mr-1.5" />Create Food</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {foodsQuery.data?.foods.map((food) => (
                <div
                  key={food.id}
                  className="flex items-center gap-4 px-5 py-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest hover:border-primary/20 transition-all"
                  data-testid={`custom-food-${food.id}`}
                >
                  {food.thumbnail ? (
                    <Image src={food.thumbnail} alt="" width={40} height={40} className="rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="h-4 w-4 text-on-surface-variant/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{food.name}</p>
                    {food.brandName && <p className="text-xs text-on-surface-variant">{food.brandName}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant tabular-nums">
                      <span>{food.calories} kcal</span>
                      <span>P {food.protein}g</span>
                      <span>C {food.carbs}g</span>
                      <span>F {food.fat}g</span>
                      <span className="text-[10px]">per 100g</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/my-foods/${food.id}/edit`} aria-label={`Edit ${food.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    {confirmDeleteFood === food.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { deleteFood.mutate(food.id); setConfirmDeleteFood(null); }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all"
                          data-testid={`confirm-delete-food-${food.id}`}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteFood(null)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/70 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-on-surface-variant hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDeleteFood(food.id)}
                        aria-label={`Delete ${food.name}`}
                        data-testid={`delete-food-${food.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dishes Tab */}
      {tab === 'dishes' && (
        <div>
          {dishesQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (dishesQuery.data?.dishes ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
                <ChefHat className="h-8 w-8 text-on-surface-variant/40" />
              </div>
              <h2 className="text-xl font-bold text-foreground">No dishes yet</h2>
              <p className="text-sm text-on-surface-variant max-w-sm">
                Create multi-ingredient dishes and log them as a single entry with a serving multiplier.
              </p>
              <Button asChild>
                <Link href="/my-foods/dishes/create"><Plus className="h-4 w-4 mr-1.5" />Create Dish</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {dishesQuery.data?.dishes.map((dish) => (
                <div
                  key={dish.id}
                  className="flex items-center gap-4 px-5 py-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest hover:border-primary/20 transition-all"
                  data-testid={`dish-item-${dish.id}`}
                >
                  {dish.thumbnail ? (
                    <Image src={dish.thumbnail} alt="" width={40} height={40} className="rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                      <ChefHat className="h-4 w-4 text-on-surface-variant/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{dish.name}</p>
                    {dish.description && <p className="text-xs text-on-surface-variant">{dish.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant tabular-nums">
                      <span>{dish.totalCalories} kcal</span>
                      <span>P {dish.totalProtein}g</span>
                      <span>C {dish.totalCarbs}g</span>
                      <span>F {dish.totalFat}g</span>
                      <span className="text-[10px]">· {dish.ingredientCount} ingredient{dish.ingredientCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/my-foods/dishes/${dish.id}/edit`} aria-label={`Edit ${dish.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    {confirmDeleteDish === dish.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { deleteDish.mutate(dish.id); setConfirmDeleteDish(null); }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all"
                          data-testid={`confirm-delete-dish-${dish.id}`}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteDish(null)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/70 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-on-surface-variant hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDeleteDish(dish.id)}
                        aria-label={`Delete ${dish.name}`}
                        data-testid={`delete-dish-${dish.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
