import { Suspense } from 'react';
import Link from 'next/link';
import { SectionSkeleton } from '@/components/dashboard/shared/section-skeleton';
import { SectionErrorBoundary } from '@/components/dashboard/shared/section-error-boundary';
import { CaloriesSection } from '@/components/dashboard/calories/calories-section';
import { MacronutrientsSection } from '@/components/dashboard/macronutrients/macronutrients-section';
import { HydrationSection } from '@/components/dashboard/hydration/hydration-section';
import { WeeklyMomentumSection } from '@/components/dashboard/weekly-momentum/weekly-momentum-section';
import { DailyScheduleSection } from '@/components/dashboard/daily-schedule/daily-schedule-section';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 py-6">
      <PageHeader
        overline="Daily Overview"
        title="Today"
        subtitle="Your nutrition snapshot for the day"
      >
        <Button asChild>
          <Link href="/food-log">Log Activity</Link>
        </Button>
      </PageHeader>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Calories — 8/12 */}
        <div className="md:col-span-8">
          <SectionErrorBoundary minHeight="min-h-[280px]">
            <Suspense fallback={<SectionSkeleton variant="calories" />}>
              <CaloriesSection date={today} />
            </Suspense>
          </SectionErrorBoundary>
        </div>

        {/* Hydration — 4/12 */}
        <div className="md:col-span-4">
          <SectionErrorBoundary minHeight="min-h-[280px]">
            <Suspense fallback={<SectionSkeleton variant="hydration" />}>
              <HydrationSection date={today} />
            </Suspense>
          </SectionErrorBoundary>
        </div>

        {/* Macros — 5/12 */}
        <div className="md:col-span-5">
          <SectionErrorBoundary minHeight="min-h-[240px]">
            <Suspense fallback={<SectionSkeleton variant="macros" />}>
              <MacronutrientsSection date={today} />
            </Suspense>
          </SectionErrorBoundary>
        </div>

        {/* Weekly momentum — 7/12 */}
        <div className="md:col-span-7">
          <SectionErrorBoundary minHeight="min-h-[240px]">
            <Suspense fallback={<SectionSkeleton variant="weekly" />}>
              <WeeklyMomentumSection />
            </Suspense>
          </SectionErrorBoundary>
        </div>

        {/* Daily schedule — full width */}
        <div className="md:col-span-12">
          <SectionErrorBoundary minHeight="min-h-[200px]">
            <Suspense fallback={<SectionSkeleton variant="schedule" />}>
              <DailyScheduleSection date={today} />
            </Suspense>
          </SectionErrorBoundary>
        </div>
      </div>
    </div>
  );
}
