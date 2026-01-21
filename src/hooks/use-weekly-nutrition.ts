import { DailyNutritionSummary } from '@/types/food';
import { useEffect, useState } from 'react';

export function useWeeklyNutrition(days: number = 7) {
  const [data, setData] = useState<DailyNutritionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/analytics/weekly?days=${days}`);

        if (!response.ok) {
          throw new Error('Failed to fetch weekly nutrition');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [days]);

  return { data, isLoading, error };
}
