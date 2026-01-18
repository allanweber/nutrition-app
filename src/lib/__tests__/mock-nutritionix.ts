import { InstantSearchResponse, NaturalLanguageResponse } from '@/types/nutritionix';

// Mock search results for common food queries
export const mockSearchResults: Record<string, InstantSearchResponse> = {
  apple: {
    branded: [],
    common: [
      {
        food_name: "Apple",
        tag_id: 1,
        serving_unit: "medium (3\" dia)",
        locale: "en_US",
        photo: {
          thumb: "https://d2eawub7itclh4.cloudfront.net/assets/nix-apple-coloured.png"
        }
      }
    ]
  },
  banana: {
    branded: [],
    common: [
      {
        food_name: "Banana",
        tag_id: 2,
        serving_unit: "medium (7\" to 7-7/8\" long)",
        locale: "en_US",
        photo: {
          thumb: "https://d2eawub7itclh4.cloudfront.net/assets/nix-banana.png"
        }
      }
    ]
  },
  chicken: {
    branded: [],
    common: [
      {
        food_name: "Chicken Breast",
        tag_id: 3,
        serving_unit: "3 oz",
        locale: "en_US",
        photo: {
          thumb: "https://d2eawub7itclh4.cloudfront.net/assets/nix-chicken-breast.png"
        }
      }
    ]
  },
  rice: {
    branded: [],
    common: [
      {
        food_name: "White Rice",
        tag_id: 4,
        serving_unit: "1 cup cooked",
        locale: "en_US",
        photo: {
          thumb: "https://d2eawub7itclh4.cloudfront.net/assets/nix-white-rice.png"
        }
      }
    ]
  }
};

