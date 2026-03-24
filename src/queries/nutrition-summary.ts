import { useQuery } from '@tanstack/react-query';
import type { DailySummaryDTO } from '@/server/services/dashboard.service';

export const NUTRITION_SUMMARY_QUERY_KEY = (date: string) => ['nutrition-summary', date];

export function useNutritionSummaryQuery(date: string) {
  return useQuery({
    queryKey: NUTRITION_SUMMARY_QUERY_KEY(date),
    queryFn: async (): Promise<DailySummaryDTO> => {
      const response = await fetch(`/api/nutrition-summary?date=${encodeURIComponent(date)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch nutrition summary');
      }
      return response.json();
    },
  });
}
