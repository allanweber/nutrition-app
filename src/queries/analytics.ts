import { useQuery } from '@tanstack/react-query'
import { DailyNutritionSummary, FoodLogEntry } from '@/types/food'

const DAILY_ANALYTICS_QUERY_KEY = (date: string) => ['analytics', 'daily', date]
const WEEKLY_ANALYTICS_QUERY_KEY = (days: number) => ['analytics', 'weekly', days]

export function useDailyAnalyticsQuery(date?: string) {
  const targetDate = date || new Date().toISOString().split('T')[0]

  return useQuery({
    queryKey: DAILY_ANALYTICS_QUERY_KEY(targetDate),
    queryFn: async (): Promise<{ summary: DailyNutritionSummary; logs: FoodLogEntry[] }> => {
      const response = await fetch(`/api/analytics/daily?date=${targetDate}`)
      if (!response.ok) {
        throw new Error('Failed to fetch daily nutrition')
      }
      const result = await response.json()
      return { summary: result.summary, logs: result.logs }
    },
  })
}

export function useWeeklyAnalyticsQuery(days: number = 7) {
  return useQuery({
    queryKey: WEEKLY_ANALYTICS_QUERY_KEY(days),
    queryFn: async (): Promise<DailyNutritionSummary[]> => {
      const response = await fetch(`/api/analytics/weekly?days=${days}`)
      if (!response.ok) {
        throw new Error('Failed to fetch weekly nutrition')
      }
      const result = await response.json()
      return result.data
    },
  })
}