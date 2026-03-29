import { CalendarDays } from 'lucide-react';
import { CreatePlanButton } from '@/components/create-action-buttons';
import { PageHeader } from '@/components/page-header';

export default function MealPlannerPage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      <PageHeader
        overline="Planning"
        title="Meal Planner"
        subtitle="Plan your meals for the week ahead"
      >
        <CreatePlanButton variant="primary" />
      </PageHeader>

      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
          <CalendarDays className="h-8 w-8 text-on-surface-variant/40" />
        </div>
        <h2 className="text-xl font-bold text-foreground">No meal plans yet</h2>
        <p className="text-sm text-on-surface-variant max-w-sm">
          Build weekly meal plans, track nutritional targets, and stay consistent with your diet goals.
        </p>
        <div className="mt-2">
          <CreatePlanButton variant="primary" />
        </div>
      </div>
    </div>
  );
}
