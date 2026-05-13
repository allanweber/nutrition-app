import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { HYDRATION_LOG_INCREMENT_ML } from '@/lib/nutrition-constants';
import type { HydrationLogDTO } from '@/server/services/dashboard.service';

export const hydrationQueryKey = (date: string) => ['hydration', date] as const;

function bumpHydrationOptimistic(current: HydrationLogDTO): HydrationLogDTO {
  const totalMl = current.totalMl + HYDRATION_LOG_INCREMENT_ML;
  const { goalMl } = current;
  const pct = goalMl > 0 ? (totalMl / goalMl) * 100 : 0;
  return {
    ...current,
    totalMl,
    totalLiters: Math.round((totalMl / 1000) * 10) / 10,
    percentConsumed: Math.min(Math.round(pct), 100),
  };
}

async function fetchHydrationLog(date: string): Promise<HydrationLogDTO> {
  const response = await fetch(
    `/api/dashboard/hydration?date=${encodeURIComponent(date)}`,
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error || 'Failed to fetch hydration log');
  }
  const data = (await response.json()) as { hydration: HydrationLogDTO };
  return data.hydration;
}

async function postAddWater(date: string): Promise<HydrationLogDTO> {
  const response = await fetch(
    `/api/dashboard/hydration/add?date=${encodeURIComponent(date)}`,
    { method: 'POST' },
  );
  const body = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
    hydration?: HydrationLogDTO;
  };
  if (!response.ok || !body.success || !body.hydration) {
    throw new Error(body.error || 'Failed to add water');
  }
  return body.hydration;
}

export function useHydrationLogQuery(date: string, initialData: HydrationLogDTO) {
  return useQuery({
    queryKey: hydrationQueryKey(date),
    queryFn: () => fetchHydrationLog(date),
    initialData,
    staleTime: 60_000,
  });
}

export function useAddWaterMutation(date: string) {
  const queryClient = useQueryClient();
  const key = hydrationQueryKey(date);

  return useMutation({
    mutationFn: () => postAddWater(date),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<HydrationLogDTO>(key);
      if (previous) {
        queryClient.setQueryData(key, bumpHydrationOptimistic(previous));
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      toast.error('Could not log hydration', {
        description: error instanceof Error ? error.message : undefined,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
    },
  });
}
