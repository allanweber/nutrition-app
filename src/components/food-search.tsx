/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Loader2, Check } from 'lucide-react';

import type {
  NutritionSourceFood,
  SearchAggregatorResult,
} from '@/lib/nutrition-sources/types';

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
  const [activeTab, setActiveTab] = useState<'common' | 'branded' | 'custom'>('common');

  const debouncedQueryKey = query.trim();

  const foods = searchResults?.foods ?? [];
  const hasResults = foods.length > 0;
  const hasMore = Boolean(searchResults?.hasMore);

  const hasPhoto = (food: NutritionSourceFood) => Boolean(food.photo?.thumb || food.photo?.highres);

  const toPer100g = (food: NutritionSourceFood) => {
    const grams = food.servingWeightGrams;
    if (!grams || grams <= 0) return null;
    const factor = 100 / grams;
    return {
      calories: food.calories * factor,
      protein: food.protein * factor,
      carbs: food.carbs * factor,
      fat: food.fat * factor,
      sodium: food.sodium !== undefined ? food.sodium * factor : undefined,
    };
  };

  const isCustomFood = (food: NutritionSourceFood) => Boolean(food.isCustom);
  const isBrandedFood = (food: NutritionSourceFood) => !isCustomFood(food) && Boolean((food.brandName ?? '').trim());
  const isCommonFood = (food: NutritionSourceFood) => !isCustomFood(food) && !isBrandedFood(food);

  const commonFoods = foods
    .filter(isCommonFood)
    .sort((a, b) => Number(hasPhoto(b)) - Number(hasPhoto(a)));
  const brandedFoods = foods
    .filter(isBrandedFood)
    .sort((a, b) => Number(hasPhoto(b)) - Number(hasPhoto(a)));
  const customFoods = foods
    .filter(isCustomFood)
    .sort((a, b) => Number(hasPhoto(b)) - Number(hasPhoto(a)));

  const foodsForTab =
    activeTab === 'common'
      ? commonFoods
      : activeTab === 'branded'
        ? brandedFoods
        : customFoods;

  // Debounce search calls (500ms) and require 3+ chars.
  // Keeps parent/query logic simple and avoids spam.
  useEffect(() => {
    const trimmed = debouncedQueryKey;
    const timer = setTimeout(() => {
      if (trimmed.length >= 3) {
        onSearch(trimmed);
      } else {
        onSearch('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [debouncedQueryKey, onSearch]);

  const handleAddFood = async () => {
    if (!selectedFood) return;

    setAdding(true);
    setError(null);
    setAddSuccess(false);

    try {
      await onAddFood(selectedFood, quantity, mealType);

      setAddSuccess(true);
      setSelectedFood(null);
      setQuantity('1');
      setQuery('');

      // Reset success state after 2 seconds
      setTimeout(() => setAddSuccess(false), 2000);
    } catch (err) {
      console.error('Error adding food:', err);
      setError('Failed to add food. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const selectFood = (food: NutritionSourceFood) => {
    if (selectedFood?.sourceId === food.sourceId && selectedFood?.source === food.source) {
      setSelectedFood(null);
      return;
    }

    setSelectedFood(food);
    setQuantity(String(food.servingQty || 1));
  };

  return (
    <div className="space-y-4">
      {/* Name Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for foods (e.g., 'apple', 'chicken breast')"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          className="pl-10"
          data-testid="food-search-input"
        />
        {query.trim().length > 0 && query.trim().length < 3 && (
          <div className="mt-1 text-xs text-muted-foreground">Type at least 3 characters to search</div>
        )}
      </div>

      {/* Success Message */}
      {addSuccess && (
        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
          <Check className="h-4 w-4" />
          <span>Food added successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg"
          data-testid="error-message"
        >
          {error}
        </div>
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="flex items-center justify-center py-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
                  className="w-16 h-16 rounded object-cover"
                />
              )}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="font-medium text-lg">{selectedFood.name}</div>
                  {selectedFood.brandName && (
                    <div className="text-sm text-muted-foreground">{selectedFood.brandName}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      data-testid="quantity-input"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {selectedFood.servingUnit}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Meal
                    </label>
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
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
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

      {/* Results (only when no food selected) */}
      {!selectedFood && hasResults && (
        <div className="space-y-4" data-testid="search-results">
          {foods.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">Results</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={activeTab === 'common' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('common')}
                  >
                    Common ({commonFoods.length})
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={activeTab === 'branded' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('branded')}
                  >
                    Branded ({brandedFoods.length})
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={activeTab === 'custom' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('custom')}
                  >
                    Custom ({customFoods.length})
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {foodsForTab.map((food, index) => {
                  const p100 = toPer100g(food);
                  return (
                  <Card
                    key={`${food.source}-${food.sourceId}`}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => selectFood(food)}
                    data-testid={`food-result-${index}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        {food.photo?.thumb ? (
                          <img
                            src={food.photo.thumb}
                            alt={food.name}
                            className="w-12 h-12 rounded object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{food.name}</div>
                          {food.brandName && (
                            <div className="text-sm text-muted-foreground">{food.brandName}</div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {p100 ? (
                              <span>
                                {Math.round(p100.calories)} kcal · P {p100.protein.toFixed(1)}g · C {p100.carbs.toFixed(1)}g · F {p100.fat.toFixed(1)}g
                                {p100.sodium !== undefined ? ` · Na ${Math.round(p100.sodium)}mg` : ''} · /100g
                              </span>
                            ) : (
                              <span>
                                {food.calories} kcal · P {food.protein}g · C {food.carbs}g · F {food.fat}g
                                {food.sodium !== undefined ? ` · Na ${food.sodium}mg` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>

              {onLoadMore && hasMore && (
                <div className="mt-3 flex justify-center">
                  <Button type="button" variant="outline" onClick={onLoadMore} disabled={isLoadingMore || isSearching}>
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Load more'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty results message (name search only) */}
      {!selectedFood && query.trim().length >= 3 && !isSearching && foods.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No foods found. Try different search terms.
        </div>
      )}
    </div>
  );
}
