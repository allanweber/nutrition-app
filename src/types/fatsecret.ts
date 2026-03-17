// FatSecret REST API v5 response types

export interface FatSecretSearchResponse {
  foods_search: {
    max_results: string;
    total_results: string;
    page_number: string;
    results: {
      food: FatSecretSearchFood | FatSecretSearchFood[];
    };
  };
}

export interface FatSecretSearchFood {
  food_id: string;
  food_name: string;
  food_type: 'Generic' | 'Brand';
  brand_name?: string;
  food_url: string;
  food_images?: {
    food_image: FatSecretImage | FatSecretImage[];
  };
  servings: {
    serving: FatSecretServing | FatSecretServing[];
  };
}

export interface FatSecretServing {
  serving_id: string;
  serving_description: string;
  serving_url?: string;
  metric_serving_amount?: string;
  metric_serving_unit?: string;
  number_of_units?: string;
  measurement_description?: string;
  calories: string;
  carbohydrate: string;
  protein: string;
  fat: string;
  saturated_fat?: string;
  polyunsaturated_fat?: string;
  monounsaturated_fat?: string;
  cholesterol?: string;
  sodium?: string;
  potassium?: string;
  fiber?: string;
  sugar?: string;
  vitamin_a?: string;
  vitamin_c?: string;
  calcium?: string;
  iron?: string;
}

export interface FatSecretImage {
  image_url: string;
  image_type: string;
}

// Normalization helpers — FatSecret returns single objects instead of arrays
// when there is only one result. Always use these to normalize.

export function normalizeFoods(
  food: FatSecretSearchFood | FatSecretSearchFood[],
): FatSecretSearchFood[] {
  return Array.isArray(food) ? food : [food];
}

export function normalizeServings(
  serving: FatSecretServing | FatSecretServing[],
): FatSecretServing[] {
  return Array.isArray(serving) ? serving : [serving];
}

export function normalizeImages(
  image: FatSecretImage | FatSecretImage[],
): FatSecretImage[] {
  return Array.isArray(image) ? image : [image];
}
