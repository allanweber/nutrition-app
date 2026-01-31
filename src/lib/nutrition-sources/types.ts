export type NutritionSourceName = 'usda' | 'fatsecret' | 'database';

export interface NutritionAltMeasure {
  servingWeight: number;
  measure: string;
  qty: number;
  seq?: number;
}

export interface NutritionSourceFood {
  /** Local database id when the food has been persisted */
  id?: number;
  sourceId: string;
  source: NutritionSourceName;
  name: string;
  brandName?: string | null;
  /** FatSecret provides a canonical URL that can be used for image scraping. */
  foodUrl?: string;
  /** True for user-created/custom foods stored in the database. */
  isCustom?: boolean;
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
  /** Alternative serving sizes (present for persisted foods). */
  altMeasures?: NutritionAltMeasure[];
  isRaw?: boolean;
  fullNutrients?: Array<{ attr_id: number; value: number }>;
}

export interface NutritionSourceSearchResult {
  foods: NutritionSourceFood[];
  source: NutritionSourceName;
  cached: boolean;
  /** When available (e.g. FatSecret), the total number of matching results on the source. */
  totalResults?: number;
}

export interface NutritionSourceSearchOptions {
  page: number;
  pageSize: number;
}

export interface NutritionSource {
  readonly name: NutritionSourceName;
  search(query: string, options?: NutritionSourceSearchOptions): Promise<NutritionSourceSearchResult>;
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
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
  /** Total external results when available (e.g. FatSecret total_results). */
  totalResults?: number;
}
