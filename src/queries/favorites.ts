import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FavoriteItem } from '@/types/favorites';

const FAVORITES_KEY = ['favorites'] as const;
const FAVORITES_TOP_KEY = ['favorites', 'top'] as const;
const FAVORITES_IDS_KEY = ['favorites', 'ids'] as const;

interface FavoritesIdsResponse {
  foodIds: string[];
  dishIds: string[];
}

export function useFavoritesQuery() {
  return useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: async (): Promise<{ favorites: FavoriteItem[] }> => {
      const res = await fetch('/api/favorites');
      if (!res.ok) throw new Error('Failed to fetch favorites');
      return res.json();
    },
  });
}

export function useFavoritesTopQuery() {
  return useQuery({
    queryKey: FAVORITES_TOP_KEY,
    queryFn: async (): Promise<{ favorites: FavoriteItem[] }> => {
      const res = await fetch('/api/favorites/top');
      if (!res.ok) throw new Error('Failed to fetch top favorites');
      return res.json();
    },
  });
}

export function useFavoriteIdsQuery() {
  return useQuery({
    queryKey: FAVORITES_IDS_KEY,
    queryFn: async (): Promise<FavoritesIdsResponse> => {
      const res = await fetch('/api/favorites/ids');
      if (!res.ok) throw new Error('Failed to fetch favorite IDs');
      return res.json();
    },
  });
}

export function useToggleFavoriteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      foodId,
      dishId,
      favoriteId,
      action,
    }: {
      foodId?: string;
      dishId?: string;
      favoriteId?: string;
      action: 'add' | 'remove';
    }) => {
      if (action === 'add') {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foodId, dishId }),
        });
        if (!res.ok) throw new Error('Failed to add favorite');
        return res.json();
      } else {
        if (!favoriteId) throw new Error('favoriteId required for remove');
        const res = await fetch(`/api/favorites/${favoriteId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to remove favorite');
        return res.json();
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FAVORITES_KEY });
      qc.invalidateQueries({ queryKey: FAVORITES_TOP_KEY });
      qc.invalidateQueries({ queryKey: FAVORITES_IDS_KEY });
    },
  });
}

export function useDeleteFavoriteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (favoriteId: string) => {
      const res = await fetch(`/api/favorites/${favoriteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove favorite');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FAVORITES_KEY });
      qc.invalidateQueries({ queryKey: FAVORITES_TOP_KEY });
      qc.invalidateQueries({ queryKey: FAVORITES_IDS_KEY });
    },
  });
}
