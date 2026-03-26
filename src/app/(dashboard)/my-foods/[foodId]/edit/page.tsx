'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CustomFoodForm } from '@/components/forms/custom-food-form';

function useCustomFoodDetailQuery(foodId: string) {
  return useQuery({
    queryKey: ['foods', 'custom', foodId],
    queryFn: async () => {
      const res = await fetch(`/api/foods/custom/${foodId}`);
      if (!res.ok) throw new Error('Failed to fetch food');
      return res.json();
    },
  });
}

export default function EditFoodPage() {
  const params = useParams<{ foodId: string }>();
  const foodId = params.foodId;
  const foodQuery = useCustomFoodDetailQuery(foodId);

  if (foodQuery.isLoading) {
    return <div className="flex justify-center pt-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (foodQuery.isError || !foodQuery.data?.food) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-24">
        <p className="text-destructive">Food not found or you don&apos;t have permission to edit it.</p>
        <Link href="/my-foods" className="text-sm text-primary mt-4 inline-block">← Back to My Foods</Link>
      </div>
    );
  }

  return <CustomFoodForm foodId={foodId} initialFood={foodQuery.data.food} />;
}
