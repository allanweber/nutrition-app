import { useDailyAnalyticsQuery } from '@/queries/analytics'

export function useDailyNutrition(date?: string) {
  const query = useDailyAnalyticsQuery(date)

  return {
    data: query.data?.summary || null,
    logs: query.data?.logs || [],
    isLoading: query.isLoading,
    error: query.error?.message || null,
  }
}
