import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DishDetail, DishListItem } from '@/types/dish';

const DISHES_KEY = ['dishes'] as const;
const DISH_KEY = (id: string) => ['dishes', id] as const;

// List
export function useDishesQuery() {
  return useQuery({
    queryKey: DISHES_KEY,
    queryFn: async (): Promise<{ dishes: DishListItem[] }> => {
      const res = await fetch('/api/dishes');
      if (!res.ok) throw new Error('Failed to fetch dishes');
      return res.json();
    },
  });
}

// Detail
export function useDishDetailQuery(dishId: string | null) {
  return useQuery({
    queryKey: DISH_KEY(dishId ?? ''),
    queryFn: async (): Promise<{ dish: DishDetail }> => {
      const res = await fetch(`/api/dishes/${dishId}`);
      if (!res.ok) throw new Error('Failed to fetch dish');
      return res.json();
    },
    enabled: dishId != null,
  });
}

// Create
export function useCreateDishMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string | null;
      ingredients: Array<{ foodId: string; altMeasureId?: string | null; quantity: number; seq?: number }>;
    }) => {
      const res = await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create dish');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DISHES_KEY }),
  });
}

// Update
export function useUpdateDishMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dishId,
      ...data
    }: {
      dishId: string;
      name?: string;
      description?: string | null;
      ingredients?: Array<{ foodId: string; altMeasureId?: string | null; quantity: number; seq?: number }>;
    }) => {
      const res = await fetch(`/api/dishes/${dishId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update dish');
      }
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: DISHES_KEY });
      qc.invalidateQueries({ queryKey: DISH_KEY(vars.dishId) });
    },
  });
}

// Delete
export function useDeleteDishMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dishId: string) => {
      const res = await fetch(`/api/dishes/${dishId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete dish');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: DISHES_KEY }),
  });
}

// Log a dish
export function useLogDishMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      dishId: string;
      multiplier: number;
      mealType: string;
      consumedAt?: string;
    }) => {
      const res = await fetch('/api/food-logs/dish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to log dish');
      }
      return res.json() as Promise<{ success: boolean; dishLogGroupId: string; itemCount: number }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food-logs'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['nutrition-summary'] });
    },
  });
}

// Delete an entire dish log group
export function useDeleteDishGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dishLogGroupId: string) => {
      const res = await fetch(`/api/food-logs/dish-group/${dishLogGroupId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete dish group');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food-logs'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['nutrition-summary'] });
    },
  });
}
