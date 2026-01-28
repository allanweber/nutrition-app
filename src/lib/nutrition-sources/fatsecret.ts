import type { NutritionSource, NutritionSourceFood, NutritionSourceSearchOptions, NutritionSourceSearchResult } from './types';
import { logSourceError, logSourceRequest, logSourceResponse, newRequestId } from './http-logging';

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
  // Some FatSecret endpoints/versions return a different envelope.
  foods?: {
    food?: FatSecretFoodItem | FatSecretFoodItem[];
    results?: {
      food?: FatSecretFoodItem | FatSecretFoodItem[];
    };
    page_number?: string | number;
    max_results?: string | number;
    total_results?: string | number;
  };
};

function asFoodItemArray(value: FatSecretFoodItem | FatSecretFoodItem[] | undefined): FatSecretFoodItem[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

type FatSecretServing = {
  calories?: string | number;
  fat?: string | number;
  carbohydrate?: string | number;
  protein?: string | number;
  // FatSecret may provide both a short measurement description and a richer serving description.
  measurement_description?: string;
  serving_description?: string;
  metric_serving_amount?: string | number;
  metric_serving_unit?: string;
  number_of_units?: string | number;
  fiber?: string | number;
  sugar?: string | number;
  sodium?: string | number;

  // Additional nutrients (commonly present in FatSecret responses)
  cholesterol?: string | number;
  potassium?: string | number;
  saturated_fat?: string | number;
  monounsaturated_fat?: string | number;
  polyunsaturated_fat?: string | number;
  trans_fat?: string | number;
  vitamin_a?: string | number;
  vitamin_c?: string | number;
  calcium?: string | number;
  iron?: string | number;
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

    const requestId = newRequestId('fatsecret');
    const url = 'https://oauth.fatsecret.com/connect/token';
    logSourceRequest('fatsecret', requestId, { method: 'POST', url, note: 'oauth token' });
    const start = Date.now();

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          // Intentionally not logged (redacted by logger even if it were).
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'basic',
        }).toString(),
        cache: 'no-store',
      });
    } catch (error) {
      logSourceError('fatsecret', requestId, {
        method: 'POST',
        url,
        durationMs: Date.now() - start,
        error,
      });
      throw error;
    }

    if (!response.ok) {
      logSourceResponse('fatsecret', requestId, {
        method: 'POST',
        url,
        status: response.status,
        durationMs: Date.now() - start,
      });
      throw new Error(`FatSecret token request failed: ${response.status}`);
    }

    const data = (await response.json()) as FatSecretTokenResponse;

    logSourceResponse('fatsecret', requestId, {
      method: 'POST',
      url,
      status: response.status,
      durationMs: Date.now() - start,
      body: {
        token_type: data.token_type,
        expires_in: data.expires_in,
      },
    });

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

  const requestId = newRequestId('fatsecret');
  logSourceRequest('fatsecret', requestId, { method: 'GET', url: url.toString(), note: path });
  const start = Date.now();

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
  } catch (error) {
    logSourceError('fatsecret', requestId, {
      method: 'GET',
      url: url.toString(),
      durationMs: Date.now() - start,
      error,
    });
    throw error;
  }

  if (response.status === 401) {
    logSourceResponse('fatsecret', requestId, {
      method: 'GET',
      url: url.toString(),
      status: response.status,
      durationMs: Date.now() - start,
    });

    tokenCache = null;
    const retryToken = await getAccessToken();

    const retryRequestId = newRequestId('fatsecret');
    logSourceRequest('fatsecret', retryRequestId, {
      method: 'GET',
      url: url.toString(),
      note: `${path} (retry after 401)`,
    });
    const retryStart = Date.now();

    let retryResponse: Response;
    try {
      retryResponse = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${retryToken}` },
        cache: 'no-store',
      });
    } catch (error) {
      logSourceError('fatsecret', retryRequestId, {
        method: 'GET',
        url: url.toString(),
        durationMs: Date.now() - retryStart,
        error,
      });
      throw error;
    }

    if (!retryResponse.ok) {
      logSourceResponse('fatsecret', retryRequestId, {
        method: 'GET',
        url: url.toString(),
        status: retryResponse.status,
        durationMs: Date.now() - retryStart,
      });
      throw new Error(`FatSecret API call failed: ${retryResponse.status}`);
    }

    const json = await retryResponse.json();
    logSourceResponse('fatsecret', retryRequestId, {
      method: 'GET',
      url: url.toString(),
      status: retryResponse.status,
      durationMs: Date.now() - retryStart,
      body: json,
    });
    return json;
  }

  if (!response.ok) {
    logSourceResponse('fatsecret', requestId, {
      method: 'GET',
      url: url.toString(),
      status: response.status,
      durationMs: Date.now() - start,
    });
    throw new Error(`FatSecret API call failed: ${response.status}`);
  }

  const json = await response.json();
  logSourceResponse('fatsecret', requestId, {
    method: 'GET',
    url: url.toString(),
    status: response.status,
    durationMs: Date.now() - start,
    body: json,
  });
  return json;
}

function toFood(item: FatSecretFoodItem): NutritionSourceFood | null {
  const id = item?.food_id ? String(item.food_id) : undefined;
  const name = item?.food_name;
  if (!id || !name) return null;

  const foodType = (item?.food_type ?? '').toLowerCase().trim();
  // FatSecret uses food_type like "Generic" / "Brand". "Generic" should be treated as a common food.
  const brand = foodType === 'generic' ? null : (item?.brand_name ?? null);

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

const FATSECRET_FULL_NUTRIENT_ATTR_IDS: Record<string, number> = {
  cholesterol: 601,
  potassium: 306,
  saturated_fat: 606,
  monounsaturated_fat: 645,
  polyunsaturated_fat: 646,
  trans_fat: 605,
  vitamin_a: 318,
  vitamin_c: 401,
  calcium: 301,
  iron: 303,
};

function buildFullNutrients(serving: FatSecretServing): Array<{ attr_id: number; value: number }> {
  const excluded = new Set([
    'calories',
    'fat',
    'carbohydrate',
    'protein',
    'fiber',
    'sugar',
    'sodium',
  ]);

  const result: Array<{ attr_id: number; value: number }> = [];
  for (const [key, attrId] of Object.entries(FATSECRET_FULL_NUTRIENT_ATTR_IDS)) {
    if (excluded.has(key)) continue;
    const value = num((serving as Record<string, unknown>)[key]);
    if (value === undefined) continue;
    result.push({ attr_id: attrId, value });
  }

  return result;
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
  const servingUnit = chosen.serving_description ?? chosen.measurement_description ?? 'serving';

  const calories = num(chosen.calories) ?? 0;
  const fat = num(chosen.fat) ?? 0;
  const carbs = num(chosen.carbohydrate) ?? 0;
  const protein = num(chosen.protein) ?? 0;
  const fiber = num(chosen.fiber);
  const sugar = num(chosen.sugar);
  const sodium = num(chosen.sodium);

  const fullNutrients = buildFullNutrients(chosen);

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
    fiber,
    sugar,
    sodium,
    fullNutrients: fullNutrients.length > 0 ? fullNutrients : undefined,
  };

  const altMeasures: FatSecretAltMeasure[] = [];
  let seq = 1;
  for (const s of servings) {
    // Persist all alternative servings except the canonical 100g metric entry.
    if (s === chosen || looksLike100gServing(s)) continue;
    const grams = servingWeightGrams(s);
    if (!grams || grams <= 0) continue;
    altMeasures.push({
      servingWeight: grams,
      // Prefer serving_description for UI-friendly labels; fallback to measurement_description.
      measure: s.serving_description ?? s.measurement_description ?? 'serving',
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

    const list =
      data?.foods_search?.results?.food ??
      data?.foods?.results?.food ??
      data?.foods?.food;

    const items = asFoodItemArray(list);

    const foods = items
      .map(toFood)
      .filter((f): f is NutritionSourceFood => Boolean(f));

    return { foods, source: this.name, cached: false };
  }
}

export const fatSecretSource = new FatSecretSource();
