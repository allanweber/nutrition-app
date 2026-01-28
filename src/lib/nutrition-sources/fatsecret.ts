import type { NutritionSource, NutritionSourceFood, NutritionSourceSearchOptions, NutritionSourceSearchResult } from './types';

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
  food_url?: string;
};

type FatSecretFoodsSearchV1Response = {
  foods_search?: {
    results?: {
      food?: FatSecretFoodItem | FatSecretFoodItem[];
      page_number?: string | number;
      max_results?: string | number;
      total_results?: string | number;
    };
  };
};

type FatSecretServing = {
  calories?: string | number;
  fat?: string | number;
  carbohydrate?: string | number;
  protein?: string | number;
  measurement_description?: string;
  metric_serving_amount?: string | number;
  metric_serving_unit?: string;
  number_of_units?: string | number;
};

type FatSecretFoodGetResponse = {
  food?: {
    food_name?: string;
    brand_name?: string;
    food_url?: string;
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

async function fatSecretRestGet(path: string, params: Record<string, string>): Promise<unknown> {
  const token = await getAccessToken();

  const url = new URL(`https://platform.fatsecret.com/rest/${path}`);
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
    foodUrl: item?.food_url,
    servingQty: 100,
    servingUnit: 'g',
    servingWeightGrams: 100,
    calories: parsed.calories ?? 0,
    protein: parsed.protein ?? 0,
    carbs: parsed.carbs ?? 0,
    fat: parsed.fat ?? 0,
  };
}

export type FatSecretAltMeasure = {
  servingWeight: number;
  measure: string;
  qty: number;
  seq: number;
};

function asServingArray(serving: FatSecretServing | FatSecretServing[] | undefined): FatSecretServing[] {
  if (!serving) return [];
  return Array.isArray(serving) ? serving : [serving];
}

function servingWeightGrams(serving: FatSecretServing): number | undefined {
  const amount = num(serving.metric_serving_amount);
  if (amount === undefined) return undefined;

  const unit = (serving.metric_serving_unit ?? 'g').toLowerCase();
  if (unit === 'g') return amount;
  // FatSecret docs generally use grams; if not, we can't safely convert.
  return amount;
}

function looksLike100gServing(serving: FatSecretServing): boolean {
  const grams = servingWeightGrams(serving);
  if (!grams) return false;
  if (Math.abs(grams - 100) > 0.001) return false;
  const unit = (serving.metric_serving_unit ?? 'g').toLowerCase();
  const measure = (serving.measurement_description ?? '').toLowerCase();
  return unit === 'g' || measure === 'g' || measure.includes('gram');
}

export async function fetchFatSecretFoodDetails(foodId: string): Promise<{
  food: NutritionSourceFood;
  altMeasures: FatSecretAltMeasure[];
}> {
  const data = (await fatSecretRestGet('food/v5', {
    food_id: foodId,
  })) as FatSecretFoodGetResponse;

  const item = data.food;
  const name = item?.food_name;
  if (!name) {
    throw new Error('FatSecret details missing food_name');
  }

  const servings = asServingArray(item?.servings?.serving);
  const chosen = servings.find(looksLike100gServing) ?? servings[0];
  if (!chosen) {
    throw new Error('FatSecret details missing servings');
  }

  const chosenGrams = servingWeightGrams(chosen);
  const servingUnit = chosen.measurement_description ?? 'serving';

  const calories = num(chosen.calories) ?? 0;
  const fat = num(chosen.fat) ?? 0;
  const carbs = num(chosen.carbohydrate) ?? 0;
  const protein = num(chosen.protein) ?? 0;

  const food: NutritionSourceFood = {
    sourceId: foodId,
    source: 'fatsecret',
    name,
    brandName: item?.brand_name ?? null,
    foodUrl: item?.food_url,
    servingQty: looksLike100gServing(chosen) ? 100 : num(chosen.number_of_units) ?? 1,
    servingUnit: looksLike100gServing(chosen) ? 'g' : servingUnit,
    servingWeightGrams: looksLike100gServing(chosen) ? 100 : chosenGrams,
    calories,
    protein,
    carbs,
    fat,
  };

  const altMeasures: FatSecretAltMeasure[] = [];
  let seq = 1;
  for (const s of servings) {
    if (s === chosen) continue;
    const grams = servingWeightGrams(s);
    if (!grams || grams <= 0) continue;
    altMeasures.push({
      servingWeight: grams,
      measure: s.measurement_description ?? 'serving',
      qty: num(s.number_of_units) ?? 1,
      seq,
    });
    seq += 1;
  }

  return { food, altMeasures };
}

export class FatSecretSource implements NutritionSource {
  readonly name = 'fatsecret' as const;

  isConfigured(): boolean {
    return !!(process.env.FATSECRET_CLIENT_ID && process.env.FATSECRET_CLIENT_SECRET);
  }

  async search(query: string, options?: NutritionSourceSearchOptions): Promise<NutritionSourceSearchResult> {
    if (!this.isConfigured()) {
      return { foods: [], source: this.name, cached: false };
    }

    const page = options?.page ?? 0;
    const pageSize = options?.pageSize ?? 25;

    const data = (await fatSecretRestGet('foods/search/v1', {
      search_expression: query,
      max_results: String(pageSize),
      page_number: String(page),
    })) as FatSecretFoodsSearchV1Response;

    const list = data?.foods_search?.results?.food;
    const items: FatSecretFoodItem[] = Array.isArray(list) ? list : list ? [list] : [];

    const foods = items
      .map(toFood)
      .filter((f): f is NutritionSourceFood => Boolean(f));

    return { foods, source: this.name, cached: false };
  }
}

export const fatSecretSource = new FatSecretSource();
