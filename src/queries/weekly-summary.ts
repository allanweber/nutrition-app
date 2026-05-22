import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { WeeklySummaryPeriod } from '@/lib/weekly-summary-range';
import type { WeeklySummaryDTO } from '@/server/services/dashboard.service';

export const weeklySummaryQueryKey = (period: WeeklySummaryPeriod) =>
  ['weekly-summary', period] as const;

async function fetchWeeklySummary(
  period: WeeklySummaryPeriod,
): Promise<WeeklySummaryDTO> {
  const response = await fetch(
    `/api/dashboard/weekly-summary?period=${encodeURIComponent(period)}`,
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error || 'Failed to fetch weekly summary');
  }
  const data = (await response.json()) as { summary: WeeklySummaryDTO };
  return data.summary;
}

export function useWeeklySummaryQuery(
  period: WeeklySummaryPeriod,
  initialPeriod: WeeklySummaryPeriod,
  initialData?: WeeklySummaryDTO,
) {
  return useQuery({
    queryKey: weeklySummaryQueryKey(period),
    queryFn: () => fetchWeeklySummary(period),
    initialData:
      period === initialPeriod && initialData?.period === period
        ? initialData
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
