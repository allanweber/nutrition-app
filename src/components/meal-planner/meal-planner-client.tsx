'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { useDietPlansQuery, useDietPlanMealsQuery } from '@/queries/diet-plans';
import { PlanCarousel } from './plan-carousel';
import { DaySelector } from './day-selector';
import { DayMealsView } from './day-meals-view';
import { NewPlanModal } from './new-plan-modal';
import { MealModal, type MealModalState } from './meal-modal';
import type { DietPlanDTO, DietPlanMealDTO } from '@/server/services/diet-plan.service';

interface MealPlannerClientProps {
  initialPlanId: string | null;
  initialDay: number;
}

export function MealPlannerClient({ initialPlanId, initialDay }: MealPlannerClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initialPlanId);
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [newPlanModalOpen, setNewPlanModalOpen] = useState(false);
  const [mealModalState, setMealModalState] = useState<MealModalState | null>(null);
  const hasAutoSelected = useRef(false);

  const plansQuery = useDietPlansQuery();
  const mealsQuery = useDietPlanMealsQuery(selectedPlanId);

  const plans: DietPlanDTO[] = plansQuery.data?.plans ?? [];
  const meals: DietPlanMealDTO[] = mealsQuery.data?.meals ?? [];

  // Auto-select the active plan on first load
  useEffect(() => {
    if (hasAutoSelected.current || !plansQuery.data) return;
    if (selectedPlanId) {
      hasAutoSelected.current = true;
      return;
    }
    const activePlan = plansQuery.data.plans.find((p) => p.status === 'active');
    if (activePlan) {
      hasAutoSelected.current = true;
      handleSelectPlan(activePlan.id);
    } else {
      hasAutoSelected.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plansQuery.data]);

  function updateUrl(planId: string | null, day: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (planId) params.set('planId', planId);
    else params.delete('planId');
    params.set('day', day.toString());
    router.replace(`/meal-planner?${params.toString()}`, { scroll: false });
  }

  function handleSelectPlan(planId: string) {
    setSelectedPlanId(planId);
    updateUrl(planId, selectedDay);
  }

  function handlePlanDeleted(deletedPlanId: string) {
    if (selectedPlanId !== deletedPlanId) return;
    const remaining = plans.filter((p) => p.id !== deletedPlanId);
    const next = remaining.find((p) => p.status === 'active') ?? remaining[0] ?? null;
    if (next) {
      handleSelectPlan(next.id);
    } else {
      setSelectedPlanId(null);
      updateUrl(null, selectedDay);
    }
  }

  function handleSelectDay(day: number) {
    setSelectedDay(day);
    updateUrl(selectedPlanId, day);
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
      <PageHeader
        overline="Planning"
        title="Meal Planner"
        subtitle="Plan your meals for the week ahead"
      />

      {/* Plan Carousel */}
      <PlanCarousel
        plans={plans}
        isLoading={plansQuery.isLoading}
        selectedPlanId={selectedPlanId}
        onSelectPlan={handleSelectPlan}
        onAddNew={() => setNewPlanModalOpen(true)}
        onPlanDeleted={handlePlanDeleted}
      />

      {/* Empty state if no plans */}
      {!plansQuery.isLoading && plans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h2 className="text-xl font-bold text-foreground">No meal plans yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Build weekly meal plans, track nutritional targets, and stay consistent with your diet goals.
          </p>
        </div>
      )}

      {/* Day + Meals section only when a plan is selected */}
      {selectedPlan && (
        <>
          <p className="text-xl font-bold mb-3">{selectedPlan.name}</p>
          <DaySelector
            plan={selectedPlan}
            meals={meals}
            selectedDay={selectedDay}
            onSelectDay={handleSelectDay}
          />

          <DayMealsView
            plan={selectedPlan}
            meals={meals}
            selectedDay={selectedDay}
            isLoading={mealsQuery.isLoading}
            onAddMeal={(day) =>
              setMealModalState({ mode: 'create', planId: selectedPlan.id, day })
            }
            onEditMeal={(meal) =>
              setMealModalState({ mode: 'edit', planId: selectedPlan.id, meal })
            }
          />
        </>
      )}

      {/* Modals */}
      <NewPlanModal
        open={newPlanModalOpen}
        plans={plans}
        nutritionGoalDefaults={plansQuery.data?.nutritionGoalDefaults ?? null}
        onClose={() => setNewPlanModalOpen(false)}
        onCreated={(planId) => {
          setNewPlanModalOpen(false);
          handleSelectPlan(planId);
        }}
      />

      {mealModalState && (
        <MealModal
          state={mealModalState}
          onClose={() => setMealModalState(null)}
        />
      )}
    </div>
  );
}
