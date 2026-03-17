import type { FatSecretSearchResponse } from '@/types/fatsecret';

// Multi-result search response (food is an array) — real v5 shape
export const mockMultiSearchResponse: FatSecretSearchResponse = {
  foods_search: {
    max_results: '10',
    total_results: '9',
    page_number: '0',
    results: {
      food: [
        {
          food_id: '35718',
          food_name: 'Apples',
          food_type: 'Generic',
          food_url: 'https://foods.fatsecret.com/calories-nutrition/usda/apples',
          food_images: {
            food_image: [
              {
                image_url: 'https://www.foodimagedb.com/food-images/abc_1024x1024.png',
                image_type: '0',
              },
              {
                image_url: 'https://www.foodimagedb.com/food-images/abc_400x400.png',
                image_type: '0',
              },
              {
                image_url: 'https://www.foodimagedb.com/food-images/abc_72x72.png',
                image_type: '0',
              },
            ],
          },
          servings: {
            serving: [
              {
                serving_id: '32915',
                serving_description: '1 medium (2-3/4" dia) (approx 3 per lb)',
                metric_serving_amount: '138.000',
                metric_serving_unit: 'g',
                number_of_units: '1.000',
                measurement_description: 'medium (2-3/4" dia) (approx 3 per lb)',
                calories: '72',
                carbohydrate: '19.06',
                protein: '0.36',
                fat: '0.23',
                saturated_fat: '0.039',
                polyunsaturated_fat: '0.070',
                monounsaturated_fat: '0.010',
                cholesterol: '0',
                sodium: '1',
                potassium: '148',
                fiber: '3.3',
                sugar: '14.34',
                vitamin_a: '4',
                vitamin_c: '6.3',
                calcium: '8',
                iron: '0.17',
              },
              {
                serving_id: '58449',
                serving_description: '100 g',
                metric_serving_amount: '100.000',
                metric_serving_unit: 'g',
                number_of_units: '100.000',
                measurement_description: 'g',
                calories: '52',
                carbohydrate: '13.81',
                protein: '0.26',
                fat: '0.17',
                saturated_fat: '0.028',
                polyunsaturated_fat: '0.051',
                monounsaturated_fat: '0.007',
                cholesterol: '0',
                sodium: '1',
                potassium: '107',
                fiber: '2.4',
                sugar: '10.39',
                vitamin_a: '3',
                vitamin_c: '4.6',
                calcium: '6',
                iron: '0.12',
              },
            ],
          },
        },
        {
          food_id: '123456',
          food_name: 'Apple Juice',
          food_type: 'Generic',
          food_url: 'https://foods.fatsecret.com/calories-nutrition/usda/apple-juice',
          servings: {
            serving: {
              serving_id: '99001',
              serving_description: '100 g',
              metric_serving_amount: '100.000',
              metric_serving_unit: 'g',
              number_of_units: '100.000',
              measurement_description: 'g',
              calories: '46',
              carbohydrate: '11.30',
              protein: '0.10',
              fat: '0.11',
              sodium: '3',
            },
          },
        },
        {
          food_id: '789012',
          food_name: 'Apple Cider Vinegar',
          food_type: 'Brand',
          brand_name: 'Bragg',
          food_url: 'https://foods.fatsecret.com/calories-nutrition/bragg/apple-cider-vinegar',
          servings: {
            serving: {
              serving_id: '99002',
              serving_description: '100 g',
              metric_serving_amount: '100.000',
              metric_serving_unit: 'g',
              number_of_units: '100.000',
              measurement_description: 'g',
              calories: '22',
              carbohydrate: '0.93',
              protein: '0.00',
              fat: '0.00',
            },
          },
        },
      ],
    },
  },
};

// Single-result search response (food is a plain object, not an array)
export const mockSingleSearchResponse: FatSecretSearchResponse = {
  foods_search: {
    max_results: '1',
    total_results: '1',
    page_number: '0',
    results: {
      food: {
        food_id: '9999',
        food_name: 'Quinoa',
        food_type: 'Generic',
        food_url: 'https://foods.fatsecret.com/calories-nutrition/usda/quinoa',
        servings: {
          serving: {
            serving_id: '11111',
            serving_description: '100 g',
            metric_serving_amount: '100.000',
            metric_serving_unit: 'g',
            number_of_units: '100.000',
            measurement_description: 'g',
            calories: '120',
            carbohydrate: '21.30',
            protein: '4.40',
            fat: '1.92',
            fiber: '2.8',
            sodium: '5',
          },
        },
      },
    },
  },
};

// Export search function compatible with fatsecret client interface
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getMockSearchResponse(keyword: string, page: number): Promise<FatSecretSearchResponse> {
  return mockMultiSearchResponse;
}
