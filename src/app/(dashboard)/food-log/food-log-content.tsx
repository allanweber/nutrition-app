'use client';

import { useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { FoodSearchField } from '@/components/food-search-field';
import { CreatePlanButton, CreateFoodButton } from '@/components/create-action-buttons';
import { FoodLogAddModal } from '@/components/food-log-add-modal';
import { DishLogModal } from '@/components/dish-log-modal';
import FoodLogClient from '@/components/food-log-client';
import { NutritionPulse } from '@/components/food-log/nutrition-pulse';
import { WeeklyCalendarStrip } from '@/components/food-log/weekly-calendar-strip';
import { useFoodLogsQuery, useDeleteFoodLogMutation } from '@/queries/food-logs';
import { useDeleteDishGroupMutation } from '@/queries/dishes';
import { useFoodDetailQuery, type FoodSelection } from '@/queries/food-detail';
import { FoodModal } from '@/components/food-modal';
import type { MealType } from '@/lib/nutrition-constants';
import type { FoodLogEntry } from '@/types/food';

const EMPTY_FOOD_DETAIL: import('@/queries/food-detail').FoodDetailResponse = {
  id: '', name: '', brandName: null, foodType: 'Generic', foodUrl: null,
  baseServing: { calories: 0, protein: 0, carbs: 0, fat: 0, saturatedFat: null, fiber: null, sugar: null, sodium: null, potassium: null, vitaminA: null, vitaminC: null, calcium: null, iron: null },
  servings: [], images: null,
};
import { useFoodSearch } from '@/hooks/use-food-search';
import type { UnifiedFoodSearchResultItem } from '@/components/food-search-field/types';
import type { FavoriteItem } from '@/types/favorites';

export function FoodLogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsed = parseISO(dateParam);
      if (isValid(parsed)) return parsed;
    }
    return new Date();
  });
  const [selectedFood, setSelectedFood] = useState<UnifiedFoodSearchResultItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Edit modal state
  const [editingLog, setEditingLog] = useState<FoodLogEntry | null>(null);
  const editFoodSelection: FoodSelection | null = editingLog ? { id: editingLog.food.id } : null;
  const editDetailQuery = useFoodDetailQuery(editFoodSelection);

  // Dish modal state
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [selectedDishName, setSelectedDishName] = useState<string | undefined>();
  const [dishModalOpen, setDishModalOpen] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const logsQuery = useFoodLogsQuery(dateStr);
  const deleteMutation = useDeleteFoodLogMutation();
  const deleteDishGroupMutation = useDeleteDishGroupMutation();
  const foodSearch = useFoodSearch({ includeCustom: true });

  const foodSelection: FoodSelection | null = selectedFood
    ? selectedFood.id !== null
      ? { id: selectedFood.id, fatSecretId: selectedFood.fatSecretId ?? undefined }
      : selectedFood.fatSecretId
        ? { id: null, fatSecretId: selectedFood.fatSecretId }
        : null
    : null;

  const detailQuery = useFoodDetailQuery(foodSelection);

  const handleSelect = (item: UnifiedFoodSearchResultItem) => {
    if (item.itemKind === 'dish' && item.dishId) {
      setSelectedDishId(item.dishId);
      setSelectedDishName(item.name);
      setDishModalOpen(true);
    } else {
      setSelectedFood(item);
      setModalOpen(true);
    }
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

  const handleDishModalClose = () => {
    setDishModalOpen(false);
    setSelectedDishId(null);
    setSelectedDishName(undefined);
  };

  const handleDishLogged = () => {
    setDishModalOpen(false);
    setSelectedDishId(null);
    setSelectedDishName(undefined);
    foodSearch.setQuery('');
  };

  const handleEditLog = (log: FoodLogEntry) => setEditingLog(log);
  const handleEditModalClose = () => setEditingLog(null);
  const handleFoodUpdated = () => setEditingLog(null);

  const handleDeleteLog = async (logId: string) => {
    await deleteMutation.mutateAsync(logId);
  };

  const handleDeleteDishGroup = async (dishLogGroupId: string) => {
    await deleteDishGroupMutation.mutateAsync(dishLogGroupId);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    router.replace(`/food-log?date=${format(date, 'yyyy-MM-dd')}`, { scroll: false });
  };

  // Handle favorite pill click — food or dish
  const handleFavoriteSelect = (item: FavoriteItem) => {
    if (item.type === 'dish') {
      setSelectedDishId(item.itemId);
      setSelectedDishName(item.name);
      setDishModalOpen(true);
    } else {
      // Open food log add modal by constructing a minimal search result item
      const searchItem: UnifiedFoodSearchResultItem = {
        id: item.itemId,
        fatSecretId: null,
        name: item.name,
        brandName: null,
        foodType: 'Custom',
        thumbnail: item.thumbnail,
        calories: item.calories,
        itemKind: 'food',
      };
      setSelectedFood(searchItem);
      setModalOpen(true);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start pt-6">
      {/* Left column */}
      <div className="lg:col-span-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-4xl font-headline font-bold text-foreground"
              data-testid="food-log-heading"
            >
              Meal Planner &amp; Daily Intake
            </h1>
            <p className="text-on-surface-variant mt-1">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <CreatePlanButton />
            <CreateFoodButton />
          </div>
        </div>

        {/* Weekly calendar strip */}
        <WeeklyCalendarStrip selectedDate={selectedDate} onDateChange={handleDateChange} />

        {/* Search row */}
        <FoodSearchField
          state={foodSearch}
          onQueryChange={foodSearch.setQuery}
          onLoadMore={foodSearch.loadMore}
          onSelect={handleSelect}
          showCustomTab={true}
          preferCustomTab={foodSearch.hasCustomResults}
          placeholder="Search for foods (e.g., 'apple', 'chicken breast')"
        />

        {/* Food log */}
        <FoodLogClient
          key={dateStr}
          logs={logsQuery.data?.logs || []}
          logsByMeal={logsQuery.data?.logsByMeal || {}}
          totals={
            logsQuery.data?.totals || {
              calories: 0, protein: 0, carbs: 0, fat: 0,
              fiber: 0, sugar: 0, sodium: 0,
            }
          }
          isLoading={logsQuery.isLoading}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onDeleteLog={handleDeleteLog}
          onDeleteDishGroup={handleDeleteDishGroup}
          onEdit={handleEditLog}
        />
      </div>

      {/* Right column — Nutrition Pulse sidebar */}
      <div className="lg:col-span-4">
        <NutritionPulse
          date={dateStr}
          onAddFood={handleFavoriteSelect}
          onQuickAddFood={(name) => foodSearch.setQuery(name)}
        />
      </div>

      <FoodLogAddModal
        open={modalOpen}
        food={selectedFood}
        foodDetail={detailQuery.data?.food ?? null}
        isDetailLoading={detailQuery.isLoading}
        onClose={handleModalClose}
        onAdded={handleFoodAdded}
        defaultDate={selectedDate}
      />

      {editingLog && (
        <FoodModal
          open={true}
          onClose={handleEditModalClose}
          isLoading={editDetailQuery.isLoading || !editDetailQuery.data}
          name={editingLog.food.name}
          subtitle={editingLog.food.brandName ?? undefined}
          imageUrl={
            editDetailQuery.data?.food.images?.highres ??
            editDetailQuery.data?.food.images?.thumb ??
            editingLog.food.photoUrl ??
            undefined
          }
          mode={{
            kind: 'edit-food',
            logId: editingLog.id,
            foodDetail: editDetailQuery.data?.food ?? EMPTY_FOOD_DETAIL,
            initialMealType: editingLog.mealType as MealType,
            initialDate: new Date(editingLog.consumedAt),
            initialQuantityGrams: editingLog.quantity,
            initialAltMeasureId: editingLog.altMeasure?.id ?? null,
            onUpdated: handleFoodUpdated,
          }}
        />
      )}

      <DishLogModal
        open={dishModalOpen}
        dishId={selectedDishId}
        dishName={selectedDishName}
        onClose={handleDishModalClose}
        onLogged={handleDishLogged}
        defaultDate={selectedDate}
      />
    </div>
  );
}
