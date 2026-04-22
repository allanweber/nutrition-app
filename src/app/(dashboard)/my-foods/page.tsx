'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, UtensilsCrossed, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDishesQuery, useDeleteDishMutation } from '@/queries/dishes';
import { NutritionItemsTable, type NutritionTableConfig } from '@/components/nutrition-items-table';
import {
  MACRO_CELL_BG,
  MACRO_CELL_TEXT,
  MACRO_CELL_FILL,
} from '@/lib/nutrition-constants';
import type { DishListItem } from '@/types/dish';

interface CustomFood {
  id: string;
  name: string;
  brandName: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
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

  const foodsConfig: NutritionTableConfig<CustomFood> = {
    getId: (f) => f.id,
    getItemName: (f) => f.name,
    getItemSubtitle: (f) => f.brandName,
    getThumbnail: (f) => f.thumbnail,
    getEnergy: (f) => f.calories,
    macros: [
      {
        label: 'Protein', unit: '/100g',
        getValue: (f) => f.protein,
        getBarWidth: (f) => Math.min((f.protein / 50) * 100, 100),
        bg: MACRO_CELL_BG.protein, text: MACRO_CELL_TEXT.protein, fill: MACRO_CELL_FILL.protein,
      },
      {
        label: 'Carbs', unit: '/100g',
        getValue: (f) => f.carbs,
        getBarWidth: (f) => Math.min(f.carbs, 100),
        bg: MACRO_CELL_BG.carbs, text: MACRO_CELL_TEXT.carbs, fill: MACRO_CELL_FILL.carbs,
      },
      {
        label: 'Fats', unit: '/100g',
        getValue: (f) => f.fat,
        getBarWidth: (f) => Math.min(f.fat, 100),
        bg: MACRO_CELL_BG.fat, text: MACRO_CELL_TEXT.fat, fill: MACRO_CELL_FILL.fat,
      },
    ],
    extraCol: { label: 'Fiber', getValue: (f) => `${(f.fiber ?? 0).toFixed(1)}g` },
    getEditHref: (f) => `/my-foods/${f.id}/edit`,
    onDelete: (id) => deleteFood.mutate(id),
    rowTestIdPrefix: 'custom-food',
    actionTestIdPrefix: 'food',
  };

