import { useQuery } from '@tanstack/react-query';

export interface FoodServing {
  id: string;
  description: string;
  weightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
}

export interface FoodImages {
  thumb: string | null;
  medium: string | null;
  highres: string | null;
}

export interface FoodDetailResponse {
  id: string;
  name: string;
  brandName: string | null;
  foodType: 'Generic' | 'Brand';
  foodUrl: string | null;
  baseServing: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    saturatedFat: number | null;
    fiber: number | null;
    sugar: number | null;
    sodium: number | null;
    potassium: number | null;
    vitaminA: number | null;
    vitaminC: number | null;
    calcium: number | null;
    iron: number | null;
  };
  servings: FoodServing[];
  images: FoodImages | null;
}

export type FoodSelection = { id: string; fatSecretId?: string } | { id: null; fatSecretId: string };

export function useFoodDetailQuery(selection: FoodSelection | null) {
  return useQuery({
    queryKey: ['foods', 'detail', selection?.id ?? null, selection?.fatSecretId ?? null],
    queryFn: async (): Promise<{ food: FoodDetailResponse }> => {
      const params = selection!.id !== null
        ? `id=${selection!.id}`
        : `fatSecretId=${encodeURIComponent(selection!.fatSecretId!)}`;
      const response = await fetch(`/api/foods/detail?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load food details');
      }
      return response.json();
    },
    enabled: selection !== null,
  });
}
