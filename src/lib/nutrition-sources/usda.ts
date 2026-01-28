import type { NutritionSource, NutritionSourceFood, NutritionSourceSearchOptions, NutritionSourceSearchResult } from './types';

type USDAFoodNutrient = {
  nutrientName?: string;
  unitName?: string;
  value?: number;
};

type USDAFoodSearchItem = {
  fdcId: number;
  description?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: USDAFoodNutrient[];
  dataType?: string;
};

type USDAFoodSearchResponse = {
  foods?: USDAFoodSearchItem[];
};

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function getNutrient(food: USDAFoodSearchItem, name: string): number | undefined {
  const nutrients = food.foodNutrients ?? [];
  const match = nutrients.find((n) => (n.nutrientName ?? '').toLowerCase() === name.toLowerCase());
  const value = asNumber(match?.value);
  return value;
}

function getCalories(food: USDAFoodSearchItem): number | undefined {
  // USDA sometimes labels calories as "Energy" in KCAL.
  const nutrients = food.foodNutrients ?? [];
  const energy = nutrients.find((n) => (n.nutrientName ?? '').toLowerCase() === 'energy');
  if (!energy) return undefined;

  const value = asNumber(energy.value);
  if (!value) return undefined;

  const unit = (energy.unitName ?? '').toLowerCase();
  if (unit === 'kcal') return value;
  if (unit === 'kj') return value / 4.184;

  return value;
}

export class USDAFoodDataCentralSource implements NutritionSource {
  readonly name = 'usda' as const;

  isConfigured(): boolean {
    return !!process.env.USDA_API_KEY;
  }

  async search(query: string, options?: NutritionSourceSearchOptions): Promise<NutritionSourceSearchResult> {
    if (!this.isConfigured()) {
      return { foods: [], source: this.name, cached: false };
    }

    const page = options?.page ?? 0;
    const pageSize = options?.pageSize ?? 25;

    const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
    url.searchParams.set('api_key', process.env.USDA_API_KEY!);
    url.searchParams.set('query', query);
    url.searchParams.set('pageSize', String(pageSize));
    url.searchParams.set('pageNumber', String(page + 1));
    url.searchParams.set('dataType', 'Foundation');

    const response = await fetch(url.toString(), {
      // Keep request server-side only.
      cache: 'no-store',
    });

    if (!response.ok) {
      // Graceful degradation: return empty list.
      return { foods: [], source: this.name, cached: false };
    }

    const data = (await response.json()) as USDAFoodSearchResponse;
    const foods = (data.foods ?? []).map((item): NutritionSourceFood => {
      const servingSize = asNumber(item.servingSize);
      const servingUnit = item.servingSizeUnit || 'g';

      const calories = getCalories(item) ?? 0;
      const protein = getNutrient(item, 'Protein') ?? 0;
      const carbs = getNutrient(item, 'Carbohydrate, by difference') ?? 0;
      const fat = getNutrient(item, 'Total lipid (fat)') ?? 0;
      const fiber = getNutrient(item, 'Fiber, total dietary');
      const sugar = getNutrient(item, 'Sugars, total including NLEA');
      const sodium = getNutrient(item, 'Sodium, Na');

      const servingQty = servingSize ?? 100;

      const servingWeightGrams =
        servingUnit.toLowerCase() === 'g'
          ? servingQty
          : undefined;

      return {
        sourceId: String(item.fdcId),
        source: 'usda',
        name: item.description || 'Unknown food',
        brandName: item.brandName || null,
        servingQty,
        servingUnit,
        servingWeightGrams,
        calories,
        protein,
        carbs,
        fat,
        fiber,
        sugar,
        sodium,
        isRaw: (item.dataType ?? '').toLowerCase().includes('foundation'),
      };
    });

    return { foods, source: this.name, cached: false };
  }
}

export const usdaSource = new USDAFoodDataCentralSource();
