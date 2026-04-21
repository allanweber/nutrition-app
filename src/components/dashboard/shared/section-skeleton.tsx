import { Skeleton } from '@/components/ui/skeleton';

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
          <Skeleton className="bg-muted-foreground/15 h-3 w-16" />
          <Skeleton className="bg-muted-foreground/15 h-12 w-40 rounded-lg" />
          <Skeleton className="bg-muted-foreground/15 h-3 w-28" />
        </div>
        <Skeleton className="bg-muted-foreground/15 h-30 w-30 rounded-full" />
      </div>
      <div className="flex gap-6">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="bg-muted-foreground/15 h-3 w-12" />
          <Skeleton className="bg-muted-foreground/15 h-7 w-20" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="bg-muted-foreground/15 h-3 w-16" />
          <Skeleton className="bg-muted-foreground/15 h-7 w-24" />
        </div>
      </div>
    </div>
  );
}

function HydrationSkeleton() {
  return (
    <div className="flex flex-col h-full gap-6">
      <Skeleton className="bg-muted-foreground/15 h-3 w-20" />
      <Skeleton className="bg-muted-foreground/15 h-14 w-32 rounded-lg" />
      <Skeleton className="bg-muted-foreground/15 h-2 w-full rounded-full" />
      <Skeleton className="bg-muted-foreground/15 mt-auto h-10 w-28 rounded-xl" />
    </div>
  );
}

function MacrosSkeleton() {
  return (
    <div className="flex flex-col h-full gap-6">
      <Skeleton className="bg-muted-foreground/15 h-3 w-14" />
      <div className="flex flex-col gap-5 flex-1">
        {[40, 60, 50].map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <Skeleton className="bg-muted-foreground/15 h-3 w-12" />
              <Skeleton className="bg-muted-foreground/15 h-3 w-16" />
            </div>
            <Skeleton className="bg-muted-foreground/15 h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklySkeleton() {
  return (
    <div className="flex flex-col h-full gap-4">
      <Skeleton className="bg-muted-foreground/15 h-3 w-32" />
      <div className="flex items-end gap-2 flex-1">
        {[55, 80, 40, 90, 65, 30, 0].map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <Skeleton className="bg-muted-foreground/15 w-full rounded-t" style={{ height: `${Math.max(h, 8)}px` }} />
            <Skeleton className="bg-muted-foreground/15 h-2 w-5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="flex flex-col h-full gap-4">
      <Skeleton className="bg-muted-foreground/15 h-3 w-24" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-muted">
            <Skeleton className="bg-muted-foreground/15 h-8 w-8 rounded-full shrink-0" />
            <div className="flex flex-col gap-1 flex-1">
              <Skeleton className="bg-muted-foreground/15 h-3 w-24" />
              <Skeleton className="bg-muted-foreground/15 h-3 w-16" />
            </div>
            <Skeleton className="bg-muted-foreground/15 h-3 w-14" />
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
      className={`rounded-[24px] bg-muted border border-border shadow-sm p-8 h-full ${minHeight}`}
      aria-busy="true"
      aria-label={VARIANT_LABELS[variant]}
    >
      <Content />
    </div>
  );
}
