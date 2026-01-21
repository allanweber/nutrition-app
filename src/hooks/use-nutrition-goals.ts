import { NutritionGoals } from '@/types/food';
import { useEffect, useState } from 'react';

export function useNutritionGoals() {
  const [data, setData] = useState<NutritionGoals | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGoals() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/goals');

        if (!response.ok) {
          throw new Error('Failed to fetch goals');
        }

        const result = await response.json();
        setData(result.goals);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchGoals();
  }, []);

  const updateGoals = async (goals: NutritionGoals) => {
    try {
      setError(null);

      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goals }),
      });

      if (!response.ok) {
        throw new Error('Failed to update goals');
      }

      const result = await response.json();
      setData(result.goals);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  return { data, isLoading, error, updateGoals };
}
