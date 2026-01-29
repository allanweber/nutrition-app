/* eslint-disable @next/next/no-img-element */
'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Check, Flame, Beef, Wheat, Droplets } from 'lucide-react';

import type { NutritionSourceFood, SearchAggregatorResult } from '@/lib/nutrition-sources/types';

const EMPTY_FOODS: NutritionSourceFood[] = [];

type FoodSearchTab = 'common' | 'branded' | 'custom';

type Per100g = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium?: number;
};

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
      <div className="flex w-full gap-1 rounded-lg bg-muted p-1">
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

function KeyboardHints() {
  return (
    <div className="mt-3 flex items-center justify-center gap-6 border-t pt-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↑</kbd>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↓</kbd>
        <span>to navigate</span>
      </div>
      <div className="flex items-center gap-2">
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
        <span>to select</span>
      </div>
      <div className="flex items-center gap-2">
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
        <span>to clear</span>
      </div>
    </div>
  );
}

function FoodResultOption({
  food,
  index,
  highlightIndex,
  setHighlightIndex,
  selectFood,
  toPer100g,
}: {
  food: NutritionSourceFood;
  index: number;
  highlightIndex: number;
  setHighlightIndex: (index: number) => void;
  selectFood: (food: NutritionSourceFood) => void;
  toPer100g: (food: NutritionSourceFood) => Per100g | null;
}) {
  const p100 = toPer100g(food);
  const isActive = index === highlightIndex;

  const caloriesValue = p100 ? Math.round(p100.calories) : Math.round(food.calories);
  const proteinValue = (p100 ? p100.protein : Number(food.protein)).toFixed(2);
  const carbsValue = (p100 ? p100.carbs : Number(food.carbs)).toFixed(2);
  const fatValue = (p100 ? p100.fat : Number(food.fat)).toFixed(2);

  const subtitle = (() => {
    const brandName = food.brandName?.trim();
    const servingLabel = p100
      ? '100 g'
      : `${food.servingQty ?? 1}${food.servingUnit ? ` ${food.servingUnit}` : ''}`;

    if (brandName) return `${brandName} · ${servingLabel}`;
    if (p100) return servingLabel;
    return `per serving · ${servingLabel}`;
  })();

  return (
    <button
      id={`food-option-${food.source}-${food.sourceId}`}
      type="button"
      role="option"
      aria-selected={isActive}
      onMouseEnter={() => setHighlightIndex(index)}
      onClick={() => selectFood(food)}
      data-testid={`food-result-${index}`}
      className={`w-full rounded-lg p-3 text-left transition-colors ${
        isActive ? 'bg-muted' : 'hover:bg-muted/60'
      }`}
    >
      <div className="grid grid-cols-[44px_1fr] gap-4">
        <div className="flex items-center justify-center">
          {food.photo?.thumb ? (
            <img
              src={food.photo.thumb}
              alt={food.name}
              className="h-11 w-11 rounded object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-11 w-11 rounded bg-muted" />
          )}
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{food.name}</div>
          <div className="truncate text-xs text-muted-foreground">{subtitle}</div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2.5 py-1.5 text-xs font-medium text-orange-600">
              <Flame className="h-3 w-3" />
              {caloriesValue}kcal
            </div>
            <div className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-600">
              <Beef className="h-3 w-3" />
              {proteinValue}g
            </div>
            <div className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-700">
              <Wheat className="h-3 w-3" />
              {carbsValue}g
            </div>
            <div className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2.5 py-1.5 text-xs font-medium text-rose-700">
              <Droplets className="h-3 w-3" />
              {fatValue}g
            </div>
          </div>
        </div>
      </div>
    </button>
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
        <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2">
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
          className="h-16 w-full rounded-[11px] border-0 bg-background pl-[180px] pr-6 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-transparent focus-visible:shadow-none"
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
  searchResults?: SearchAggregatorResult;
  isSearching?: boolean;
  isLoadingMore?: boolean;
  onSearch: (query: string) => void;
  onAddFood: (food: NutritionSourceFood, quantity: string, mealType: string) => void;
  onLoadMore?: () => void;
}

export default function FoodSearch({
  searchResults,
  isSearching = false,
  isLoadingMore = false,
  onSearch,
  onAddFood,
  onLoadMore,
}: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<NutritionSourceFood | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [mealType, setMealType] = useState<string>('breakfast');
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FoodSearchTab>('common');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const requestedLoadMoreRef = useRef(false);

  const foods = searchResults?.foods ?? EMPTY_FOODS;
  const hasMore = Boolean(searchResults?.hasMore);

  const commonFoods = useMemo(
    () => foods.filter((food) => !food.isCustom && food.source !== 'database' && !food.brandName?.trim()),
    [foods],
  );
  const brandedFoods = useMemo(
    () => foods.filter((food) => !food.isCustom && food.source !== 'database' && Boolean(food.brandName?.trim())),
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

  useEffect(() => {
    // If the currently selected tab has no results, automatically switch to the
    // first tab that does. This keeps the default UX (and E2E flows) working
    // when results are returned from DB/custom sources.
    if (foodsForTab.length > 0) return;

    const nextTab: FoodSearchTab | null =
      commonFoods.length > 0
        ? 'common'
        : brandedFoods.length > 0
          ? 'branded'
          : customFoods.length > 0
            ? 'custom'
            : null;

    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
      setHighlightIndex(0);
    }
  }, [activeTab, brandedFoods.length, commonFoods.length, customFoods.length, foodsForTab.length]);

  const showDropdown = isOpen && !selectedFood && query.trim().length >= 3;

  useEffect(() => {
    if (!addSuccess) return;
    const timeout = setTimeout(() => setAddSuccess(false), 2000);
    return () => clearTimeout(timeout);
  }, [addSuccess]);

  useEffect(() => {
    setHighlightIndex((prev) => {
      if (foodsForTab.length === 0) return 0;
      return Math.min(prev, foodsForTab.length - 1);
    });
  }, [foodsForTab.length]);

  const activeOptionId = useMemo(() => {
    if (!showDropdown) return undefined;
    const activeFood = foodsForTab[highlightIndex];
    if (!activeFood) return undefined;
    return `food-option-${activeFood.source}-${activeFood.sourceId}`;
  }, [foodsForTab, highlightIndex, showDropdown]);

  const toPer100g = (food: NutritionSourceFood): Per100g | null => {
    const grams = food.servingWeightGrams;
    if (!grams || grams <= 0) return null;
    const factor = 100 / grams;

    return {
      calories: Number(food.calories) * factor,
      protein: Number(food.protein) * factor,
      carbs: Number(food.carbs) * factor,
      fat: Number(food.fat) * factor,
      sodium: food.sodium != null ? Number(food.sodium) * factor : undefined,
    };
  };

  const selectFood = (food: NutritionSourceFood) => {
    setSelectedFood(food);
    setError(null);
    setAddSuccess(false);
    setIsOpen(false);
    setHighlightIndex(0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => {
        const next = Math.min(prev + 1, Math.max(foodsForTab.length - 1, 0));
        const nextFood = foodsForTab[next];
        if (nextFood) {
          document.getElementById(`food-option-${nextFood.source}-${nextFood.sourceId}`)?.scrollIntoView({
            block: 'nearest',
          });
        }
        return next;
      });
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        const nextFood = foodsForTab[next];
        if (nextFood) {
          document.getElementById(`food-option-${nextFood.source}-${nextFood.sourceId}`)?.scrollIntoView({
            block: 'nearest',
          });
        }
        return next;
      });
      return;
    }

    if (e.key === 'Enter') {
      if (foodsForTab.length === 0) return;
      e.preventDefault();
      const picked = foodsForTab[highlightIndex];
      if (picked) selectFood(picked);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
      setIsOpen(false);
      setHighlightIndex(0);
    }
  };

  const handleAddFood = async () => {
    if (!selectedFood) return;

    setAdding(true);
    setError(null);
    setAddSuccess(false);

    try {
      const parsedQuantity = Number(quantity);
      if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
        setError('Please enter a valid quantity.');
        return;
      }

      await Promise.resolve(onAddFood(selectedFood, String(parsedQuantity), mealType));

      setAddSuccess(true);
      setSelectedFood(null);
      setQuantity('1');
    } catch (err) {
      console.error('Error adding food:', err);
      setError('Failed to add food. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    const trimmed = query.trim();
    setHighlightIndex(0);

    if (trimmed.length < 3) {
      requestedLoadMoreRef.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      onSearch(trimmed);
      setIsOpen(true);
    }, 500);

    return () => clearTimeout(timeout);
  }, [onSearch, query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!containerRef.current) return;
      if (!containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    requestedLoadMoreRef.current = false;
  }, [activeTab, foods.length, isLoadingMore]);

  useEffect(() => {
    if (!showDropdown) return;
    if (!onLoadMore || !hasMore) return;
    if (isLoadingMore || isSearching) return;

    const root = listRef.current;
    const target = loadMoreSentinelRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (requestedLoadMoreRef.current) return;

        requestedLoadMoreRef.current = true;
        onLoadMore();
      },
      { root, threshold: 0.1 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isSearching, onLoadMore, showDropdown]);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Search Input */}
      <div className="space-y-1">
        <SearchInputWithBadge
          inputRef={inputRef}
          query={query}
          setQuery={setQuery}
          showDropdown={showDropdown}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          activeOptionId={activeOptionId}
        >
          {showDropdown && (
            <div
              className="absolute left-0 top-full z-50 mt-3 w-full overflow-hidden rounded-xl border bg-background shadow-lg"
              data-testid="search-results"
            >
              <SearchTabs
                activeTab={activeTab}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  setHighlightIndex(0);
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
                {isSearching && (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </div>
                )}

                {!isSearching && foodsForTab.length === 0 && (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground" data-testid="empty-state">
                    No foods found. Try different search terms.
                  </div>
                )}

                {!isSearching &&
                  foodsForTab.map((food, index) => (
                    <FoodResultOption
                      key={`${food.source}-${food.sourceId}`}
                      food={food}
                      index={index}
                      highlightIndex={highlightIndex}
                      setHighlightIndex={setHighlightIndex}
                      selectFood={selectFood}
                      toPer100g={toPer100g}
                    />
                  ))}

                {/* Infinite scroll sentinel */}
                <div ref={loadMoreSentinelRef} className="h-1" />

                {onLoadMore && hasMore && (
                  <div className="pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onLoadMore}
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

                <KeyboardHints />
              </div>
            </div>
          )}
        </SearchInputWithBadge>

        {query.trim().length > 0 && query.trim().length < 3 && (
          <div className="mt-1 text-xs text-muted-foreground">Type at least 3 characters to search</div>
        )}
      </div>

      {/* Success Message */}
      {addSuccess && (
        <div className="flex items-center space-x-2 rounded-lg bg-green-50 p-3 text-green-600 dark:bg-green-950/30 dark:text-green-400">
          <Check className="h-4 w-4" />
          <span>Food added successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="rounded-lg bg-red-50 p-3 text-red-600 dark:bg-red-950/30 dark:text-red-400"
          data-testid="error-message"
        >
          {error}
        </div>
      )}

      {/* Loading State (only when dropdown is not shown) */}
      {isSearching && !showDropdown && (
        <div className="flex items-center justify-center py-4 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Searching...
        </div>
      )}

      {/* Selected Food Form */}
      {selectedFood && (
        <Card className="border-2 border-primary bg-primary/10">
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              {selectedFood.photo?.thumb && (
                <img
                  src={selectedFood.photo.thumb}
                  alt={selectedFood.name}
                  className="h-16 w-16 rounded object-cover"
                />
              )}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="text-lg font-medium">{selectedFood.name}</div>
                  {selectedFood.brandName && (
                    <div className="text-sm text-muted-foreground">{selectedFood.brandName}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Quantity</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      data-testid="quantity-input"
                    />
                    <div className="mt-1 text-xs text-muted-foreground">{selectedFood.servingUnit}</div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Meal</label>
                    <Select value={mealType} onValueChange={setMealType}>
                      <SelectTrigger data-testid="meal-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleAddFood}
                    disabled={adding}
                    className="flex-1"
                    data-testid="add-food-button"
                  >
                    {adding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add to Log
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedFood(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty results message (only when dropdown is closed) */}
      {!selectedFood && !showDropdown && query.trim().length >= 3 && !isSearching && foods.length === 0 && (
        <div className="py-8 text-center text-muted-foreground" data-testid="empty-state">
          No foods found. Try different search terms.
        </div>
      )}
    </div>
  );
}
