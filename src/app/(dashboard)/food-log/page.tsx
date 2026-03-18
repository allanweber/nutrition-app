'use client';

import { useState } from 'react';
import FoodSearch from '@/components/food-search';
import FoodLogClient from '@/components/food-log-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFoodLogsQuery, useCreateFoodLogMutation, useDeleteFoodLogMutation } from '@/queries/food-logs';
import { useFoodSearchQuery } from '@/queries/foods';
import { useFoodDetailQuery, type FoodSelection } from '@/queries/food-detail';
import { parseApiError } from '@/lib/api-error';
import { format } from 'date-fns';

export default function FoodLogPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFood, setSelectedFood] = useState<FoodSelection | null>(null);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const logsQuery = useFoodLogsQuery(dateStr);
  const createMutation = useCreateFoodLogMutation();
  const deleteMutation = useDeleteFoodLogMutation();

  const searchQueryHook = useFoodSearchQuery(searchQuery, currentPage);
  const detailQueryHook = useFoodDetailQuery(selectedFood);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setSelectedFood(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSelectFood = (food: { id: number | null; fatSecretId: string }) => {
    setSelectedFood(food.id !== null ? { id: food.id } : { id: null, fatSecretId: food.fatSecretId });
  };

  const handleCloseDetail = () => {
    setSelectedFood(null);
  };

  const handleFoodAdded = async (food: { food_name: string; brand_name?: string; serving_unit: string }, quantity: string, mealType: string) => {
    await createMutation.mutateAsync({
      foodName: food.food_name,
      brandName: food.brand_name,
      quantity,
      servingUnit: food.serving_unit,
      mealType,
    });
  };

  const handleDeleteLog = async (logId: number) => {
    await deleteMutation.mutateAsync(logId);
  };

  const searchError = searchQueryHook.error
    ? parseApiError(searchQueryHook.error).message
    : null;

  const detailError = detailQueryHook.error
    ? parseApiError(detailQueryHook.error).message
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Food Log</h1>
        <p className="text-muted-foreground mt-0.5">Search and log your meals for the day</p>
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
              results={searchQueryHook.data?.results ?? []}
              pagination={searchQueryHook.data?.pagination ?? null}
              isLoading={searchQueryHook.isLoading}
              error={searchError}
              onSearch={handleSearch}
              onPageChange={handlePageChange}
              onSelectFood={handleSelectFood}
              foodDetail={detailQueryHook.data?.food ?? null}
              isDetailLoading={detailQueryHook.isLoading}
              detailError={detailError}
              onCloseDetail={handleCloseDetail}
              onAddFood={handleFoodAdded}
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
