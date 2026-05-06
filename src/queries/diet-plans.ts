import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MEAL_TYPE_ORDER, type MealType } from '@/lib/nutrition-constants'
import type { DietPlanDTO, DietPlanMealDTO, MealItemDTO, NutritionGoalDefaults } from '@/server/services/diet-plan.service'

// ============================================
// QUERY KEYS
// ============================================

export const dietPlanKeys = {
  all: ['diet-plans'] as const,
  meals: (planId: string) => ['diet-plans', planId, 'meals'] as const,
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface DietPlansResponse {
  plans: DietPlanDTO[]
  nutritionGoalDefaults: NutritionGoalDefaults
}

export interface DietPlanMealsResponse {
  meals: DietPlanMealDTO[]
}

function getDbDayOfWeek(dateStr: string) {
  const jsDay = new Date(`${dateStr}T12:00:00.000Z`).getUTCDay()
  return jsDay === 0 ? 7 : jsDay
}

function isMealType(value: string): value is MealType {
  return (MEAL_TYPE_ORDER as readonly string[]).includes(value)
}

// ============================================
// QUERIES
// ============================================

export function useDietPlansQuery() {
  return useQuery({
    queryKey: dietPlanKeys.all,
    queryFn: async (): Promise<DietPlansResponse> => {
      const res = await fetch('/api/diet-plans')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch diet plans')
      }
      return res.json()
    },
  })
}

export function useDietPlanMealsQuery(planId: string | null) {
  return useQuery({
    queryKey: planId ? dietPlanKeys.meals(planId) : ['diet-plans-meals-disabled'],
    enabled: !!planId,
    queryFn: async (): Promise<DietPlanMealsResponse> => {
      const res = await fetch(`/api/diet-plans/${planId}/meals`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch meals')
      }
      return res.json()
    },
  })
}

export function usePlanMealsForDate(dateStr: string) {
  const plansQuery = useDietPlansQuery()

  const activePlan = useMemo(
    () => plansQuery.data?.plans.find((plan) => plan.status === 'active') ?? null,
    [plansQuery.data?.plans],
  )

  const mealsQuery = useDietPlanMealsQuery(activePlan?.id ?? null)

  const planMealsByMealType = useMemo<Partial<Record<MealType, DietPlanMealDTO>>>(() => {
    if (!mealsQuery.data?.meals?.length) return {}

    const dayOfWeek = getDbDayOfWeek(dateStr)
    const entries = mealsQuery.data.meals
      .filter((meal) => meal.dayOfWeek === dayOfWeek && isMealType(meal.mealType))
      .map((meal) => [meal.mealType, meal] as const)

    return Object.fromEntries(entries) as Partial<Record<MealType, DietPlanMealDTO>>
  }, [dateStr, mealsQuery.data?.meals])

  return {
    activePlan,
    planMealsByMealType,
    hasPlanForDay: Object.keys(planMealsByMealType).length > 0,
    isLoading: plansQuery.isLoading || (!!activePlan && mealsQuery.isLoading),
  }
}

// ============================================
// MUTATIONS — Plan
// ============================================

export function useCreateDietPlanMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      name: string
      description?: string
      targetCalories: number
      targetProtein: number
      targetCarbs: number
      targetFat: number
      startDate: string
      endDate?: string | null
      status: 'active' | 'draft' | 'archived'
    }): Promise<{ plan: DietPlanDTO }> => {
      const res = await fetch('/api/diet-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create plan')
      }
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: dietPlanKeys.all }),
  })
}

export function useUpdateDietPlanMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ planId, ...body }: {
      planId: string
      name?: string
      description?: string | null
      targetCalories?: number
      targetProtein?: number
      targetCarbs?: number
      targetFat?: number
      startDate?: string
      endDate?: string | null
      status?: 'active' | 'draft' | 'archived'
    }) => {
      const res = await fetch(`/api/diet-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update plan')
      }
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: dietPlanKeys.all }),
  })
}

export function useDeleteDietPlanMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (planId: string) => {
      const res = await fetch(`/api/diet-plans/${planId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete plan')
      }
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: dietPlanKeys.all }),
  })
}

// ============================================
// MUTATIONS — Meals
// ============================================

