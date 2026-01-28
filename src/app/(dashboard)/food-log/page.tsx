
'use client';

import { useMemo, useState } from 'react';
import FoodSearch from '@/components/food-search';
import FoodLogClient from '@/components/food-log-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFoodLogsQuery, useCreateFoodLogMutation, useDeleteFoodLogMutation } from '@/queries/food-logs';
import { useInfiniteFoodSearchQuery } from '@/queries/foods';
import { format } from 'date-fns';
import type { NutritionSourceFood } from '@/lib/nutrition-sources/types';

export default function FoodLogPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  const pageSize = 25;

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const logsQuery = useFoodLogsQuery(dateStr);
  const createMutation = useCreateFoodLogMutation();
  const deleteMutation = useDeleteFoodLogMutation();
  const searchQueryHook = useInfiniteFoodSearchQuery(searchQuery, pageSize);

  const normalizeKey = (food: NutritionSourceFood) =>
    `${food.source}:${food.sourceId}:${(food.name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')}:${(food.brandName ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')}`;

  const mergedSearchResults = useMemo(() => {
    const pages = searchQueryHook.data?.pages ?? [];
    if (pages.length === 0) return undefined;

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
  }, [searchQueryHook.data, searchQueryHook.hasNextPage]);

  const handleFoodAdded = async (food: NutritionSourceFood, quantity: string, mealType: string) => {
    await createMutation.mutateAsync({
      foodId: food.id,
      food,
      foodName: food.name,
      brandName: food.brandName ?? undefined,
      quantity,
      servingUnit: food.servingUnit,
      mealType,
    });
  };

  const handleDeleteLog = async (logId: number) => {
    await deleteMutation.mutateAsync(logId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Food Log</h1>
        <p className="text-muted-foreground">Track your daily food intake</p>
      </div>

      {/* Add Food Section */}
      <div className="mb-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <span>Add Food</span>
              </CardTitle>
          </CardHeader>
           <CardContent>
             <FoodSearch
               searchResults={mergedSearchResults}
               isSearching={searchQueryHook.isFetching && !searchQueryHook.isFetchingNextPage && !searchQueryHook.data}
               isLoadingMore={searchQueryHook.isFetchingNextPage}
               onSearch={setSearchQuery}
               onAddFood={handleFoodAdded}
               onLoadMore={() => {
                 if (!searchQueryHook.hasNextPage) return;
                 if (searchQueryHook.isFetchingNextPage) return;
                 void searchQueryHook.fetchNextPage();
               }}
             />
           </CardContent>
        </Card>
      </div>

       {/* Food Log Display */}
       <FoodLogClient
         logs={logsQuery.data?.logs || []}
         logsByMeal={logsQuery.data?.logsByMeal || {}}
         totals={logsQuery.data?.totals || {
           calories: 0,
           protein: 0,
           carbs: 0,
           fat: 0,
           fiber: 0,
           sugar: 0,
           sodium: 0,
         }}
         isLoading={logsQuery.isLoading}
         onDateChange={setSelectedDate}
         onDeleteLog={handleDeleteLog}
       />
    </div>
  );
}
