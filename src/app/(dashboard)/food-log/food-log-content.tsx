'use client';

import { useMemo, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { FoodSearchField } from '@/components/food-search-field';
import { CreatePlanButton, CreateFoodButton } from '@/components/create-action-buttons';
import { FoodLogAddModal } from '@/components/food-log-add-modal';
import FoodLogClient from '@/components/food-log-client';
import { NutritionPulse } from '@/components/food-log/nutrition-pulse';
import { WeeklyCalendarStrip } from '@/components/food-log/weekly-calendar-strip';
import { useFoodLogsQuery, useDeleteFoodLogMutation } from '@/queries/food-logs';
import { useFoodDetailQuery, type FoodSelection } from '@/queries/food-detail';
import { useFoodSearch } from '@/hooks/use-food-search';
import type { UnifiedFoodSearchResultItem } from '@/components/food-search-field/types';

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

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const logsQuery = useFoodLogsQuery(dateStr);
  const deleteMutation = useDeleteFoodLogMutation();
  const foodSearch = useFoodSearch({ includeCustom: true });

  const foodSelection: FoodSelection | null = selectedFood
    ? selectedFood.id !== null
      ? { id: selectedFood.id, fatSecretId: selectedFood.fatSecretId ?? undefined }
      : selectedFood.fatSecretId
        ? { id: null, fatSecretId: selectedFood.fatSecretId }
        : null
    : null;

  const detailQuery = useFoodDetailQuery(foodSelection);

  const recentFoods = useMemo(() => {
    const logs = logsQuery.data?.logs ?? [];
    const seen = new Set<string>();
    const names: string[] = [];
    for (const log of [...logs].reverse()) {
      if (!seen.has(log.food.name)) {
        seen.add(log.food.name);
        names.push(log.food.name);
        if (names.length >= 5) break;
      }
    }
    return names;
  }, [logsQuery.data?.logs]);

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

  const handleDeleteLog = async (logId: string) => {
    await deleteMutation.mutateAsync(logId);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    router.replace(`/food-log?date=${format(date, 'yyyy-MM-dd')}`, { scroll: false });
  };

  const handleQuickAdd = (foodName: string) => {
    foodSearch.setQuery(foodName);
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
          placeholder="Search for foods (e.g., 'apple', 'chicken breast')"
        />

        {/* Food log */}
        <FoodLogClient
          logs={logsQuery.data?.logs || []}
          logsByMeal={logsQuery.data?.logsByMeal || {}}
          totals={
            logsQuery.data?.totals || {
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              fiber: 0,
              sugar: 0,
              sodium: 0,
            }
          }
          isLoading={logsQuery.isLoading}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onDeleteLog={handleDeleteLog}
        />
      </div>

      {/* Right column — Nutrition Pulse sidebar */}
      <div className="lg:col-span-4">
        <NutritionPulse
          date={dateStr}
          recentFoods={recentFoods}
          onQuickAdd={handleQuickAdd}
        />
      </div>

      <FoodLogAddModal
        open={modalOpen}
        food={selectedFood}
        foodDetail={detailQuery.data?.food ?? null}
        isDetailLoading={detailQuery.isLoading}
        onClose={handleModalClose}
        onAdded={handleFoodAdded}
      />
    </div>
  );
}
