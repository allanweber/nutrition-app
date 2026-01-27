import type { NutritionSource, NutritionSourceFood, NutritionSourceSearchResult } from './types';

type OFFProduct = {
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  code?: string;
  image_thumb_url?: string;
  image_url?: string;
  nutriments?: Record<string, unknown>;
};

type OFFSearchResponse = {
  products?: OFFProduct[];
};

type OFFBarcodeResponse = {
  status?: number;
  product?: OFFProduct;
};

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function getNutriment(product: OFFProduct, key: string): number | undefined {
  return num(product.nutriments?.[key]);
}

function toFood(product: OFFProduct): NutritionSourceFood | null {
  const name = product.product_name_en || product.product_name;
  if (!name) return null;

  const calories =
    getNutriment(product, 'energy-kcal_100g') ??
    // sometimes only kJ exists
    (getNutriment(product, 'energy-kj_100g') ? (getNutriment(product, 'energy-kj_100g')! / 4.184) : 0);

  const protein = getNutriment(product, 'proteins_100g') ?? 0;
  const carbs = getNutriment(product, 'carbohydrates_100g') ?? 0;
  const fat = getNutriment(product, 'fat_100g') ?? 0;
  const fiber = getNutriment(product, 'fiber_100g');
  const sugar = getNutriment(product, 'sugars_100g');

  // OFF sodium is typically in grams per 100g.
  const sodiumG = getNutriment(product, 'sodium_100g');
  const sodiumMg = sodiumG !== undefined ? sodiumG * 1000 : undefined;

  const barcode = product.code;

  return {
    sourceId: barcode || name,
    source: 'openfoodfacts',
    name,
    brandName: product.brands || null,
    servingQty: 100,
    servingUnit: 'g',
    servingWeightGrams: 100,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sugar,
    sodium: sodiumMg,
    barcode: barcode || undefined,
    photo: product.image_thumb_url || product.image_url ? {
      thumb: product.image_thumb_url,
      highres: product.image_url,
    } : null,
  };
}

export class OpenFoodFactsSource implements NutritionSource {
  readonly name = 'openfoodfacts' as const;

  isConfigured(): boolean {
    return true;
  }

  async search(query: string): Promise<NutritionSourceSearchResult> {
    const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
    url.searchParams.set('search_terms', query);
    url.searchParams.set('search_simple', '1');
    url.searchParams.set('action', 'process');
    url.searchParams.set('json', '1');
    url.searchParams.set('page_size', '25');

    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) {
      return { foods: [], source: this.name, cached: false };
    }

    const data = (await response.json()) as OFFSearchResponse;
    const foods = (data.products ?? [])
      .map(toFood)
      .filter((f): f is NutritionSourceFood => Boolean(f));

    return { foods, source: this.name, cached: false };
  }

  async getByBarcode(barcode: string): Promise<NutritionSourceFood | null> {
    const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;

    const data = (await response.json()) as OFFBarcodeResponse;
    if (data.status !== 1 || !data.product) return null;

    return toFood({ ...data.product, code: barcode });
  }
}

export const openFoodFactsSource = new OpenFoodFactsSource();
