'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { useQueries } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select,  SelectContent,  SelectItem,  SelectTrigger,  SelectValue,} from '@/components/ui/select';
import { Loader2, SearchX } from 'lucide-react';
import { FOOD_IMAGE_QUERY_KEY,  fetchFoodImageUrl,  useInfiniteFoodSearchQuery,  usePersistSelectedFoodMutation,} from '@/queries/foods';

import type { NutritionSourceFood, SearchAggregatorResult } from '@/lib/nutrition-sources/types';
import { FoodSearchTab, MacroSummary } from './types';
import { FoodOption } from './food-option';

const EMPTY_FOODS: NutritionSourceFood[] = [];

function SearchTabs({
  activeTab,
  onTabChange,
  commonCount,
  brandedCount,
  customCount,
}: {
  activeTab: FoodSearchTab;
  onTabChange: (tab: FoodSearchTab) => void;
  commonCount: number;
  brandedCount: number;
  customCount: number;
}) {
  return (
    <div className="border-b bg-muted/40 p-3">
      <div className="sm:hidden">
        <Select
          value={activeTab}
          onValueChange={(value) => onTabChange(value as FoodSearchTab)}
        >
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="common">Common ({commonCount})</SelectItem>
            <SelectItem value="branded">Branded ({brandedCount})</SelectItem>
            <SelectItem value="custom">Custom ({customCount})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="hidden w-full gap-1 rounded-lg bg-muted p-1 sm:flex">
        <button
          type="button"
          className={`flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'common'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onTabChange('common')}
        >
          <span>Common</span>
          <span
            className={`ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ${
              activeTab === 'common'
                ? 'bg-muted text-foreground'
                : 'bg-background/70 text-muted-foreground'
            }`}
          >
            {commonCount}
          </span>
        </button>

        <button
          type="button"
          className={`flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'branded'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onTabChange('branded')}
        >
          <span>Branded</span>
          <span
            className={`ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ${
              activeTab === 'branded'
                ? 'bg-muted text-foreground'
                : 'bg-background/70 text-muted-foreground'
            }`}
          >
            {brandedCount}
          </span>
        </button>

        <button
          type="button"
          className={`flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'custom'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onTabChange('custom')}
        >
          <span>Custom</span>
          <span
            className={`ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ${
              activeTab === 'custom'
                ? 'bg-muted text-foreground'
                : 'bg-background/70 text-muted-foreground'
            }`}
          >
            {customCount}
          </span>
        </button>
      </div>
    </div>
  );
}

function SearchInputWithBadge({
  inputRef,
  query,
  setQuery,
  showDropdown,
  onFocus,
  onKeyDown,
  activeOptionId,
  children,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  setQuery: (value: string) => void;
  showDropdown: boolean;
  onFocus: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  activeOptionId?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative rounded-xl bg-border/60 p-[1px] transition-colors focus-within:bg-gradient-to-r focus-within:from-green-500/35 focus-within:via-emerald-500/25 focus-within:to-green-500/35">
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 sm:block">
          <span className="inline-flex h-10 items-center rounded-full bg-green-600 px-5 text-sm font-semibold text-white shadow-sm">
            Search Foods
          </span>
        </div>

        <Input
          ref={inputRef}
          placeholder="Search for your favorite food or meal"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          className="h-16 w-full rounded-[11px] border-0 bg-background pl-4 pr-6 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-transparent focus-visible:shadow-none sm:pl-[160px]"
          data-testid="food-search-input"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? 'food-search-listbox' : undefined}
          aria-activedescendant={activeOptionId}
        />

        {children}
      </div>
    </div>
  );
}

interface FoodSearchProps {
  onAddFood: (payload: {
    food: NutritionSourceFood;
    quantity: string;
    servingUnit: string;
    grams: number;
    macros: MacroSummary;
  }) => void | Promise<void>;
  onAdded?: () => void;
  pageSize?: number;
}

export default function FoodSearch({
  ...props
}: FoodSearchProps) {
  const { pageSize = 25 } = props;
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFood, setSelectedFood] = useState<NutritionSourceFood | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FoodSearchTab>('common');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const persistMutation = usePersistSelectedFoodMutation();

  const setQueryValue = (value: string) => {
    setQuery(value);
    setHighlightIndex(0);
    setError(null);
  };

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setHasSearched(false);
      setDebouncedQuery('');
    }

    if (trimmed.length < 3) {
      setHasSearched(false);
      setDebouncedQuery('');
      return;
    }

    const timeout = setTimeout(() => {
      setHasSearched(true);
      setDebouncedQuery(trimmed);
      setIsOpen(true);
    }, 500);

    return () => clearTimeout(timeout);
  }, [query]);

  const searchQueryHook = useInfiniteFoodSearchQuery(debouncedQuery, pageSize);

  const mergedSearchResults = useMemo(():
    | SearchAggregatorResult
    | undefined => {
    const pages = searchQueryHook.data?.pages ?? [];
    if (pages.length === 0) return undefined;

    const normalizeKey = (food: NutritionSourceFood) =>
      `${food.source}:${food.sourceId}:${(food.name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')}:${(
        food.brandName ?? ''
      )
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')}`;

    const seen = new Set<string>();
    const mergedFoods: NutritionSourceFood[] = [];

    for (const p of pages) {
      for (const food of p.foods) {
        const key = normalizeKey(food);
        if (seen.has(key)) continue;
        seen.add(key);
        mergedFoods.push(food);
      }
    }

    const last = pages[pages.length - 1];

    return {
      ...last,
      foods: mergedFoods,
      hasMore: Boolean(searchQueryHook.hasNextPage),
      pageSize,
    };
  }, [pageSize, searchQueryHook.data, searchQueryHook.hasNextPage]);

  const foodUrlsNeedingImages = useMemo(() => {
    const foods = mergedSearchResults?.foods ?? [];
    const urls: string[] = [];
    const seen = new Set<string>();

    for (const food of foods) {
      const url = (food.foodUrl ?? '').trim();
      if (!url) continue;
      if (food.photo?.thumb || food.photo?.highres) continue;
      if (seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
      if (urls.length >= 20) break;
    }

    return urls;
  }, [mergedSearchResults?.foods]);

  const foodImageQueries = useQueries({
    queries: foodUrlsNeedingImages.map((foodUrl) => ({
      queryKey: FOOD_IMAGE_QUERY_KEY(foodUrl),
      queryFn: () => fetchFoodImageUrl(foodUrl),
      enabled: debouncedQuery.trim().length >= 3,
      staleTime: 30 * 24 * 60 * 60 * 1000,
      gcTime: 30 * 24 * 60 * 60 * 1000,
      retry: 1,
    })),
  });

  const enrichedSearchResults = useMemo(() => {
    if (!mergedSearchResults) return undefined;
    if (foodUrlsNeedingImages.length === 0) return mergedSearchResults;

    const urlToImage = new Map<string, string>();
    for (let i = 0; i < foodUrlsNeedingImages.length; i += 1) {
      const url = foodUrlsNeedingImages[i];
      const imageUrl = foodImageQueries[i]?.data;
      if (typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
        urlToImage.set(url, imageUrl);
      }
    }

    if (urlToImage.size === 0) return mergedSearchResults;

    return {
      ...mergedSearchResults,
      foods: mergedSearchResults.foods.map((food) => {
        if (food.photo?.thumb || food.photo?.highres) return food;
        const url = (food.foodUrl ?? '').trim();
        const imageUrl = url ? urlToImage.get(url) : undefined;
        if (!imageUrl) return food;
        return {
          ...food,
          photo: {
            thumb: imageUrl,
            highres: imageUrl,
          },
        };
      }),
    };
  }, [foodImageQueries, foodUrlsNeedingImages, mergedSearchResults]);

  const isSearching =
    searchQueryHook.isFetching &&
    !searchQueryHook.isFetchingNextPage &&
    !searchQueryHook.data;
  const isLoadingMore = searchQueryHook.isFetchingNextPage;

  const searchError = useMemo(() => {
    if (debouncedQuery.trim().length < 3) return null;
    if (!searchQueryHook.isError) return null;
    return searchQueryHook.error instanceof Error
      ? searchQueryHook.error.message
      : 'Food search failed.';
  }, [debouncedQuery, searchQueryHook.error, searchQueryHook.isError]);

  const displayError = error ?? searchError;

  const foods = enrichedSearchResults?.foods ?? EMPTY_FOODS;
  const hasMore = Boolean(searchQueryHook.hasNextPage);

  const commonFoods = useMemo(
    () =>
      foods.filter(
        (food) =>
          !food.isCustom &&
          food.source !== 'database' &&
          !food.brandName?.trim(),
      ),
    [foods],
  );
  const brandedFoods = useMemo(
    () =>
      foods.filter(
        (food) =>
          !food.isCustom &&
          food.source !== 'database' &&
          Boolean(food.brandName?.trim()),
      ),
    [foods],
  );
  const customFoods = useMemo(
    () => foods.filter((food) => food.isCustom || food.source === 'database'),
    [foods],
  );

  const foodsForTab = useMemo(() => {
    switch (activeTab) {
      case 'common':
        return commonFoods;
      case 'branded':
        return brandedFoods;
      case 'custom':
        return customFoods;
      default:
        return commonFoods;
    }
  }, [activeTab, commonFoods, brandedFoods, customFoods]);

  const activeTabLabel = useMemo(() => {
    switch (activeTab) {
      case 'common':
        return 'Common';
      case 'branded':
        return 'Branded';
      case 'custom':
        return 'Custom';
      default:
        return 'Common';
    }
  }, [activeTab]);

  const emptyContent = useMemo(() => {
    if (
      !isSearching &&
      hasSearched &&
      foods.length > 0 &&
      foodsForTab.length === 0
    ) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <p className="text-sm text-muted-foreground">
            No foods for {activeTabLabel} category
          </p>
        </div>
      );
    }
    if (isSearching) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Searching...</p>
        </div>
      );
    }
    if (hasSearched && foods.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <SearchX className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No results found. Try a different search term.
          </p>
        </div>
      );
    }

    return null;
  }, [isSearching, hasSearched, foods.length, foodsForTab.length, activeTabLabel]);

  const showPanel =
    isOpen && (selectedFood !== null || query.trim().length >= 3);
  const showDropdown = showPanel && !selectedFood && query.trim().length >= 3;

  const activeOptionId = useMemo(() => {
    if (!showDropdown) return undefined;
    const activeFood = foodsForTab[highlightIndex];
    if (!activeFood) return undefined;
    return `food-option-${activeFood.source}-${activeFood.sourceId}`;
  }, [foodsForTab, highlightIndex, showDropdown]);

  const selectFood = (food: NutritionSourceFood) => {
    setSelectedFood(food);
    setError(null);
    setIsOpen(true);
    setHighlightIndex(0);

    persistMutation.mutate(food, {
      onSuccess: (persisted) => {
        setSelectedFood(persisted);
      },
      onError: (err) => {
        console.error('Error persisting food:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load food details.',
        );
      },
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showPanel) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      setSelectedFood(null);
      setQueryValue('');
      setIsOpen(false);
      setHighlightIndex(0);
    }
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Search Input */}
      <div className="space-y-1">
        <SearchInputWithBadge
          inputRef={inputRef}
          query={query}
          setQuery={setQueryValue}
          showDropdown={showDropdown}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          activeOptionId={activeOptionId}
        >
          {showPanel && (
            <div
              className="absolute top-full left-0 right-0 mt-2 overflow-hidden rounded-3xl border bg-search-results shadow-lg z-50"
              data-testid="search-results"
            >
                <>
                  <SearchTabs
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                      setActiveTab(tab);
                      setHighlightIndex(0);
                      listRef.current?.scrollTo({ top: 0 });
                    }}
                    commonCount={commonFoods.length}
                    brandedCount={brandedFoods.length}
                    customCount={customFoods.length}
                  />

                  <div
                    ref={listRef}
                    id="food-search-listbox"
                    role="listbox"
                    aria-label="Food search results"
                    className="max-h-[440px] overflow-y-auto p-3"
                  >
                    {emptyContent}
                    {!isSearching &&
                      foodsForTab.map((food, index) => (
                        <FoodOption
                          key={`${food.source}-${food.sourceId}`}
                          food={food}
                          index={index}
                          highlightIndex={highlightIndex}
                          setHighlightIndex={setHighlightIndex}
                          selectFood={selectFood}
                        />
                      ))}

                    {hasMore && foodsForTab.length > 0 && (
                      <div className="pt-3">
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => void searchQueryHook.fetchNextPage()}
                          disabled={isLoadingMore || isSearching}
                          className="w-full"
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading more...
                            </>
                          ) : (
                            'Load more'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
            </div>
          )}
        </SearchInputWithBadge>

        {query.trim().length > 0 && query.trim().length < 3 && (
          <div className="mt-1 text-xs text-muted-foreground">
            Type at least 3 characters to search
          </div>
        )}
      </div>

      {/* Error Message */}
      {displayError && (
        <div
          className="rounded-lg bg-red-50 p-3 text-red-600 dark:bg-red-950/30 dark:text-red-400"
          data-testid="error-message"
        >
          {displayError}
        </div>
      )}
    </div>
  );
}
