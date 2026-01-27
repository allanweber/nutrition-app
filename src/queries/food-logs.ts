import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FoodLogEntry } from '@/types/food'

interface FoodLogsResponse {
  logs: FoodLogEntry[]
  logsByMeal: Record<string, FoodLogEntry[]>
  totals: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sugar: number
    sodium: number
  }
}

const FOOD_LOGS_QUERY_KEY = (date: string) => ['food-logs', date]

export function useFoodLogsQuery(date: string) {
  return useQuery({
    queryKey: FOOD_LOGS_QUERY_KEY(date),
    queryFn: async (): Promise<FoodLogsResponse> => {
      const response = await fetch(`/api/food-logs?date=${encodeURIComponent(date)}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch food logs')
      }
      const data = await response.json()
      return {
        logs: data.logs || [],
        logsByMeal: data.logsByMeal || {},
        totals: data.totals || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
        },
      }
    },
  })
}

interface CreateFoodLogData {
    foodId?: number
  foodName: string
  brandName?: string
  quantity: string
  servingUnit: string
  mealType: string
}

export function useCreateFoodLogMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateFoodLogData): Promise<void> => {
      const response = await fetch('/api/food-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add food')
      }
    },
    onSuccess: () => {
      // Invalidate food logs queries for today and potentially other dates
      queryClient.invalidateQueries({ queryKey: ['food-logs'] })
      // Also invalidate analytics since they depend on logs
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useDeleteFoodLogMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (logId: number): Promise<void> => {
      const response = await fetch(`/api/food-logs/${logId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete food log')
      }
    },
    onSuccess: () => {
      // Invalidate food logs queries
      queryClient.invalidateQueries({ queryKey: ['food-logs'] })
      // Also invalidate analytics
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}