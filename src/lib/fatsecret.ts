import type { FatSecretSearchFood, FatSecretSearchResponse } from '@/types/fatsecret';

const FATSECRET_TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const FATSECRET_SEARCH_URL = 'https://platform.fatsecret.com/rest/foods/search/v5';
const FATSECRET_FOOD_GET_URL = 'https://platform.fatsecret.com/rest/food/v4';

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < cachedToken.expiresAt) {
    return cachedToken.value;
  }
  
  const response = await fetch(FATSECRET_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'premier',
      client_id: process.env.FATSECRET_CONSUMER_KEY!,
      client_secret: process.env.FATSECRET_CONSUMER_SECRET!,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`FatSecret token error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    // Refresh 60 seconds before expiry
    expiresAt: now + (data.expires_in - 60) * 1000,
  };

  return cachedToken.value;
}

export async function searchFoods(
  keyword: string,
  page: number,
): Promise<FatSecretSearchResponse> {
  if (process.env.USE_MOCK_FATSECRET === 'true') {
    const mock = await import('@/lib/__tests__/mock-fatsecret');
    return mock.getMockSearchResponse(keyword, page);
  }

  const token = await getAccessToken();
  const queryString = new URLSearchParams({
    search_expression: keyword,
    include_food_images: 'true',
    page_number: String(page - 1), // FatSecret is 0-based
    max_results: '10',
    format: 'json',
  }).toString();

  const response = await fetch(`${FATSECRET_SEARCH_URL}?${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`FatSecret API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<FatSecretSearchResponse>;
}

interface FatSecretFoodGetResponse {
  food: FatSecretSearchFood;
}

export async function getFoodById(foodId: string): Promise<FatSecretSearchFood> {
  if (process.env.USE_MOCK_FATSECRET === 'true') {
    const mock = await import('@/lib/__tests__/mock-fatsecret');
    return mock.getMockFoodById(foodId);
  }

  const token = await getAccessToken();
  const queryString = new URLSearchParams({
    food_id: foodId,
    include_food_images: 'true',
    format: 'json',
  }).toString();

  const response = await fetch(`${FATSECRET_FOOD_GET_URL}?${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`FatSecret API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as FatSecretFoodGetResponse;
  return data.food;
}
