'use client';

import { useState, useCallback, useRef, useEffect, startTransition } from 'react';
import { useFoodSearchQuery, usePublicFoodSearchQuery } from '@/queries/foods';
import { useCustomFoodSearchQuery } from '@/queries/custom-foods';
import type { FoodSearchState, UnifiedFoodSearchResultItem } from '@/components/food-search-field/types';

interface UseFoodSearchOptions {
  includeCustom: boolean;
  anonymous?: boolean;
}

interface UseFoodSearchReturn extends FoodSearchState {
  setQuery: (newQuery: string) => void;
  loadMore: () => void;
  hasCustomResults: boolean;
}

export function useFoodSearch({ includeCustom, anonymous = false }: UseFoodSearchOptions): UseFoodSearchReturn {
  const [query, setQueryRaw] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback((newQuery: string) => {
    setQueryRaw(newQuery);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(newQuery);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const authedQuery = useFoodSearchQuery(debouncedQuery, page);
  const publicQuery = usePublicFoodSearchQuery(debouncedQuery, page);
  const fatsecretQuery = anonymous ? publicQuery : authedQuery;
  const customQuery = useCustomFoodSearchQuery(debouncedQuery, includeCustom);

  const loadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  // Accumulate fatsecret results across pages; reset when query changes.
  const [accumulatedFatsecretItems, setAccumulatedFatsecretItems] = useState<UnifiedFoodSearchResultItem[]>([]);
  const lastDebouncedQueryRef = useRef(debouncedQuery);

  useEffect(() => {
    if (!fatsecretQuery.data) return;
    const newItems: UnifiedFoodSearchResultItem[] = fatsecretQuery.data.results.map((r) => ({
      id: r.id,
      fatSecretId: r.fatSecretId,
      name: r.name,
      brandName: r.brandName,
      foodType: r.foodType,
      thumbnail: r.thumbnail,
      calories: r.calories,
    }));
    if (debouncedQuery !== lastDebouncedQueryRef.current) {
      lastDebouncedQueryRef.current = debouncedQuery;
      startTransition(() => setAccumulatedFatsecretItems(() => newItems));
    } else {
      startTransition(() => setAccumulatedFatsecretItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.fatSecretId ?? i.id));
        const fresh = newItems.filter((i) => !existingIds.has(i.fatSecretId ?? i.id));
        return page === 1 ? newItems : [...prev, ...fresh];
      }));
    }
  }, [fatsecretQuery.data, debouncedQuery, page]);

  const customResults = customQuery.data?.results ?? [];
  const customItems: UnifiedFoodSearchResultItem[] = customResults.map((r) => ({
    id: 'id' in r ? (r as { id: string | null }).id : null,
    fatSecretId: null,
    name: r.name,
    brandName: r.brandName,
    foodType: 'Custom' as const,
    thumbnail: r.thumbnail,
    calories: r.calories,
    itemKind: ('itemKind' in r ? (r as { itemKind: 'food' | 'dish' }).itemKind : 'food') as 'food' | 'dish',
    dishId: 'dishId' in r ? (r as { dishId?: string }).dishId : undefined,
  }));

  const results: UnifiedFoodSearchResultItem[] = [...accumulatedFatsecretItems, ...customItems];

  const isPending = query !== debouncedQuery;
  const isLoadingMore = page > 1 && fatsecretQuery.isLoading && accumulatedFatsecretItems.length > 0;
  const isLoading = isPending || (fatsecretQuery.isLoading && !isLoadingMore) || (includeCustom && customQuery.isLoading);
  const error =
    (fatsecretQuery.error ? (fatsecretQuery.error as Error).message : null) ??
    (includeCustom && customQuery.error ? (customQuery.error as Error).message : null);

  const pagination = fatsecretQuery.data?.pagination;
  const hasMore = pagination
    ? accumulatedFatsecretItems.length < pagination.totalResults
    : false;

  const hasCustomResults = customItems.length > 0;

  return {
    query,
    results,
    isLoading,
    isLoadingMore,
    isPending,
    error,
    hasMore,
    page,
    setQuery,
    loadMore,
    hasCustomResults,
  };
}
