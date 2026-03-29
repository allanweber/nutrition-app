'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, UtensilsCrossed, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      label: 'Ingredients',
      getValue: (d) => `${d.ingredientCount}`,
    },
    getEditHref: (d) => `/my-foods/dishes/${d.id}/edit`,
    onDelete: (id) => deleteDish.mutate(id),
    rowTestIdPrefix: 'dish-item',
    actionTestIdPrefix: 'dish',
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
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

      {/* Tabs + Table */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit mb-6">
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

      {tab === 'foods' && (
        <NutritionItemsTable
          items={foodsQuery.data?.foods ?? []}
          config={foodsConfig}
          isLoading={foodsQuery.isLoading}
          emptyTitle="No custom foods yet"
          emptyDescription="Create your own foods with exact nutrition info and reuse them across your logs."
          searchPlaceholder="Filter by food name..."
        />
      )}

      {tab === 'dishes' && (
        <NutritionItemsTable
          items={dishesQuery.data?.dishes ?? []}
          config={dishesConfig}
          isLoading={dishesQuery.isLoading}
          emptyTitle="No dishes yet"
          emptyDescription="Create multi-ingredient dishes and log them as a single entry with a serving multiplier."
          searchPlaceholder="Filter by dish name..."
        />
      )}
    </div>
  );
}
