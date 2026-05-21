import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NewPlanModal } from './new-plan-modal';
import type { DietPlanDTO } from '@/server/services/diet-plan.service';

const useCreateDietPlanMutation = vi.fn();
const useUpdateDietPlanMutation = vi.fn();
const activate = vi.fn();

vi.mock('@/queries/diet-plans', () => ({
  useCreateDietPlanMutation: () => useCreateDietPlanMutation(),
  useUpdateDietPlanMutation: () => useUpdateDietPlanMutation(),
}));

vi.mock('@/hooks/use-activate-plan', () => ({
  useActivatePlan: () => ({ activate, conflict: null }),
}));

const editingPlan: DietPlanDTO = {
  id: 'plan-edit-1',
  name: 'Existing Plan',
  description: 'Desc',
  status: 'draft',
  targetCalories: 2100,
  targetProtein: 160,
  targetCarbs: 200,
  targetFat: 65,
  startDate: '2024-01-15T00:00:00.000Z',
  endDate: null,
  avgDailyCalories: 0,
  completeness: 0,
};

describe('NewPlanModal', () => {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  const createMutateAsync = vi.fn();
  const updateMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    createMutateAsync.mockResolvedValue({ plan: { id: 'new-plan-id' } });
    updateMutateAsync.mockResolvedValue({});
    useCreateDietPlanMutation.mockReturnValue({ mutateAsync: createMutateAsync, isPending: false });
    useUpdateDietPlanMutation.mockReturnValue({ mutateAsync: updateMutateAsync, isPending: false });
    activate.mockImplementation(async ({ onProceed }: { onProceed: () => Promise<void> }) => {
      await onProceed();
    });
  });

  it('shows create title and submits create mutation', async () => {
    const user = userEvent.setup();
    render(
      <NewPlanModal
        open
        mode="create"
        plans={[]}
        nutritionGoalDefaults={{ targetCalories: 2000, targetProtein: 150, targetCarbs: 220, targetFat: 70 }}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );

    expect(screen.getByText('Create New Diet Plan')).toBeInTheDocument();

    await user.type(screen.getByTestId('plan-name-input'), 'New Plan');
    await user.click(screen.getByTestId('new-plan-submit'));

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalled();
      expect(onSaved).toHaveBeenCalledWith('new-plan-id');
    });
  });

  it('shows edit title with prefilled name and submits update mutation', async () => {
    const user = userEvent.setup();
    render(
      <NewPlanModal
        open
        mode="edit"
        editingPlan={editingPlan}
        plans={[editingPlan]}
        nutritionGoalDefaults={null}
        onClose={onClose}
        onSaved={onSaved}
      />,
    );

    expect(screen.getByText('Edit Diet Plan')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('plan-name-input')).toHaveValue('Existing Plan');
    });

    await user.clear(screen.getByTestId('plan-name-input'));
    await user.type(screen.getByTestId('plan-name-input'), 'Updated Plan');
    await user.click(screen.getByTestId('edit-plan-submit'));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: 'plan-edit-1',
          name: 'Updated Plan',
        }),
      );
      expect(onSaved).toHaveBeenCalledWith('plan-edit-1');
    });
  });
});
