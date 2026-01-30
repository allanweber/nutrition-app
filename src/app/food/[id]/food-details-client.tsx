'use client';

import { useRouter } from 'next/navigation';

import NutritionFacts from '@/components/nutrition-facts';
import type { NutritionSourceFood } from '@/lib/nutrition-sources/types';

export default function FoodDetailsClient({ food }: { food: NutritionSourceFood }) {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-16 pb-12 md:pt-20 md:pb-16">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">Food details</h1>
        <p className="text-sm text-muted-foreground">Nutrition information</p>
      </div>

      <div className="rounded-lg bg-card">
        <NutritionFacts
          food={food}
          showActionButton={false}
          showCancelButton={false}
          onCancel={() => router.back()}
          onConfirm={() => router.back()}
        />
      </div>
    </div>
  );
}
