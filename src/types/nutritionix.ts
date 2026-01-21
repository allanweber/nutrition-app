// Nutritionix API response types
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

export interface Nutrient {
  attr_id: number;
  value: number;
}

export interface AlternativeMeasure {
  serving_weight: number;
  measure: string;
  seq: number;
  qty: number;
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

// Local food types (for cached data)
export interface CachedFood {
  id: number;
  nutritionixId?: string;
  name: string;
  brandName?: string;
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
  photoUrl?: string;
  upc?: string;
  createdAt: Date;
  updatedAt: Date;
}
