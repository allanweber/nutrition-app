import { describe, expect, it } from 'vitest';
import { resolveWeeklySummaryRange } from './weekly-summary-range';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('resolveWeeklySummaryRange', () => {
  it('calendar_week: Mon–Sun bounds when today is Wednesday', () => {
    const wed = new Date('2026-05-20T15:00:00.000Z');
    const range = resolveWeeklySummaryRange('calendar_week', wed);

    expect(range.periodStart).toBe('2026-05-18');
    expect(range.periodEnd).toBe('2026-05-24');
    expect(range.end.getTime() - range.start.getTime()).toBe(7 * MS_PER_DAY);
  });

  it('calendar_week: week includes Sunday when today is Sunday', () => {
    const sun = new Date('2026-05-24T12:00:00.000Z');
    const range = resolveWeeklySummaryRange('calendar_week', sun);

    expect(range.periodStart).toBe('2026-05-18');
    expect(range.periodEnd).toBe('2026-05-24');
  });

  it('rolling_7d: seven UTC days ending today', () => {
    const today = new Date('2026-05-22T18:30:00.000Z');
    const range = resolveWeeklySummaryRange('rolling_7d', today);

    expect(range.periodEnd).toBe('2026-05-22');
    expect(range.periodStart).toBe('2026-05-16');
    expect(range.end.getTime() - range.start.getTime()).toBe(7 * MS_PER_DAY);
  });

  it('rolling_7d: exclusive end is start of tomorrow UTC', () => {
    const today = new Date('2026-05-22T00:00:00.000Z');
    const range = resolveWeeklySummaryRange('rolling_7d', today);

    expect(range.end.toISOString()).toBe('2026-05-23T00:00:00.000Z');
    expect(range.start.toISOString()).toBe('2026-05-16T00:00:00.000Z');
  });
});
