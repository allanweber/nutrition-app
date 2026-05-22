export type WeeklySummaryPeriod = 'calendar_week' | 'rolling_7d';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface WeeklySummaryRange {
  period: WeeklySummaryPeriod;
  /** Inclusive lower bound for SQL `gte` */
  start: Date;
  /** Exclusive upper bound for SQL `lt` */
  end: Date;
  /** First day in range (YYYY-MM-DD) */
  periodStart: string;
  /** Last day in range (YYYY-MM-DD), inclusive */
  periodEnd: string;
}

function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function resolveWeeklySummaryRange(
  period: WeeklySummaryPeriod,
  now: Date = new Date(),
): WeeklySummaryRange {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  if (period === 'rolling_7d') {
    const end = new Date(Date.UTC(y, m, d + 1));
    const start = new Date(end.getTime() - 7 * MS_PER_DAY);
    const today = new Date(Date.UTC(y, m, d));
    return {
      period,
      start,
      end,
      periodStart: formatISODate(start),
      periodEnd: formatISODate(today),
    };
  }

  const utcDay = now.getUTCDay();
  const daysFromMonday = utcDay === 0 ? 6 : utcDay - 1;
  const mondayMs = Date.UTC(y, m, d - daysFromMonday);
  const start = new Date(mondayMs);
  const end = new Date(mondayMs + 7 * MS_PER_DAY);
  const sunday = new Date(mondayMs + 6 * MS_PER_DAY);

  return {
    period,
    start,
    end,
    periodStart: formatISODate(start),
    periodEnd: formatISODate(sunday),
  };
}
