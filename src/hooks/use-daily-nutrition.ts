import { useState, useEffect } from 'react';
import { DailyNutritionSummary } from '@/types/nutritionix';

export function useDailyNutrition(date?: string) {
  const [data, setData] = useState<DailyNutritionSummary | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        const targetDate = date || new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/analytics/daily?date=${targetDate}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch daily nutrition');
        }
        
        const result = await response.json();
        setData(result.summary);
        setLogs(result.logs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [date]);

  return { data, logs, isLoading, error };
}