export function useCreateMealMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      planId: string
      mealType: string
      dayOfWeek: number
    }): Promise<{ meal: DietPlanMealDTO }> => {
      const { planId, ...rest } = body
      const res = await fetch(`/api/diet-plans/${planId}/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create meal')
      }
      return res.json()
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: dietPlanKeys.all, exact: true })
      qc.invalidateQueries({ queryKey: dietPlanKeys.meals(vars.planId) })
    },
  })
}

export function useUpdateMealMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ planId, mealId, ...body }: {
      planId: string
      mealId: string
      mealType?: string
      dayOfWeek?: number
    }) => {
      const res = await fetch(`/api/diet-plans/${planId}/meals/${mealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update meal')
      }
      return res.json()
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: dietPlanKeys.meals(vars.planId) }),
  })
}

export function useDeleteMealMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ planId, mealId }: { planId: string; mealId: string }) => {
      const res = await fetch(`/api/diet-plans/${planId}/meals/${mealId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete meal')
      }
      return res.json()
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: dietPlanKeys.all, exact: true })
      qc.invalidateQueries({ queryKey: dietPlanKeys.meals(vars.planId) })
    },
  })
}

// ============================================
// MUTATIONS — Meal Items
// ============================================

export function useAddMealItemMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      planId: string
      mealId: string
      foodId: string
      altMeasureId?: string | null
      quantity: number
    }): Promise<{ item: MealItemDTO }> => {
      const { planId, mealId, ...rest } = body
      const res = await fetch(`/api/diet-plans/${planId}/meals/${mealId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add item')
      }
      return res.json()
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: dietPlanKeys.all, exact: true })
      qc.invalidateQueries({ queryKey: dietPlanKeys.meals(vars.planId) })
    },
  })
}

export function useUpdateMealItemMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ planId, mealId, itemId, ...body }: {
      planId: string
      mealId: string
      itemId: string
      quantity?: number
      altMeasureId?: string | null
    }) => {
      const res = await fetch(`/api/diet-plans/${planId}/meals/${mealId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update item')
      }
      return res.json()
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: dietPlanKeys.meals(vars.planId) }),
  })
}

export function useDeleteMealItemMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ planId, mealId, itemId }: {
      planId: string
      mealId: string
      itemId: string
    }) => {
      const res = await fetch(`/api/diet-plans/${planId}/meals/${mealId}/items/${itemId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete item')
      }
      return res.json()
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: dietPlanKeys.all, exact: true })
      qc.invalidateQueries({ queryKey: dietPlanKeys.meals(vars.planId) })
    },
  })
}

export function useAddDishToMealMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ planId, mealId, dishId, multiplier = 1 }: {
      planId: string
      mealId: string
      dishId: string
      multiplier?: number
    }) => {
      const res = await fetch(`/api/diet-plans/${planId}/meals/${mealId}/dish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishId, multiplier }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add dish')
      }
      return res.json() as Promise<{ success: boolean; dishGroupId: string; itemCount: number }>
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: dietPlanKeys.all, exact: true })
      qc.invalidateQueries({ queryKey: dietPlanKeys.meals(vars.planId) })
    },
  })
}

export function useDeleteDishGroupFromMealMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ planId, mealId, dishGroupId }: {
      planId: string
      mealId: string
      dishGroupId: string
    }) => {
      const res = await fetch(`/api/diet-plans/${planId}/meals/${mealId}/dish-group/${dishGroupId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete dish group')
      }
      return res.json()
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: dietPlanKeys.all, exact: true })
      qc.invalidateQueries({ queryKey: dietPlanKeys.meals(vars.planId) })
    },
  })
}

export function useCopyMealMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ planId, mealId, toMealType }: {
      planId: string
      mealId: string
      toMealType: string
    }): Promise<{ meals: DietPlanMealDTO[] }> => {
      const res = await fetch(`/api/diet-plans/${planId}/meals/${mealId}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toMealType }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to copy meal')
      }
      return res.json()
    },
    onSuccess: (data, vars) => {
      qc.setQueryData(dietPlanKeys.meals(vars.planId), data)
      qc.invalidateQueries({ queryKey: dietPlanKeys.all, exact: true })
      qc.invalidateQueries({ queryKey: dietPlanKeys.meals(vars.planId) })
    },
  })
}

export function useCopyDayMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ planId, fromDay, toDay }: {
      planId: string
      fromDay: number
      toDay: number
    }): Promise<{ meals: DietPlanMealDTO[] }> => {
      const res = await fetch(`/api/diet-plans/${planId}/copy-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromDay, toDay }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to copy day')
      }
      return res.json()
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: dietPlanKeys.all, exact: true })
      qc.invalidateQueries({ queryKey: dietPlanKeys.meals(vars.planId) })
    },
  })
}
