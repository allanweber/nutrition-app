import type { WeeklySummaryPeriod } from '@/lib/weekly-summary-range';

const STORAGE_KEY = 'vitalis:weekly-summary-period';
export const WEEKLY_SUMMARY_PERIOD_COOKIE = 'vitalis-weekly-summary-period';
const PERIOD_CHANGE_EVENT = 'vitalis:weekly-summary-period-change';
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

const VALID_PERIODS: WeeklySummaryPeriod[] = ['calendar_week', 'rolling_7d'];

/** SSR period hint set by WeeklySummaryContent so the first client snapshot can reconcile. */
let ssrPeriodHint: WeeklySummaryPeriod | null = null;
let clientReconciled = false;

function subscribePeriodChanges(onStoreChange: () => void): () => void {
  window.addEventListener(PERIOD_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(PERIOD_CHANGE_EVENT, onStoreChange);
}

export function isWeeklySummaryPeriod(value: string): value is WeeklySummaryPeriod {
  return (VALID_PERIODS as string[]).includes(value);
}

export function parseWeeklySummaryPeriod(
  value: string | undefined | null,
): WeeklySummaryPeriod {
  if (value && isWeeklySummaryPeriod(value)) return value;
  return 'calendar_week';
}

/** Called from WeeklySummaryContent with the server-rendered period (cookie). */
export function setWeeklySummaryPeriodSsrHint(period: WeeklySummaryPeriod): void {
  ssrPeriodHint = period;
}

/**
 * Single source of truth on the client: localStorage if set, otherwise SSR period.
 * Persists the resolved value to both localStorage and cookie.
 */
export function reconcileWeeklySummaryPeriodClient(
  serverPeriod: WeeklySummaryPeriod,
): WeeklySummaryPeriod {
  if (typeof window === 'undefined') return serverPeriod;

  const stored = getStoredWeeklySummaryPeriod();
  const resolved = stored ?? serverPeriod;

  try {
    if (!stored) {
      window.localStorage.setItem(STORAGE_KEY, resolved);
    }
  } catch {
    // ignore quota / private mode
  }

  setPeriodCookie(resolved);

  if (stored && stored !== serverPeriod) {
    window.dispatchEvent(new Event(PERIOD_CHANGE_EVENT));
  }

  clientReconciled = true;
  return resolved;
}

export function getWeeklySummaryPeriodSnapshot(): WeeklySummaryPeriod {
  if (typeof window === 'undefined') return 'calendar_week';

  if (!clientReconciled && ssrPeriodHint) {
    return reconcileWeeklySummaryPeriodClient(ssrPeriodHint);
  }

  const stored = getStoredWeeklySummaryPeriod();
  if (stored) {
    setPeriodCookie(stored);
    return stored;
  }

  return ssrPeriodHint ?? 'calendar_week';
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

function setPeriodCookie(period: WeeklySummaryPeriod): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${WEEKLY_SUMMARY_PERIOD_COOKIE}=${period};path=/;max-age=${COOKIE_MAX_AGE_SEC};SameSite=Lax`;
}

/** @deprecated Use reconcile via getWeeklySummaryPeriodSnapshot + setWeeklySummaryPeriodSsrHint */
export function syncWeeklySummaryPeriodCookieFromStorage(): void {
  const stored = getStoredWeeklySummaryPeriod();
  if (stored) setPeriodCookie(stored);
}

export function setStoredWeeklySummaryPeriod(period: WeeklySummaryPeriod): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, period);
    setPeriodCookie(period);
    clientReconciled = true;
    window.dispatchEvent(new Event(PERIOD_CHANGE_EVENT));
  } catch {
    // ignore quota / private mode
  }
}
