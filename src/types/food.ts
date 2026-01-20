// Generic food data types - source agnostic

export type FoodSource = 'nutritionix' | 'user_custom' | 'usda' | 'manual' | 'database';

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
  quantity: string;
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

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  goalType?: 'weight_loss' | 'maintenance' | 'weight_gain';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'extra_active';
}

// Source-specific types
export interface NutritionixFood {
  food_name: string;
  brand_name?: string | null;
  serving_qty: number;
  serving_unit: string;
  serving_weight_grams: number;
  nf_calories: number;
  nf_total_fat: number;
  nf_saturated_fat: number;
  nf_cholesterol: number;
  nf_sodium: number;
  nf_total_carbohydrate: number;
  nf_dietary_fiber: number;
  nf_sugars: number;
  nf_protein: number;
  nf_potassium: number;
  nf_p: number;
  full_nutrients: Nutrient[];
  nix_brand_name?: string | null;
  nix_brand_id?: string | null;
  nix_item_name?: string | null;
  nix_item_id?: string | null;
  upc?: string | null;
  consumed_at: string;
  metadata: {
    is_raw_food: boolean;
  };
  source: number;
  ndb_no: number;
  tags: {
    item: string;
    measure?: string | null;
    quantity: string;
    food_group: number;
    tag_id: number;
  };
  alt_measures: AlternativeMeasure[];
  lat?: number | null;
  lng?: number | null;
  meal_type: number;
  photo?: {
    thumb: string;
    highres: string;
    is_user_uploaded: boolean;
  } | null;
  sub_recipe?: Record<string, unknown> | null;
  class_code?: string | null;
  brick_code?: string | null;
  tag_id?: number | null;
}

export interface NutritionixSearchResult {
  common?: {
    food_name: string;
    serving_unit: string;
    tag_id: number;
    locale: string;
    photo: {
      thumb: string;
    };
  }[];
  branded?: {
    food_name: string;
    brand_name: string;
    nix_brand_id: string;
    nix_item_id: string;
    nix_item_name: string;
    serving_unit: string;
    serving_qty: number;
    tag_id: number;
    photo: {
      thumb: string;
    };
  }[];
}

export interface NaturalLanguageResponse {
  foods: NutritionixFood[];
}

export interface InstantSearchResponse {
  common?: NutritionixSearchResult['common'];
  branded?: NutritionixSearchResult['branded'];
}

// Helper function return type for conversion
export interface ConvertedFood {
  sourceId: string | null;
  source: string;
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

// Helper functions to convert between types
export function nutritionixToBaseFood(nutritionixFood: NutritionixFood): ConvertedFood {
  return {
    sourceId: nutritionixFood.nix_item_id || nutritionixFood.upc || null,
    source: 'nutritionix',
    name: nutritionixFood.food_name,
    brandName: nutritionixFood.brand_name || null,
    servingQty: nutritionixFood.serving_qty,
    servingUnit: nutritionixFood.serving_unit,
    servingWeightGrams: nutritionixFood.serving_weight_grams,
    calories: nutritionixFood.nf_calories,
    protein: nutritionixFood.nf_protein,
    carbs: nutritionixFood.nf_total_carbohydrate,
    fat: nutritionixFood.nf_total_fat,
    fiber: nutritionixFood.nf_dietary_fiber,
    sugar: nutritionixFood.nf_sugars,
    sodium: nutritionixFood.nf_sodium,
    fullNutrients: nutritionixFood.full_nutrients,
    isRaw: nutritionixFood.metadata?.is_raw_food || false,
    isCustom: false,
    photo: nutritionixFood.photo ? {
      thumb: nutritionixFood.photo.thumb,
      highres: nutritionixFood.photo.highres,
    } : null,
    altMeasures: nutritionixFood.alt_measures?.map((m, i) => ({
      serving_weight: m.serving_weight,
      measure: m.measure,
      seq: i + 1,
      qty: m.qty,
    })),
  };
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
