import { useQuery } from '@tanstack/react-query';
import type {
  FoodSearchResultItem,
  SearchPagination,
} from '@/server/services/food-search.service';

export type { FoodSearchResultItem, SearchPagination };

interface FoodSearchResponse {
  results: FoodSearchResultItem[];
  pagination: SearchPagination;
}

export function useFoodSearchQuery(keyword: string, page = 1) {
  return useQuery({
    queryKey: ['foods', 'search', keyword, page],
    queryFn: async (): Promise<FoodSearchResponse> => {
      const response = await fetch(
        `/api/foods/search?q=${encodeURIComponent(keyword)}&page=${page}`,
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to search foods');
      }
      return response.json();
    },
    enabled: keyword.length >= 3,
  });
}
