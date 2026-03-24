import { UtensilsCrossed } from 'lucide-react';
import { CreateFoodButton } from '@/components/create-action-buttons';

export default function MyFoodsPage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-foreground">My Foods</h1>
        <p className="text-on-surface-variant mt-1">Your custom food library</p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
          <UtensilsCrossed className="h-8 w-8 text-on-surface-variant/40" />
        </div>
        <h2 className="text-xl font-bold text-foreground">No custom foods yet</h2>
        <p className="text-sm text-on-surface-variant max-w-sm">
          Create your own foods with exact nutrition info and reuse them across your logs.
        </p>
        <div className="mt-2">
          <CreateFoodButton />
        </div>
      </div>
    </div>
  );
}
