import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateMealPlanPage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div className="mb-8">
        <Link
          href="/meal-planner"
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Meal Planner
        </Link>
        <h1 className="text-4xl font-headline font-bold text-foreground">Create Plan</h1>
        <p className="text-on-surface-variant mt-1">Design a new weekly meal plan</p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <span className="text-2xl">📅</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">Coming soon</h2>
        <p className="text-sm text-on-surface-variant max-w-sm">
          The meal plan builder is under development.
        </p>
      </div>
    </div>
  );
}
