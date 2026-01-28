import type { NutritionSource, NutritionSourceFood, NutritionSourceSearchOptions, NutritionSourceSearchResult } from './types';

const FOODS: NutritionSourceFood[] = [
  {
    sourceId: 'usda_apple_1',
    source: 'usda',
    name: 'Apple, raw',
    brandName: null,
    servingQty: 1,
    servingUnit: 'medium',
    servingWeightGrams: 182,
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
    fiber: 4.4,
    sugar: 19,
    sodium: 2,
    isRaw: true,
  },
  {
    sourceId: 'fs_cheerios_1',
    source: 'fatsecret',
    name: 'Cheerios',
    brandName: 'General Mills',
    servingQty: 100,
    servingUnit: 'g',
    servingWeightGrams: 100,
    calories: 367,
    protein: 13,
    carbs: 78,
    fat: 6,
    fiber: 10,
    sugar: 7,
    sodium: 700,
  },
  {
    sourceId: 'fs_chicken_1',
    source: 'fatsecret',
    name: 'Chicken Breast',
    brandName: null,
    servingQty: 100,
    servingUnit: 'g',
    servingWeightGrams: 100,
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
  },
];

function searchFoods(query: string, source: NutritionSourceFood['source']): NutritionSourceFood[] {
  const q = query.toLowerCase().trim();
  return FOODS.filter(
    (f) =>
      f.source === source &&
      (f.name.toLowerCase().includes(q) || (f.brandName ?? '').toLowerCase().includes(q)),
  );
}

class MockSource implements NutritionSource {
  constructor(readonly name: NutritionSourceFood['source']) {}

  isConfigured(): boolean {
    return true;
  }

  async search(query: string, options?: NutritionSourceSearchOptions): Promise<NutritionSourceSearchResult> {
    const page = options?.page ?? 0;
    const pageSize = options?.pageSize ?? 25;

    const all = searchFoods(query, this.name);
    const start = page * pageSize;

    return {
      foods: all.slice(start, start + pageSize),
      source: this.name,
      cached: false,
    };
  }
}

export function createMockSources(): NutritionSource[] {
  return [
    new MockSource('fatsecret'),
    new MockSource('usda'),
  ];
}
