'use client';

import { FoodModal } from '@/components/food-modal';
import type { FoodAddModalProps } from '@/components/food-search-field/types';
import type { FoodDetailResponse } from '@/queries/food-detail';

const EMPTY_DETAIL: FoodDetailResponse = {
  id: '',
  name: '',
  brandName: null,
  foodType: 'Generic',
  foodUrl: null,
  baseServing: {
    calories: 0, protein: 0, carbs: 0, fat: 0,
    saturatedFat: null, fiber: null, sugar: null, sodium: null,
    potassium: null, vitaminA: null, vitaminC: null, calcium: null, iron: null,
  },
  servings: [],
  images: null,
};

export function FoodLogAddModal({
  open,
  food,
  foodDetail,
  isDetailLoading,
  onClose,
  onAdded,
  defaultDate,
  defaultMealType,
}: FoodAddModalProps) {
  if (!food) return null;

  const detail = foodDetail ?? EMPTY_DETAIL;

  return (
    <FoodModal
      open={open}
      onClose={onClose}
      isLoading={isDetailLoading || !foodDetail}
      name={food.name}
      subtitle={food.brandName ?? undefined}
      imageUrl={
        foodDetail?.images?.highres ??
        foodDetail?.images?.medium ??
        foodDetail?.images?.thumb ??
        food.thumbnail ??
        undefined
      }
      mode={{
        kind: 'log-food',
        foodDetail: detail,
        initialMealType: defaultMealType ?? 'breakfast',
        initialDate: defaultDate ?? new Date(),
        onAdded,
      }}
    />
  );
}
