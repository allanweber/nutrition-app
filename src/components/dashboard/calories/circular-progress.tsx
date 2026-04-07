interface CircularProgressProps {
  percentage: number;
  label: string;
  value: string | number;
  size?: number;
}

export function CircularProgress({
  percentage,
  label,
  value,
  size = 140,
}: CircularProgressProps) {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${clamped}% of daily goal`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-headline font-black tabular-nums leading-none text-foreground">
          {value}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">
          {label}
        </span>
      </div>
    </div>
  );
}
