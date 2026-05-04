'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { FoodSearchField } from '@/components/food-search-field';
import { CreatePlanButton, CreateFoodButton } from '@/components/create-action-buttons';
import { FoodLogAddModal } from '@/components/food-log-add-modal';
import { DishLogModal } from '@/components/dish-log-modal';
import FoodLogClient from '@/components/food-log-client';
import { LogMealsModal } from '@/components/food-log/log-meals-modal';
import { MealPlanBanner } from '@/components/food-log/meal-plan-banner';
import { NutritionPulse } from '@/components/food-log/nutrition-pulse';
import { WeeklyCalendarStrip } from '@/components/food-log/weekly-calendar-strip';
import { useFoodLogsQuery, useDeleteFoodLogMutation, useLogFromPlanMutation } from '@/queries/food-logs';
import { useDeleteDishGroupMutation } from '@/queries/dishes';
import { useFoodDetailQuery, type FoodSelection } from '@/queries/food-detail';
import { FoodModal } from '@/components/food-modal';
import { PageHeader } from '@/components/page-header';
import type { MealType } from '@/lib/nutrition-constants';
import { usePlanMealsForDate } from '@/queries/diet-plans';
import type { FoodLogEntry } from '@/types/food';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

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
  const [now, setNow] = useState(() => new Date());

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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [logMealsModalOpen, setLogMealsModalOpen] = useState(false);
  const [loggingMealType, setLoggingMealType] = useState<MealType | null>(null);

  // Edit modal state
  const [lastAdded, setLastAdded] = useState<{ mealType: MealType; seq: number } | null>(null);
  const [editingLog, setEditingLog] = useState<FoodLogEntry | null>(null);
  const editFoodSelection: FoodSelection | null = editingLog ? { id: editingLog.food.id } : null;
  const editDetailQuery = useFoodDetailQuery(editFoodSelection);

  // Dish modal state
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [selectedDishName, setSelectedDishName] = useState<string | undefined>();
  const [dishModalOpen, setDishModalOpen] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const mobileTitle = useMemo(() => format(selectedDate, 'EEEE, MMM d'), [selectedDate]);
  const mobileSubtitle = useMemo(() => format(selectedDate, 'MMMM d'), [selectedDate]);

  const logsQuery = useFoodLogsQuery(dateStr);
  const planMeals = usePlanMealsForDate(dateStr);
  const logFromPlanMutation = useLogFromPlanMutation();
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

  const hasLoggedAllPlannedMeals = useMemo(() => {
    const plannedMeals = Object.entries(planMeals.planMealsByMealType).filter(([, meal]) => {
      return !!meal && meal.items.length > 0;
    });

    if (plannedMeals.length === 0) {
      return false;
    }

    const logsByMeal = logsQuery.data?.logsByMeal ?? {};

    return plannedMeals.every(([mealType]) => {
      return (logsByMeal[mealType] ?? []).length > 0;
    });
  }, [logsQuery.data?.logsByMeal, planMeals.planMealsByMealType]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const shouldShowPlanBanner =
    planMeals.activePlan &&
    planMeals.hasPlanForDay &&
    !hasLoggedAllPlannedMeals &&
    now.getHours() >= 18;
  const bannerPlan = shouldShowPlanBanner ? planMeals.activePlan : null;

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

  const handleFoodAdded = (mealType: MealType) => {
    setLastAdded((prev) => ({ mealType, seq: (prev?.seq ?? 0) + 1 }));
    setModalOpen(false);
    setSelectedFood(null);
    foodSearch.setQuery('');
    setMobileSearchOpen(false);
  };

  const handleDishModalClose = () => {
    setDishModalOpen(false);
    setSelectedDishId(null);
    setSelectedDishName(undefined);
  };

  const handleDishLogged = (mealType: MealType) => {
    setLastAdded((prev) => ({ mealType, seq: (prev?.seq ?? 0) + 1 }));
    setDishModalOpen(false);
    setSelectedDishId(null);
    setSelectedDishName(undefined);
    foodSearch.setQuery('');
    setMobileSearchOpen(false);
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

  const handleLogSingleMeal = async (mealType: MealType) => {
    if (!planMeals.activePlan) return;

    setLoggingMealType(mealType);

    try {
      await logFromPlanMutation.mutateAsync({
        mode: 'add-meal',
        date: dateStr,
        planId: planMeals.activePlan.id,
        mealType,
      });
      setLastAdded((prev) => ({ mealType, seq: (prev?.seq ?? 0) + 1 }));
    } catch (error) {
      toast.error((error as Error).message ?? 'Failed to log planned meal.');
    } finally {
      setLoggingMealType(null);
    }
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
    <div className="grid min-w-0 items-start gap-6 pt-6 lg:grid-cols-12 lg:gap-8">
      <div className="order-1 min-w-0 lg:order-0 lg:col-span-8">
        <div className="space-y-6 lg:space-y-8">
          {/* Header */}
          <div>
            <div className="hidden lg:block">
              <PageHeader
                overline="Food Log"
                title="Meal Planner & Daily Intake"
                subtitle={format(selectedDate, 'EEEE, MMMM d, yyyy')}
                className="mb-0"
                data-testid="food-log-heading"
              >
                <CreatePlanButton />
                <CreateFoodButton />
              </PageHeader>
            </div>

            <div className="space-y-3 lg:hidden">
              <div className="flex flex-wrap gap-2">
                <CreatePlanButton />
                <CreateFoodButton />
              </div>
              <div>
                <h1 className="text-2xl font-headline font-extrabold tracking-tight text-foreground">
                  {mobileTitle}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {mobileSubtitle}
                </p>
              </div>
            </div>
          </div>

          {bannerPlan ? (
            <MealPlanBanner
              planName={bannerPlan.name}
              dateStr={dateStr}
              onLogAll={() => setLogMealsModalOpen(true)}
            />
          ) : null}

          {/* Weekly calendar strip */}
          <WeeklyCalendarStrip selectedDate={selectedDate} onDateChange={handleDateChange} />

          <div className="lg:hidden">
            <NutritionPulse
              date={dateStr}
              onAddFood={handleFavoriteSelect}
              onQuickAddFood={(name) => foodSearch.setQuery(name)}
              variant="mobile"
            />
          </div>

          {/* Search row (desktop only) */}
          <div className="hidden lg:block">
            <FoodSearchField
              state={foodSearch}
              onQueryChange={foodSearch.setQuery}
              onLoadMore={foodSearch.loadMore}
              onSelect={handleSelect}
              showCustomTab={true}
              placeholder="Search for foods (e.g., 'apple', 'chicken breast')"
            />
          </div>

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
            isPlanLoading={planMeals.isLoading}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onDeleteLog={handleDeleteLog}
            onDeleteDishGroup={handleDeleteDishGroup}
            onEdit={handleEditLog}
            lastAdded={lastAdded}
            planMealsByMealType={planMeals.planMealsByMealType}
            planId={planMeals.activePlan?.id}
            loggingMealType={loggingMealType}
            onLogPlanForMeal={handleLogSingleMeal}
          />
        </div>
      </div>

      {/* Nutrition Pulse — placed before meals on mobile */}
      <div className="hidden min-w-0 lg:order-0 lg:col-span-4 lg:block">
        <NutritionPulse
          date={dateStr}
          onAddFood={handleFavoriteSelect}
          onQuickAddFood={(name) => foodSearch.setQuery(name)}
          variant="desktop"
        />
      </div>

      {/* Mobile/tablet FAB */}
      <div className="lg:hidden">
        <Button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="fixed right-5 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 h-14 w-14 rounded-2xl shadow-lg"
          size="icon"
          aria-label="Search and add food"
          data-testid="mobile-add-food-fab"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile/tablet search dialog: stacked dropdown lays out in-flow so modal height fits content (no min-h shell). */}
      <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
        <DialogContent
          className={[
            'lg:hidden flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)]',
            'flex-col gap-0 overflow-hidden rounded-2xl p-0',
          ].join(' ')}
        >
          <DialogHeader className="shrink-0 border-0 px-4 pb-2 pt-4">
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search foods
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[calc(100dvh-7rem)] overflow-x-hidden overflow-y-auto px-4 pb-4 pt-2">
            <FoodSearchField
              dropdownLayout="stacked"
              className="min-w-0"
              size="small"
              state={foodSearch}
              onQueryChange={foodSearch.setQuery}
              onLoadMore={foodSearch.loadMore}
              onSelect={handleSelect}
              showCustomTab={true}
              placeholder="Search for foods (e.g., 'apple', 'chicken breast')"
            />
          </div>
        </DialogContent>
      </Dialog>

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

      {planMeals.activePlan ? (
        <LogMealsModal
          open={logMealsModalOpen}
          planName={planMeals.activePlan.name}
          date={dateStr}
          planId={planMeals.activePlan.id}
          onClose={() => setLogMealsModalOpen(false)}
          onSuccess={() => {
            setLastAdded((prev) => ({
              mealType: prev?.mealType ?? 'breakfast',
              seq: (prev?.seq ?? 0) + 1,
            }));
          }}
        />
      ) : null}
    </div>
  );
}
