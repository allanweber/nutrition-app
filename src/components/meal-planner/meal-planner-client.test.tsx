import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { MealPlannerClient } from './meal-planner-client';

vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({ replace: vi.fn() }),
    useSearchParams: () => new URLSearchParams(''),
  };
});

const useDietPlansQuery = vi.fn();
const useDietPlanMealsQuery = vi.fn();
const useDeleteMealMutation = vi.fn();
const useCreateDietPlanMutation = vi.fn();
const useUpdateDietPlanMutation = vi.fn();
const useDeleteDietPlanMutation = vi.fn();
const useDuplicateDietPlanMutation = vi.fn();
const useActivateDietPlanMutation = vi.fn();
const useCopyDayMutation = vi.fn();

vi.mock('@/queries/diet-plans', () => ({
  useDietPlansQuery: () => useDietPlansQuery(),
  useDietPlanMealsQuery: (planId: string | null) => useDietPlanMealsQuery(planId),
  useDeleteMealMutation: () => useDeleteMealMutation(),
  useCreateDietPlanMutation: () => useCreateDietPlanMutation(),
  useUpdateDietPlanMutation: () => useUpdateDietPlanMutation(),
  useDeleteDietPlanMutation: () => useDeleteDietPlanMutation(),
  useDuplicateDietPlanMutation: () => useDuplicateDietPlanMutation(),
  useActivateDietPlanMutation: () => useActivateDietPlanMutation(),
  useCopyDayMutation: () => useCopyDayMutation(),
}));

describe('MealPlannerClient', () => {
  beforeEach(() => {
    useDeleteMealMutation.mockReturnValue({ mutateAsync: vi.fn() });
    useDietPlanMealsQuery.mockReturnValue({ data: { meals: [] }, isLoading: false });
    useCreateDietPlanMutation.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useUpdateDietPlanMutation.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useDeleteDietPlanMutation.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useActivateDietPlanMutation.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useCopyDayMutation.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useDuplicateDietPlanMutation.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  });

  it('renders empty state when there are no plans', () => {
    useDietPlansQuery.mockReturnValue({ data: { plans: [], nutritionGoalDefaults: null }, isLoading: false });

    render(<MealPlannerClient initialPlanId={null} initialDay={1} />);

    expect(screen.getByTestId('meal-planner-heading')).toBeInTheDocument();
    expect(screen.getByTestId('meal-planner-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('day-selector')).not.toBeInTheDocument();
    expect(screen.queryByTestId('day-meals-view')).not.toBeInTheDocument();
  });

  it('renders day selector and meals view when a plan is selected', () => {
    useDietPlansQuery.mockReturnValue({
      data: { plans: [{ id: 'plan-1', status: 'active' }], nutritionGoalDefaults: null },
      isLoading: false,
    });

    render(<MealPlannerClient initialPlanId="plan-1" initialDay={2} />);

    expect(screen.queryByTestId('meal-planner-empty-state')).not.toBeInTheDocument();
    expect(screen.getByTestId('day-selector')).toBeInTheDocument();
    expect(screen.getByTestId('day-meals-view')).toBeInTheDocument();
  });

  it('exposes plan edit menu trigger when plans exist', () => {
    useDietPlansQuery.mockReturnValue({
      data: {
        plans: [{
          id: 'plan-1',
          name: 'My Plan',
          status: 'draft',
          description: null,
          targetCalories: 2000,
          targetProtein: 150,
          targetCarbs: 220,
          targetFat: 70,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: null,
          avgDailyCalories: 0,
          completeness: 0,
        }],
        nutritionGoalDefaults: null,
      },
      isLoading: false,
    });

    render(<MealPlannerClient initialPlanId="plan-1" initialDay={1} />);

    expect(screen.getByTestId('mobile-plan-menu-trigger-plan-1')).toBeInTheDocument();
  });
});

