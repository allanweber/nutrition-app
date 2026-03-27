'use client';

import { Loader2 } from 'lucide-react';
import { FoodModal } from '@/components/food-modal';
import { useDishDetailQuery } from '@/queries/dishes';
import type { MealType } from '@/lib/nutrition-constants';

interface DishLogModalProps {
  open: boolean;
  dishId: string | null;
  dishName?: string;
  onClose: () => void;
  onLogged: () => void;
  defaultMealType?: MealType;
  defaultDate?: Date;
}

export function DishLogModal({
  open,
  dishId,
  dishName,
  onClose,
  onLogged,
  defaultMealType = 'breakfast',
  defaultDate,
}: DishLogModalProps) {
  const detailQuery = useDishDetailQuery(open ? dishId : null);
  const dish = detailQuery.data?.dish;

  if (!open || !dishId) return null;

  const isLoading = detailQuery.isLoading;
  const name = dish?.name ?? dishName ?? 'Dish';
  const subtitle = dish?.description ?? undefined;
  const imageUrl =
    dish?.photo?.highres ?? dish?.photo?.thumb ?? undefined;

  if (isLoading || !dish) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
        <div className="w-full max-w-[340px] bg-surface-container-lowest rounded-2xl border border-outline-variant flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <FoodModal
      open={open}
      onClose={onClose}
      name={name}
      subtitle={subtitle}
      imageUrl={imageUrl}
      mode={{
        kind: 'log-dish',
        dishId,
        dishTotals: {
          calories: dish.totals.calories,
          protein: dish.totals.protein,
          carbs: dish.totals.carbs,
          fat: dish.totals.fat,
        },
        initialMealType: defaultMealType,
        initialDate: defaultDate ?? new Date(),
        onLogged,
      }}
    />
  );
}
