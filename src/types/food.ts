// Generic food data types - source agnostic

export type FoodSource =
  | 'usda'
  | 'openfoodfacts'
  | 'fatsecret'
  | 'user_custom'
  | 'database';

export interface FoodPhoto {
  thumb?: string | null;
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
  id: number;
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
  isCustom?: boolean;
  userId?: string | null;
  photo?: FoodPhoto | null;
  photoUrl?: string | null; // Flattened photo URL for API responses
  altMeasures?: AlternativeMeasure[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodLogEntry {
  id: number;
  userId: string;
  foodId: number;
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

// Helper function return type for conversion
export interface ConvertedFood {
  sourceId: string | null;
  source: FoodSource;
  name: string;
  brandName: string | null;
  servingQty: number;
  servingUnit: string;
  servingWeightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  fullNutrients: Nutrient[];
  isRaw: boolean;
  isCustom: boolean;
  photo?: FoodPhoto | null;
  altMeasures?: AlternativeMeasure[];
}

export function customFoodToBaseFood(customFood: {
  name: string;
  brandName?: string;
  servingQty: number;
  servingUnit: string;
  servingWeightGrams?: number;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}): ConvertedFood {
  return {
    sourceId: null,
    source: 'user_custom',
    name: customFood.name,
    brandName: customFood.brandName || null,
    servingQty: customFood.servingQty,
    servingUnit: customFood.servingUnit,
    servingWeightGrams: customFood.servingWeightGrams || 0,
    calories: customFood.calories,
    protein: customFood.protein || 0,
    carbs: customFood.carbs || 0,
    fat: customFood.fat || 0,
    fiber: customFood.fiber || 0,
    sugar: customFood.sugar || 0,
    sodium: customFood.sodium || 0,
    fullNutrients: [],
    isRaw: false,
    isCustom: true,
  };
}
