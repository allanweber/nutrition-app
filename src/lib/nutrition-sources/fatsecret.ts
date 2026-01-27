import type { NutritionSource, NutritionSourceFood, NutritionSourceSearchResult } from './types';

type FatSecretTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type FatSecretFoodItem = {
  food_id?: string | number;
  food_name?: string;
  brand_name?: string;
  food_type?: string;
  food_description?: string;
};

type FatSecretFoodsSearchResponse = {
  foods?: {
    food?: FatSecretFoodItem | FatSecretFoodItem[];
  };
};

type FatSecretBarcodeLookupResponse = {
  food_id?: string | number;
};

type FatSecretServing = {
  calories?: string | number;
  fat?: string | number;
  carbohydrate?: string | number;
  protein?: string | number;
  measurement_description?: string;
  metric_serving_amount?: string | number;
};

type FatSecretFoodGetResponse = {
  food?: {
    food_name?: string;
    brand_name?: string;
    servings?: {
      serving?: FatSecretServing | FatSecretServing[];
    };
  };
};

let tokenCache: { token: string; expiresAt: number } | null = null;
let tokenInFlight: Promise<string> | null = null;

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function parseDescriptionMacros(description: string): {
  calories?: number;
  fat?: number;
  carbs?: number;
  protein?: number;
} {
  // Examples can vary, so keep parsing permissive.
  const calories = /calories\s*:?\s*([0-9.]+)\s*kcal/i.exec(description)?.[1];
  const fat = /fat\s*:?\s*([0-9.]+)\s*g/i.exec(description)?.[1];
  const carbs = /carbs\s*:?\s*([0-9.]+)\s*g/i.exec(description)?.[1];
  const protein = /protein\s*:?\s*([0-9.]+)\s*g/i.exec(description)?.[1];

  return {
    calories: calories ? Number(calories) : undefined,
    fat: fat ? Number(fat) : undefined,
    carbs: carbs ? Number(carbs) : undefined,
    protein: protein ? Number(protein) : undefined,
  };
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  if (tokenInFlight) return tokenInFlight;

  tokenInFlight = (async () => {
    const clientId = process.env.FATSECRET_CLIENT_ID;
    const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('FatSecret credentials not configured');
    }

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'basic',
      }).toString(),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`FatSecret token request failed: ${response.status}`);
    }

    const data = (await response.json()) as FatSecretTokenResponse;

    const expiresAt = Date.now() + (data.expires_in - 60) * 1000; // refresh 1m early
    tokenCache = { token: data.access_token, expiresAt };
    return data.access_token;
  })();

  try {
    return await tokenInFlight;
  } finally {
    tokenInFlight = null;
  }
}

async function fatSecretApiCall(params: Record<string, string>): Promise<unknown> {
  const token = await getAccessToken();

  const url = new URL('https://platform.fatsecret.com/rest/server.api');
  for (const [key, value] of Object.entries({ format: 'json', ...params })) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (response.status === 401) {
    // Refresh token once.
    tokenCache = null;
    const retryToken = await getAccessToken();
    const retryResponse = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${retryToken}` },
      cache: 'no-store',
    });
    if (!retryResponse.ok) {
      throw new Error(`FatSecret API call failed: ${retryResponse.status}`);
    }
    return retryResponse.json();
  }

  if (!response.ok) {
    throw new Error(`FatSecret API call failed: ${response.status}`);
  }

  return response.json();
}

function toFood(item: FatSecretFoodItem): NutritionSourceFood | null {
  const id = item?.food_id ? String(item.food_id) : undefined;
  const name = item?.food_name;
  if (!id || !name) return null;

  const brand = item?.brand_name ?? item?.food_type ?? null;

  const desc = item?.food_description ?? '';
  const parsed = parseDescriptionMacros(desc);

  return {
    sourceId: id,
    source: 'fatsecret',
    name,
    brandName: typeof brand === 'string' ? brand : null,
    servingQty: 100,
    servingUnit: 'g',
    servingWeightGrams: 100,
    calories: parsed.calories ?? 0,
    protein: parsed.protein ?? 0,
    carbs: parsed.carbs ?? 0,
    fat: parsed.fat ?? 0,
  };
}

export class FatSecretSource implements NutritionSource {
  readonly name = 'fatsecret' as const;

  isConfigured(): boolean {
    return !!(process.env.FATSECRET_CLIENT_ID && process.env.FATSECRET_CLIENT_SECRET);
  }

  async search(query: string): Promise<NutritionSourceSearchResult> {
    if (!this.isConfigured()) {
      return { foods: [], source: this.name, cached: false };
    }

    const data = (await fatSecretApiCall({
      method: 'foods.search',
      search_expression: query,
      max_results: '25',
      page_number: '0',
    })) as FatSecretFoodsSearchResponse;

    const list = data?.foods?.food;
    const items: FatSecretFoodItem[] = Array.isArray(list) ? list : list ? [list] : [];

    const foods = items
      .map(toFood)
      .filter((f): f is NutritionSourceFood => Boolean(f));

    return { foods, source: this.name, cached: false };
  }

  async getByBarcode(barcode: string): Promise<NutritionSourceFood | null> {
    if (!this.isConfigured()) return null;

    const lookup = (await fatSecretApiCall({
      method: 'food.find_id_for_barcode',
      barcode,
    })) as FatSecretBarcodeLookupResponse;

    const foodId = lookup?.food_id ? String(lookup.food_id) : undefined;
    if (!foodId) return null;

    const foodData = (await fatSecretApiCall({
      method: 'food.get',
      food_id: foodId,
    })) as FatSecretFoodGetResponse;

    const item = foodData.food;

    const name = item?.food_name;
    if (!name) return null;

    // Prefer parsed macros if available, else fall back to zeros.
    const serving = item?.servings?.serving;
    const servingObj: FatSecretServing | undefined = Array.isArray(serving)
      ? serving[0]
      : serving;

    const calories = num(servingObj?.calories) ?? 0;
    const fat = num(servingObj?.fat) ?? 0;
    const carbs = num(servingObj?.carbohydrate) ?? 0;
    const protein = num(servingObj?.protein) ?? 0;

    return {
      sourceId: foodId,
      source: 'fatsecret',
      name,
      brandName: item?.brand_name ?? null,
      servingQty: 1,
      servingUnit: servingObj?.measurement_description ?? 'serving',
      servingWeightGrams: num(servingObj?.metric_serving_amount),
      calories,
      protein,
      carbs,
      fat,
      barcode,
    };
  }
}

export const fatSecretSource = new FatSecretSource();
