
'use client';

import { useEffect, useMemo, useState } from 'react';
import FoodSearch from '@/components/food-search';
import FoodLogClient from '@/components/food-log-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFoodLogsQuery, useCreateFoodLogMutation, useDeleteFoodLogMutation } from '@/queries/food-logs';
import { useBarcodeQuery, useFoodSearchQuery } from '@/queries/foods';
import { format } from 'date-fns';
import type { NutritionSourceFood } from '@/lib/nutrition-sources/types';

export default function FoodLogPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [searchPage, setSearchPage] = useState(0);
  const [mergedSearchFoods, setMergedSearchFoods] = useState<NutritionSourceFood[]>([]);
  const [hasMore, setHasMore] = useState(false);

  const pageSize = 25;

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const logsQuery = useFoodLogsQuery(dateStr);
  const createMutation = useCreateFoodLogMutation();
  const deleteMutation = useDeleteFoodLogMutation();
  const searchQueryHook = useFoodSearchQuery(searchQuery, searchPage, pageSize);
  const barcodeQueryHook = useBarcodeQuery(barcode);

  const normalizeKey = (food: NutritionSourceFood) =>
    `${food.source}:${food.sourceId}:${(food.name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')}:${(food.brandName ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')}`;

  useEffect(() => {
    // Reset paging when query changes (or is cleared).
    setSearchPage(0);
    setMergedSearchFoods([]);
    setHasMore(false);
  }, [searchQuery]);

  useEffect(() => {
    const data = searchQueryHook.data;
    if (!data) return;

    setHasMore(Boolean(data.hasMore));

    setMergedSearchFoods((prev) => {
      if (searchPage === 0) return data.foods;

      const seen = new Set(prev.map(normalizeKey));
      const next = [...prev];
      for (const food of data.foods) {
        const key = normalizeKey(food);
        if (seen.has(key)) continue;
        seen.add(key);
        next.push(food);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQueryHook.data, searchPage]);

  const mergedSearchResults = useMemo(() => {
    if (!searchQueryHook.data) return undefined;
    return {
      ...searchQueryHook.data,
      foods: mergedSearchFoods,
      hasMore,
      page: searchPage,
      pageSize,
    };
  }, [searchQueryHook.data, mergedSearchFoods, hasMore, searchPage]);

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
               isSearching={searchQueryHook.isFetching && searchPage === 0}
               isLoadingMore={searchQueryHook.isFetching && searchPage > 0}
               onSearch={setSearchQuery}
               barcodeResults={barcodeQueryHook.data}
               isBarcodeSearching={barcodeQueryHook.isLoading}
               onLookupUpc={setBarcode}
               onAddFood={handleFoodAdded}
               onLoadMore={() => {
                 if (!hasMore) return;
                 if (searchQueryHook.isFetching) return;
                 setSearchPage((p) => p + 1);
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
