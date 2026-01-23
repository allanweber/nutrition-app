import type { NutritionGoals } from '@/types/goals';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const GOALS_QUERY_KEY = ['goals'];

export function useGoalsQuery() {
  return useQuery({
    queryKey: GOALS_QUERY_KEY,
    queryFn: async (): Promise<NutritionGoals> => {
      const response = await fetch('/api/goals');
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      const result = await response.json();
      return result.goals;
    },
  });
}

export function useUpdateGoalsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goals: NutritionGoals): Promise<NutritionGoals> => {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goals }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update goals');
      }

      const result = await response.json();
      return result.goals;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(GOALS_QUERY_KEY, data);
    },
  });
}
