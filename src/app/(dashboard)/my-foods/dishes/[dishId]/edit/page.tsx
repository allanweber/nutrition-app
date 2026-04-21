'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CustomDishForm } from '@/components/forms/custom-dish-form';
import { useDishDetailQuery } from '@/queries/dishes';
import { Loader2 } from 'lucide-react';

export default function EditDishPage() {
  const params = useParams<{ dishId: string }>();
  const dishId = params.dishId;
  const dishQuery = useDishDetailQuery(dishId);

  if (dishQuery.isLoading) {
    return (
      <div className="flex justify-center pt-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (dishQuery.isError || !dishQuery.data?.dish) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-24">
        <p className="text-destructive">Dish not found or you don&apos;t have permission to edit it.</p>
        <Link href="/my-foods" className="text-sm text-primary mt-4 inline-block">← Back to My Foods</Link>
      </div>
    );
  }

  return <CustomDishForm dishId={dishId} initialDish={dishQuery.data.dish} />;
}
