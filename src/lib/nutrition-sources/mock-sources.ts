import type { NutritionSource, NutritionSourceFood, NutritionSourceSearchResult } from './types';

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
    sourceId: 'off_cheerios_1',
    source: 'openfoodfacts',
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
    barcode: '0016000275123',
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

function getByBarcode(barcode: string): NutritionSourceFood | null {
  return FOODS.find((f) => f.barcode === barcode) ?? null;
}

class MockSource implements NutritionSource {
  constructor(readonly name: NutritionSourceFood['source']) {}

  isConfigured(): boolean {
    return true;
  }

  async search(query: string): Promise<NutritionSourceSearchResult> {
    return {
      foods: searchFoods(query, this.name),
      source: this.name,
      cached: false,
    };
  }

  async getByBarcode(barcode: string): Promise<NutritionSourceFood | null> {
    return getByBarcode(barcode);
  }
}

export function createMockSources(): NutritionSource[] {
  return [
    new MockSource('usda'),
    new MockSource('openfoodfacts'),
    new MockSource('fatsecret'),
  ];
}

export const MOCK_BARCODES = {
  cheerios: '0016000275123',
};