// Mock natural nutrient data
export const mockNutrientData: Record<string, NaturalLanguageResponse> = {
  apple: {
    foods: [
      {
        food_name: "Apple",
        serving_qty: 1,
        serving_unit: "medium (3\" dia)",
        serving_weight_grams: 182,
        nf_calories: 95,
        nf_protein: 0.5,
        nf_total_carbohydrate: 25,
        nf_total_fat: 0.3,
        nf_dietary_fiber: 4.4,
        nf_sugars: 19,
        nf_sodium: 1,
        nf_saturated_fat: 0.1,
        nf_cholesterol: 0,
        nf_potassium: 195,
        nf_p: 20,
        nix_item_id: "1",
        brand_name: null,
        photo: {
          thumb: "https://d2eawub7itclh4.cloudfront.net/assets/nix-apple-coloured.png",
          highres: "https://d2eawub7itclh4.cloudfront.net/assets/nix-apple-coloured.png",
          is_user_uploaded: false
        },
        upc: null,
        consumed_at: new Date().toISOString(),
        metadata: {
          is_raw_food: true
        },
        source: 1,
        ndb_no: 9003,
        tags: {
          item: "apple",
          measure: null,
          quantity: "1",
          food_group: 1,
          tag_id: 1
        },
        alt_measures: [],
        meal_type: 0,
        sub_recipe: null,
        class_code: null,
        brick_code: null,
        full_nutrients: []
      }
    ]
  },
  banana: {
    foods: [
      {
        food_name: "Banana",
        serving_qty: 1,
        serving_unit: "medium (7\" to 7-7/8\" long)",
        serving_weight_grams: 118,
        nf_calories: 105,
        nf_protein: 1.3,
        nf_total_carbohydrate: 27,
        nf_total_fat: 0.4,
        nf_dietary_fiber: 3.1,
        nf_sugars: 14,
        nf_sodium: 1,
        nf_saturated_fat: 0.1,
        nf_cholesterol: 0,
        nf_potassium: 422,
        nf_p: 25,
        nix_item_id: "2",
        brand_name: null,
        photo: {
          thumb: "https://d2eawub7itclh4.cloudfront.net/assets/nix-banana.png",
          highres: "https://d2eawub7itclh4.cloudfront.net/assets/nix-banana.png",
          is_user_uploaded: false
        },
        upc: null,
        consumed_at: new Date().toISOString(),
        metadata: {
          is_raw_food: true
        },
        source: 1,
        ndb_no: 903,
        tags: {
          item: "banana",
          measure: null,
          quantity: "1",
          food_group: 1,
          tag_id: 2
        },
        alt_measures: [],
        meal_type: 0,
        sub_recipe: null,
        class_code: null,
        brick_code: null,
        full_nutrients: []
      }
    ]
  },
  chicken: {
    foods: [
      {
        food_name: "Chicken Breast",
        serving_qty: 3,
        serving_unit: "oz",
        serving_weight_grams: 85,
        nf_calories: 128,
        nf_protein: 24,
        nf_total_carbohydrate: 0,
        nf_total_fat: 2.7,
        nf_dietary_fiber: 0,
        nf_sugars: 0,
        nf_sodium: 44,
        nf_saturated_fat: 0.7,
        nf_cholesterol: 73,
        nf_potassium: 220,
        nf_p: 205,
        nix_item_id: "3",
        brand_name: null,
        photo: {
          thumb: "https://d2eawub7itclh4.cloudfront.net/assets/nix-chicken-breast.png",
          highres: "https://d2eawub7itclh4.cloudfront.net/assets/nix-chicken-breast.png",
          is_user_uploaded: false
        },
        upc: null,
        consumed_at: new Date().toISOString(),
        metadata: {
          is_raw_food: false
        },
        source: 1,
        ndb_no: 507,
        tags: {
          item: "chicken breast",
          measure: null,
          quantity: "3",
          food_group: 4,
          tag_id: 3
        },
        alt_measures: [],
        meal_type: 0,
        sub_recipe: null,
        class_code: null,
        brick_code: null,
        full_nutrients: []
      }
    ]
  },
  rice: {
    foods: [
      {
        food_name: "White Rice",
        serving_qty: 1,
        serving_unit: "cup cooked",
        serving_weight_grams: 158,
        nf_calories: 206,
        nf_protein: 4.3,
        nf_total_carbohydrate: 45,
        nf_total_fat: 0.4,
        nf_dietary_fiber: 0.6,
        nf_sugars: 0.1,
        nf_sodium: 1,
        nf_saturated_fat: 0.1,
        nf_cholesterol: 0,
        nf_potassium: 55,
        nf_p: 68,
        nix_item_id: "4",
        brand_name: null,
        photo: {
          thumb: "https://d2eawub7itclh4.cloudfront.net/assets/nix-white-rice.png",
          highres: "https://d2eawub7itclh4.cloudfront.net/assets/nix-white-rice.png",
          is_user_uploaded: false
        },
        upc: null,
        consumed_at: new Date().toISOString(),
        metadata: {
          is_raw_food: false
        },
        source: 1,
        ndb_no: 2001,
        tags: {
          item: "white rice",
          measure: null,
          quantity: "1",
          food_group: 8,
          tag_id: 4
        },
        alt_measures: [],
        meal_type: 0,
        sub_recipe: null,
        class_code: null,
        brick_code: null,
        full_nutrients: []
      }
    ]
  }
};

export function getMockSearchResults(query: string): InstantSearchResponse {
  // Find exact matches first
  const lowerQuery = query.toLowerCase();
  if (mockSearchResults[lowerQuery]) {
    return mockSearchResults[lowerQuery];
  }

  // Find partial matches
  for (const [key, value] of Object.entries(mockSearchResults)) {
    if (key.includes(lowerQuery) || lowerQuery.includes(key)) {
      return value;
    }
  }

  // Return empty results if no match
  return {
    branded: [],
    common: []
  };
}

export function getMockNutrientData(query: string): NaturalLanguageResponse {
  // Find exact matches first
  const lowerQuery = query.toLowerCase();
  if (mockNutrientData[lowerQuery]) {
    return mockNutrientData[lowerQuery];
  }

  // Find partial matches
  for (const [key, value] of Object.entries(mockNutrientData)) {
    if (key.includes(lowerQuery) || lowerQuery.includes(key)) {
      return value;
    }
  }

  // Return empty foods array if no match
  return { foods: [] };
}