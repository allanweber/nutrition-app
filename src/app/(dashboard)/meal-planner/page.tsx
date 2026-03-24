import { CalendarDays } from 'lucide-react';
import { CreatePlanButton } from '@/components/create-action-buttons';

export default function MealPlannerPage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-foreground">Meal Planner</h1>
        <p className="text-on-surface-variant mt-1">Plan your meals for the week ahead</p>
      </div>

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
