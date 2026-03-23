interface ProgressBarProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
  percentage?: number;
}

export function ProgressBar({ label, value, goal, unit, color, percentage }: ProgressBarProps) {
  const pct = percentage ?? (goal > 0 ? Math.min((value / goal) * 100, 100) : 0);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
          {label}
        </span>
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {value.toLocaleString()}
          <span className="text-on-surface-variant">/{goal.toLocaleString()}{unit}</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden"
      >
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
