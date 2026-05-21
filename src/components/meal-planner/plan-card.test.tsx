import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PlanOptionsMenu } from './plan-card';
import type { DietPlanDTO } from '@/server/services/diet-plan.service';

const useDietPlansQuery = vi.fn();
const useUpdateDietPlanMutation = vi.fn();
const useDeleteDietPlanMutation = vi.fn();
const useDuplicateDietPlanMutation = vi.fn();

vi.mock('@/queries/diet-plans', () => ({
  useDietPlansQuery: () => useDietPlansQuery(),
  useUpdateDietPlanMutation: () => useUpdateDietPlanMutation(),
  useDeleteDietPlanMutation: () => useDeleteDietPlanMutation(),
  useDuplicateDietPlanMutation: () => useDuplicateDietPlanMutation(),
}));

vi.mock('@/hooks/use-activate-plan', () => ({
  useActivatePlan: () => ({ activate: vi.fn(), conflict: null }),
}));

const plan: DietPlanDTO = {
  id: 'plan-1',
  name: 'Test Plan',
  description: null,
  status: 'draft',
  targetCalories: 2000,
  targetProtein: 150,
  targetCarbs: 220,
  targetFat: 70,
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: null,
  avgDailyCalories: 0,
  completeness: 0,
};

describe('PlanOptionsMenu', () => {
  const duplicateMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useDietPlansQuery.mockReturnValue({ data: { plans: [plan] } });
    useUpdateDietPlanMutation.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useDeleteDietPlanMutation.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    duplicateMutateAsync.mockResolvedValue({ plan: { ...plan, id: 'plan-copy', name: 'Test Plan (Copy)' } });
    useDuplicateDietPlanMutation.mockReturnValue({ mutateAsync: duplicateMutateAsync, isPending: false });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it('shows Edit and Duplicate menu items', async () => {
    const user = userEvent.setup();
    render(<PlanOptionsMenu plan={plan} testIdPrefix="plan" />);

    await user.click(screen.getByTestId('plan-menu-trigger-plan-1'));

    expect(screen.getByTestId('plan-menu-edit-plan-1')).toBeInTheDocument();
    expect(screen.getByTestId('plan-menu-duplicate-plan-1')).toBeInTheDocument();
  });

  it('calls onEdit when Edit is selected', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<PlanOptionsMenu plan={plan} onEdit={onEdit} testIdPrefix="plan" />);

    await user.click(screen.getByTestId('plan-menu-trigger-plan-1'));
    await user.click(screen.getByTestId('plan-menu-edit-plan-1'));

    expect(onEdit).toHaveBeenCalledWith(plan);
  });

  it('duplicates plan and calls onDuplicated', async () => {
    const user = userEvent.setup();
    const onDuplicated = vi.fn();
    render(<PlanOptionsMenu plan={plan} onDuplicated={onDuplicated} testIdPrefix="plan" />);

    await user.click(screen.getByTestId('plan-menu-trigger-plan-1'));
    await user.click(screen.getByTestId('plan-menu-duplicate-plan-1'));

    await waitFor(() => {
      expect(duplicateMutateAsync).toHaveBeenCalledWith('plan-1');
      expect(onDuplicated).toHaveBeenCalledWith('plan-copy');
    });
  });
});
