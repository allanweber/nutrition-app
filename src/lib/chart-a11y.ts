/** Build a concise aria-label for chart `role="img"` wrappers. */
export function summarizeChartSeries(
  points: ReadonlyArray<{ label: string; value: number }>,
  metricLabel: string,
  unit: string,
): string {
  if (points.length === 0) {
    return `No ${metricLabel} data`;
  }
  const summary = points
    .map((p) => `${p.label} ${Math.round(p.value)} ${unit}`)
    .join(', ');
  return `${metricLabel}: ${summary}`;
}