  const dishesConfig: NutritionTableConfig<DishListItem> = {
    getId: (d) => d.id,
    getItemName: (d) => d.name,
    getItemSubtitle: (d) => d.description,
    getThumbnail: (d) => d.thumbnail,
    getEnergy: (d) => d.totalCalories,
    macros: [
      {
        label: 'Protein', unit: 'total',
        getValue: (d) => d.totalProtein,
        getBarWidth: (d) => {
          const t = d.totalProtein + d.totalCarbs + d.totalFat;
          return t > 0 ? Math.min((d.totalProtein / t) * 100, 100) : 0;
        },
        bg: MACRO_CELL_BG.protein, text: MACRO_CELL_TEXT.protein, fill: MACRO_CELL_FILL.protein,
      },
      {
        label: 'Carbs', unit: 'total',
        getValue: (d) => d.totalCarbs,
        getBarWidth: (d) => {
          const t = d.totalProtein + d.totalCarbs + d.totalFat;
          return t > 0 ? Math.min((d.totalCarbs / t) * 100, 100) : 0;
        },
        bg: MACRO_CELL_BG.carbs, text: MACRO_CELL_TEXT.carbs, fill: MACRO_CELL_FILL.carbs,
      },
      {
        label: 'Fats', unit: 'total',
        getValue: (d) => d.totalFat,
        getBarWidth: (d) => {
          const t = d.totalProtein + d.totalCarbs + d.totalFat;
          return t > 0 ? Math.min((d.totalFat / t) * 100, 100) : 0;
        },
        bg: MACRO_CELL_BG.fat, text: MACRO_CELL_TEXT.fat, fill: MACRO_CELL_FILL.fat,
      },
    ],
    extraCol: {
      label: 'Ing.',
      getValue: (d) => `${d.ingredientCount}`,
    },
    getEditHref: (d) => `/my-foods/dishes/${d.id}/edit`,
    onDelete: (id) => deleteDish.mutate(id),
    rowTestIdPrefix: 'dish-item',
    actionTestIdPrefix: 'dish',
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
      <PageHeader
        overline="My Library"
        title="Custom Foods and Dishes"
        subtitle="Manage your own foods and custom dishes with several ingredients"
      >
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
      </PageHeader>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'foods' | 'dishes')} className="mb-6">
        <TabsList className="h-11">
          <TabsTrigger value="foods" data-testid="tab-custom-foods" className="px-5 text-sm">
            <UtensilsCrossed className="h-4 w-4 mr-1.5" />
            Custom Foods
          </TabsTrigger>
          <TabsTrigger value="dishes" data-testid="tab-dishes" className="px-5 text-sm">
            <ChefHat className="h-4 w-4 mr-1.5" />
            Dishes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="foods">
          <NutritionItemsTable
            items={foodsQuery.data?.foods ?? []}
            config={foodsConfig}
            isLoading={foodsQuery.isLoading}
            searchPlaceholder="Filter by food name..."
            emptyState={
              <div className="flex justify-center py-4">
                <div className="flex flex-col gap-4 max-w-70 text-left">
                  <div className="space-y-1">
                    <p className="text-base font-bold text-foreground">Your nutritional database</p>
                    <p className="text-sm text-muted-foreground">Define foods with exact macro profiles per 100g — reusable across every log and dish.</p>
                  </div>
                  <div className="rounded-md border border-border/50 divide-y divide-border/30 text-xs select-none pointer-events-none">
                    <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">
                      <span className="flex-1">Name</span>
                      <span className="flex gap-4"><span>Protein</span><span>Carbs</span><span>Fat</span></span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-muted-foreground/25">
                      <span className="flex-1">—————————</span>
                      <span className="flex gap-5 font-mono"><span>—g</span><span>—g</span><span>—g</span></span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-muted-foreground/15">
                      <span className="flex-1">——————</span>
                      <span className="flex gap-5 font-mono"><span>—g</span><span>—g</span><span>—g</span></span>
                    </div>
                  </div>
                  <Button asChild size="sm" className="self-start">
                    <Link href="/my-foods/create">Create your first food</Link>
                  </Button>
                </div>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="dishes">
          <NutritionItemsTable
            items={dishesQuery.data?.dishes ?? []}
            config={dishesConfig}
            isLoading={dishesQuery.isLoading}
            searchPlaceholder="Filter by dish name..."
            emptyState={
              <div className="flex justify-center py-4">
                <div className="flex flex-col gap-4 max-w-[280px] text-left">
                  <div className="space-y-1">
                    <p className="text-base font-bold text-foreground">Recipes, logged as one entry</p>
                    <p className="text-sm text-muted-foreground">Combine ingredients into dishes with exact totals — log any portion with a serving multiplier.</p>
                  </div>
                  <div className="rounded-md border border-border/50 px-3 py-2 text-xs select-none pointer-events-none space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">Recipe</p>
                    <div className="pl-1 space-y-1 text-muted-foreground/30">
                      <p>· Ingredient A &nbsp; 100g</p>
                      <p className="opacity-75">· Ingredient B &nbsp; 50g</p>
                      <p className="opacity-50">· Ingredient C &nbsp; 30g</p>
                    </div>
                    <div className="pt-1.5 border-t border-border/30 flex justify-between text-muted-foreground/25">
                      <span>Total</span>
                      <span>——— kcal</span>
                    </div>
                  </div>
                  <Button asChild size="sm" className="self-start">
                    <Link href="/my-foods/dishes/create">Create your first dish</Link>
                  </Button>
                </div>
              </div>
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
