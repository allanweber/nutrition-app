import type { WeeklySummaryPeriod } from '@/lib/weekly-summary-range';

const STORAGE_KEY = 'vitalis:weekly-summary-period';
const PERIOD_CHANGE_EVENT = 'vitalis:weekly-summary-period-change';

const VALID_PERIODS: WeeklySummaryPeriod[] = ['calendar_week', 'rolling_7d'];

function subscribePeriodChanges(onStoreChange: () => void): () => void {
  window.addEventListener(PERIOD_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(PERIOD_CHANGE_EVENT, onStoreChange);
}

function isWeeklySummaryPeriod(value: string): value is WeeklySummaryPeriod {
  return (VALID_PERIODS as string[]).includes(value);
}

export function getWeeklySummaryPeriodSnapshot(): WeeklySummaryPeriod {
  return getStoredWeeklySummaryPeriod() ?? 'calendar_week';
}

export function subscribeWeeklySummaryPeriod(
  onStoreChange: () => void,
): () => void {
  return subscribePeriodChanges(onStoreChange);
}

export function getStoredWeeklySummaryPeriod(): WeeklySummaryPeriod | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw || !isWeeklySummaryPeriod(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

export function setStoredWeeklySummaryPeriod(period: WeeklySummaryPeriod): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, period);
    window.dispatchEvent(new Event(PERIOD_CHANGE_EVENT));
  } catch {
    // ignore quota / private mode
  }
}
