interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
}

export function StatCard({ label, value, unit }: StatCardProps) {
  return (
    <div className="flex flex-col gap-0.5 bg-surface-container rounded-xl px-4 py-3 flex-1">
      <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      <span className="text-2xl font-headline font-black tabular-nums text-foreground">
        {value}
        {unit && (
          <span className="text-sm font-semibold text-on-surface-variant ml-0.5">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}
