import { useGoalsQuery, useUpdateGoalsMutation } from '@/queries/goals';
import type { NutritionGoals } from '@/types/goals';

export function useNutritionGoals() {
  const query = useGoalsQuery();
  const mutation = useUpdateGoalsMutation();

  const updateGoals = async (goals: NutritionGoals) => {
    try {
      await mutation.mutateAsync(goals);
      return { success: true, error: null };
    } catch (error) {
      // Parse the API error message
      let errorMessage = 'Failed to save goals';
      if (error instanceof Error) {
        // Try to extract the error message from the API response
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If not JSON, use the error message as-is
          errorMessage = error.message;
        }
      }
      return { success: false, error: errorMessage };
    }
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    updateGoals,
  };
}
