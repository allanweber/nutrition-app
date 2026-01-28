
'use client';

import { useMemo, useState } from 'react';
import FoodSearch from '@/components/food-search';
import FoodLogClient from '@/components/food-log-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueries } from '@tanstack/react-query';
import { useFoodLogsQuery, useCreateFoodLogMutation, useDeleteFoodLogMutation } from '@/queries/food-logs';
import { FOOD_IMAGE_QUERY_KEY, fetchFoodImageUrl, useInfiniteFoodSearchQuery } from '@/queries/foods';
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
      // Avoid spamming many requests for large result lists.
      if (urls.length >= 20) break;
    }

    return urls;
  }, [mergedSearchResults?.foods]);

  const foodImageQueries = useQueries({
    queries: foodUrlsNeedingImages.map((foodUrl) => ({
      queryKey: FOOD_IMAGE_QUERY_KEY(foodUrl),
      queryFn: () => fetchFoodImageUrl(foodUrl),
      enabled: searchQuery.trim().length >= 3,
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
  }, [mergedSearchResults, foodImageQueries, foodUrlsNeedingImages]);

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
             {searchQuery.trim().length >= 3 && searchQueryHook.isError && (
               <div className="mb-3 rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-950/30 dark:text-red-300">
                 {searchQueryHook.error instanceof Error
                   ? searchQueryHook.error.message
                   : 'Food search failed. Please try again.'}
               </div>
             )}
             <FoodSearch
               searchResults={enrichedSearchResults}
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
