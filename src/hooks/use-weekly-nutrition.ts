import { useWeeklyAnalyticsQuery } from '@/queries/analytics'

export function useWeeklyNutrition(days: number = 7) {
  const query = useWeeklyAnalyticsQuery(days)

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error?.message || null,
  }
}
