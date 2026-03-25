export interface DishIngredient {
  id: string;
  foodId: string;
  foodName: string;
  thumbnail: string | null;
  altMeasureId: string | null;
  altMeasureDescription: string | null;
  quantity: number; // grams
  seq: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DishTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DishDetail {
  id: string;
  name: string;
  description: string | null;
  photo: { thumb: string | null; highres: string | null } | null;
  ingredients: DishIngredient[];
  totals: DishTotals;
  createdAt: string;
  updatedAt: string;
}

export interface DishListItem {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  ingredientCount: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: string;
}
