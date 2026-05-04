import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FoodLogEntry } from '@/types/food'
import type { MealType } from '@/lib/nutrition-constants'

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
    saturatedFat: number
    polyunsaturatedFat: number
    monounsaturatedFat: number
    cholesterol: number
    potassium: number
    vitaminA: number
    vitaminC: number
    calcium: number
    iron: number
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
          saturatedFat: 0,
          polyunsaturatedFat: 0,
          monounsaturatedFat: 0,
          cholesterol: 0,
          potassium: 0,
          vitaminA: 0,
          vitaminC: 0,
          calcium: 0,
          iron: 0,
        },
      }
    },
  })
}

interface CreateFoodLogData {
  foodId: string
  altMeasureId?: string | null
  quantity: string
  mealType: string
  consumedAt?: string
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
      // Invalidate nutrition summary so sidebar updates
      queryClient.invalidateQueries({ queryKey: ['nutrition-summary'] })
    },
  })
}

interface UpdateFoodLogData {
  logId: string
  altMeasureId?: string | null
  quantity?: number
  mealType?: string
  consumedAt?: string
}

export function useUpdateFoodLogMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ logId, ...data }: UpdateFoodLogData): Promise<void> => {
      const response = await fetch(`/api/food-logs/${logId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update food log')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-logs'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      queryClient.invalidateQueries({ queryKey: ['nutrition-summary'] })
    },
  })
}

export function useDeleteFoodLogMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (logId: string): Promise<void> => {
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
      // Invalidate nutrition summary so sidebar updates
      queryClient.invalidateQueries({ queryKey: ['nutrition-summary'] })
    },
  })
}

type LogFromPlanRequest =
  | { mode: 'replace-all'; date: string; planId: string }
  | { mode: 'add-all'; date: string; planId: string }
  | { mode: 'add-meal'; date: string; planId: string; mealType: MealType }

interface LogFromPlanResponse {
  success: boolean
  insertedCount: number
  mergedCount: number
  deletedCount: number
}

export function useLogFromPlanMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: LogFromPlanRequest): Promise<LogFromPlanResponse> => {
      const response = await fetch('/api/food-logs/from-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to log meals from plan')
      }

      return payload
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-logs'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      queryClient.invalidateQueries({ queryKey: ['nutrition-summary'] })
    },
  })
}