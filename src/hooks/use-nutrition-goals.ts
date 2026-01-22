import { useGoalsQuery, useUpdateGoalsMutation } from '@/queries/goals'
import { NutritionGoals } from '@/types/food'

export function useNutritionGoals() {
  const query = useGoalsQuery()
  const mutation = useUpdateGoalsMutation()

  const updateGoals = async (goals: NutritionGoals) => {
    try {
      await mutation.mutateAsync(goals)
      return true
    } catch (error) {
      return false
    }
  }

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    updateGoals,
  }
}
