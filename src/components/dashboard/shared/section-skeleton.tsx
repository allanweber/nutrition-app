type SkeletonVariant = 'calories' | 'hydration' | 'macros' | 'weekly' | 'schedule';

const VARIANT_LABELS: Record<SkeletonVariant, string> = {
  calories: 'Loading Calories',
  hydration: 'Loading Hydration',
  macros: 'Loading Macros',
  weekly: 'Loading Weekly Momentum',
  schedule: 'Loading Daily Schedule',
};

const VARIANT_HEIGHTS: Record<SkeletonVariant, string> = {
  calories: 'min-h-[280px]',
  hydration: 'min-h-[280px]',
  macros: 'min-h-[240px]',
  weekly: 'min-h-[240px]',
  schedule: 'min-h-[200px]',
};

function CaloriesSkeleton() {
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-16 rounded bg-surface-container-high" />
          <div className="h-12 w-40 rounded-lg bg-surface-container-high" />
          <div className="h-3 w-28 rounded bg-surface-container-high" />
        </div>
        <div className="h-[120px] w-[120px] rounded-full bg-surface-container-high" />
      </div>
      <div className="flex gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-12 rounded bg-surface-container-high" />
          <div className="h-7 w-20 rounded bg-surface-container-high" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-16 rounded bg-surface-container-high" />
          <div className="h-7 w-24 rounded bg-surface-container-high" />
        </div>
      </div>
    </div>
  );
}

function HydrationSkeleton() {
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="h-3 w-20 rounded bg-surface-container-high" />
      <div className="h-14 w-32 rounded-lg bg-surface-container-high" />
      <div className="h-2 w-full rounded-full bg-surface-container-high" />
      <div className="mt-auto h-10 w-28 rounded-xl bg-surface-container-high" />
    </div>
  );
}

function MacrosSkeleton() {
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="h-3 w-14 rounded bg-surface-container-high" />
      <div className="flex flex-col gap-5 flex-1">
        {[40, 60, 50].map((w, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <div className="h-3 w-12 rounded bg-surface-container-high" />
              <div className="h-3 w-16 rounded bg-surface-container-high" />
            </div>
            <div className="h-2 w-full rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-surface-container-highest"
                style={{ width: `${w}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklySkeleton() {
  return (
    <div className="flex flex-col h-full gap-4">
      <div className="h-3 w-32 rounded bg-surface-container-high" />
      <div className="flex items-end gap-2 flex-1">
        {[55, 80, 40, 90, 65, 30, 0].map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full rounded-t bg-surface-container-high"
              style={{ height: `${Math.max(h, 8)}px` }}
            />
            <div className="h-2 w-5 rounded bg-surface-container-high" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="flex flex-col h-full gap-4">
      <div className="h-3 w-24 rounded bg-surface-container-high" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-surface-container-high">
            <div className="h-8 w-8 rounded-full bg-surface-container-highest flex-shrink-0" />
            <div className="flex flex-col gap-1 flex-1">
              <div className="h-3 w-24 rounded bg-surface-container-highest" />
              <div className="h-3 w-16 rounded bg-surface-container-highest" />
            </div>
            <div className="h-3 w-14 rounded bg-surface-container-highest" />
          </div>
        ))}
      </div>
    </div>
  );
}

const VARIANT_CONTENT: Record<SkeletonVariant, React.FC> = {
  calories: CaloriesSkeleton,
  hydration: HydrationSkeleton,
  macros: MacrosSkeleton,
  weekly: WeeklySkeleton,
  schedule: ScheduleSkeleton,
};

interface SectionSkeletonProps {
  variant: SkeletonVariant;
}

export function SectionSkeleton({ variant }: SectionSkeletonProps) {
  const Content = VARIANT_CONTENT[variant];
  const minHeight = VARIANT_HEIGHTS[variant];

  return (
    <div
      className={`rounded-[24px] bg-surface-container-low border border-outline-variant shadow-sm p-8 animate-pulse h-full ${minHeight}`}
      aria-busy="true"
      aria-label={VARIANT_LABELS[variant]}
    >
      <Content />
    </div>
  );
}
