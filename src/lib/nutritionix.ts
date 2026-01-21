import {
  InstantSearchResponse,
  NaturalLanguageResponse,
  NutritionixFood,
} from '@/types/nutritionix';

class NutritionixAPI {
  private baseUrl = 'https://trackapi.nutritionix.com/v2';
  private appId: string;
  private appKey: string;

  constructor() {
    this.appId = process.env.NUTRITIONIX_APP_ID!;
    this.appKey = process.env.NUTRITIONIX_API_KEY!;

    if (!this.appId || !this.appKey) {
      console.warn('Nutritionix API credentials not configured');
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-app-id': this.appId,
      'x-app-key': this.appKey,
    };
  }

  async searchFoods(query: string): Promise<InstantSearchResponse> {
    // Use mock data when USE_MOCK_NUTRITIONIX is set (for E2E tests)
    if (process.env.USE_MOCK_NUTRITIONIX === 'true') {
      const { getMockSearchResults } =
        await import('@/lib/__tests__/mock-nutritionix');
      return getMockSearchResults(query);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/search/instant?query=${encodeURIComponent(query)}`,
        {
          headers: this.getHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Nutritionix search failed: ${response.status} ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching foods:', error);
      throw error;
    }
  }

  async getNaturalNutrients(query: string): Promise<NaturalLanguageResponse> {
    // Use mock data when USE_MOCK_NUTRITIONIX is set (for E2E tests)
    if (process.env.USE_MOCK_NUTRITIONIX === 'true') {
      const { getMockNutrientData } =
        await import('@/lib/__tests__/mock-nutritionix');
      return getMockNutrientData(query);
    }

    try {
      const response = await fetch(`${this.baseUrl}/natural/nutrients`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query: query,
          use_branded_foods: true,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Nutritionix natural nutrients failed: ${response.status} ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting natural nutrients:', error);
      throw error;
    }
  }

  async getFoodByUPC(upc: string): Promise<NaturalLanguageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/search/item?upc=${upc}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `Nutritionix UPC lookup failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      return { foods: [data] };
    } catch (error) {
      console.error('Error getting food by UPC:', error);
      throw error;
    }
  }

  formatNutritionData(food: NutritionixFood) {
    return {
      nutritionixId: food.nix_item_id || null,
      name: food.food_name,
      brandName: food.brand_name || food.nix_brand_name || null,
      servingQty: food.serving_qty.toString(),
      servingUnit: food.serving_unit,
      servingWeightGrams: food.serving_weight_grams.toString(),
      calories: food.nf_calories.toString(),
      protein: food.nf_protein.toString(),
      carbs: food.nf_total_carbohydrate.toString(),
      fat: food.nf_total_fat.toString(),
      fiber: food.nf_dietary_fiber?.toString() || null,
      sugar: food.nf_sugars?.toString() || null,
      sodium: food.nf_sodium?.toString() || null,
      fullNutrients: food.full_nutrients,
      photoUrl: food.photo?.highres || null,
      upc: food.upc || null,
    };
  }

  async isConfigured(): Promise<boolean> {
    // Always return true when using mock data (for E2E tests)
    if (process.env.USE_MOCK_NUTRITIONIX === 'true') {
      return true;
    }
    return !!(this.appId && this.appKey);
  }
}

export const nutritionixAPI = new NutritionixAPI();
