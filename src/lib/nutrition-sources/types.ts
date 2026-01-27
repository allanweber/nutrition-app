export type NutritionSourceName = 'usda' | 'openfoodfacts' | 'fatsecret' | 'database';

export interface NutritionSourceFood {
  /** Local database id when the food has been persisted */
  id?: number;
  sourceId: string;
  source: NutritionSourceName;
  name: string;
  brandName?: string | null;
  servingQty: number;
  servingUnit: string;
  servingWeightGrams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  photo?: { thumb?: string; highres?: string } | null;
  barcode?: string;
  isRaw?: boolean;
  fullNutrients?: Array<{ attr_id: number; value: number }>;
}

export interface NutritionSourceSearchResult {
  foods: NutritionSourceFood[];
  source: NutritionSourceName;
  cached: boolean;
}

export interface NutritionSource {
  readonly name: NutritionSourceName;
  search(query: string): Promise<NutritionSourceSearchResult>;
  getByBarcode?(barcode: string): Promise<NutritionSourceFood | null>;
  isConfigured(): boolean;
}

export interface SourceStatus {
  name: NutritionSourceName | 'cache' | 'database';
  status: 'success' | 'error' | 'timeout' | 'skipped';
  count: number;
  error?: string;
  durationMs?: number;
}

export interface SearchAggregatorResult {
  foods: NutritionSourceFood[];
  sources: SourceStatus[];
  fromCache: boolean;
}
