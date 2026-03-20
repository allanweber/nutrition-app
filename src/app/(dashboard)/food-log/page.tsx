'use client';

import { useState } from 'react';
import { FoodSearchField } from '@/components/food-search-field';
import { FoodLogAddModal } from '@/components/food-log-add-modal';
import FoodLogClient from '@/components/food-log-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFoodLogsQuery, useDeleteFoodLogMutation } from '@/queries/food-logs';
import { useFoodDetailQuery, type FoodSelection } from '@/queries/food-detail';
import { useFoodSearch } from '@/hooks/use-food-search';
import { format } from 'date-fns';
import type { UnifiedFoodSearchResultItem } from '@/components/food-search-field/types';

export default function FoodLogPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedFood, setSelectedFood] = useState<UnifiedFoodSearchResultItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const logsQuery = useFoodLogsQuery(dateStr);
  const deleteMutation = useDeleteFoodLogMutation();

  const foodSearch = useFoodSearch({ includeCustom: true });

  // Build FoodSelection for detail query
  const foodSelection: FoodSelection | null = selectedFood
    ? selectedFood.id !== null
      ? { id: selectedFood.id, fatSecretId: selectedFood.fatSecretId ?? undefined }
      : selectedFood.fatSecretId
        ? { id: null, fatSecretId: selectedFood.fatSecretId }
        : null
    : null;

  const detailQuery = useFoodDetailQuery(foodSelection);

  const handleSelect = (item: UnifiedFoodSearchResultItem) => {
    setSelectedFood(item);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedFood(null);
  };

  const handleFoodAdded = () => {
    setModalOpen(false);
    setSelectedFood(null);
    foodSearch.setQuery('');
  };

  const handleDeleteLog = async (logId: number) => {
    await deleteMutation.mutateAsync(logId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Food Log</h1>
        <p className="text-muted-foreground mt-0.5">Search and log your meals for the day</p>
      </div>

      {/* Add Food Section */}
      <div className="mb-6 space-y-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Add Food — Default size</CardTitle>
          </CardHeader>
          <CardContent>
            <FoodSearchField
              state={foodSearch}
              onQueryChange={foodSearch.setQuery}
              onLoadMore={foodSearch.loadMore}
              onSelect={handleSelect}
              showCustomTab={true}
              placeholder="Search for foods (e.g., 'apple', 'chicken breast')"
            />
          </CardContent>
        </Card>
      </div>

      {/* Add to Diary Modal */}
      <FoodLogAddModal
        open={modalOpen}
        food={selectedFood}
        foodDetail={detailQuery.data?.food ?? null}
        isDetailLoading={detailQuery.isLoading}
        onClose={handleModalClose}
        onAdded={handleFoodAdded}
      />

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
