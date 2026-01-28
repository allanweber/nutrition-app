import type { NutritionSourceFood } from './types';

export type SearchCacheEntry = {
  foods: NutritionSourceFood[];
  /** Maximum number of merged/deduped results currently cached for this query. */
  fetchedLimit: number;
};

export class LRUCache<K, V> {
  private cache = new Map<K, { value: V; expiresAt: number }>();

  constructor(
    private readonly maxSize = 1000,
    private readonly ttlMs = 30 * 60 * 1000,
  ) {}

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Mark as recently used
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs });

    if (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value as K | undefined;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Shared cache instance used by the aggregator.
// Key format: `search:<query>`
export const searchCache = new LRUCache<string, SearchCacheEntry>(1000);

// Key format: `barcode:<upc>`
export const barcodeCache = new LRUCache<string, NutritionSourceFood[]>(1000);
