// Generic food data types - source agnostic

export type FoodSource = 'nutritionix' | 'user_custom' | 'usda' | 'manual' | 'database';

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
  photoUrl?: string | null;
  upc?: string | null;
  metadata?: Record<string, unknown> | null; // Store source-specific data
  createdAt: Date;
  updatedAt: Date;
}

export interface Nutrient {
  attr_id: number;
  value: number;
}

export interface AlternativeMeasure {
  serving_weight: number;
  measure: string;
  qty: number;
}

export interface FoodLogEntry {
  id: number;
  userId: number;
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

// Helper functions to convert between types
export function nutritionixToBaseFood(nutritionixFood: NutritionixFood): Omit<BaseFood, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    sourceId: nutritionixFood.nix_item_id || nutritionixFood.upc || null,
    sourceType: 'nutritionix',
    name: nutritionixFood.food_name,
    brandName: nutritionixFood.brand_name,
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
    photoUrl: nutritionixFood.photo?.thumb || null,
    upc: nutritionixFood.upc || null,
    metadata: nutritionixFood.metadata,
  };
}

export function customFoodToBaseFood(customFood: any): Omit<BaseFood, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    sourceId: null,
    sourceType: 'user_custom',
    name: customFood.name,
    brandName: customFood.brandName || null,
    servingQty: customFood.servingQty,
    servingUnit: customFood.servingUnit,
    servingWeightGrams: customFood.servingWeightGrams,
    calories: customFood.calories,
    protein: customFood.protein,
    carbs: customFood.carbs,
    fat: customFood.fat,
    fiber: customFood.fiber,
    sugar: customFood.sugar,
    sodium: customFood.sodium,
    photoUrl: customFood.photoUrl || null,
    upc: customFood.upc || null,
    metadata: { isPublic: customFood.isPublic || false },
  };
}