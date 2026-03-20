import { useQuery } from '@tanstack/react-query';

interface CustomFoodSearchResult {
  id: number;
  name: string;
  brandName: string | null;
  thumbnail: string | null;
  calories: number | null;
}

interface CustomFoodSearchResponse {
  results: CustomFoodSearchResult[];
}

export function useCustomFoodSearchQuery(query: string, enabled = true) {
  return useQuery({
    queryKey: ['foods', 'custom', 'search', query],
    queryFn: async (): Promise<CustomFoodSearchResponse> => {
      const response = await fetch(
        `/api/foods/custom/search?q=${encodeURIComponent(query)}`,
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to search custom foods');
      }
      return response.json();
    },
    enabled: enabled && query.length >= 3,
  });
}
