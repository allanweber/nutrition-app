// Generic food data types - source agnostic

export type FoodSource =
  | 'fatsecret'
  | 'user_custom'
  | 'usda'
  | 'manual'
  | 'database';

export interface FoodPhoto {
  thumb?: string | null;
  medium?: string | null;
  highres?: string | null;
}

export interface AlternativeMeasure {
  serving_weight: number;
  measure: string;
  seq?: number;
  qty: number;
}

export interface Nutrient {
  attr_id: number;
  value: number;
}

export interface BaseFood {
  id: string;
  sourceId: string | null; // Generic ID from source system
  sourceType: FoodSource;
  name: string;
  brandName?: string | null;
  servingQty?: number;
  servingUnit?: string;
  servingWeightGrams?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  fullNutrients?: Nutrient[];
  isRaw?: boolean;
  userId?: string | null;
  photo?: FoodPhoto | null;
  photoUrl?: string | null; // Flattened photo URL for API responses
  altMeasures?: AlternativeMeasure[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodLogEntry {
  id: string;
  userId: string;
  foodId: string;
  quantity: number;
  servingUnit?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  consumedAt: Date;
  createdAt: Date;
  food: BaseFood;
}

// Nutrition summary types (source agnostic)
export interface DailyNutritionSummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  foodCount: number;
}
