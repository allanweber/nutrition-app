'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Loader2, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import type { FoodSearchResultItem, SearchPagination } from '@/queries/foods';
import type { FoodDetailResponse } from '@/queries/food-detail';

interface FoodSearchProps {
  results: FoodSearchResultItem[];
  pagination: SearchPagination | null;
  isLoading: boolean;
  error: string | null;
  onSearch: (query: string) => void;
  onPageChange: (page: number) => void;
  onSelectFood: (food: { id: number | null; fatSecretId: string }) => void;
  foodDetail: FoodDetailResponse | null;
  isDetailLoading: boolean;
  detailError: string | null;
  onCloseDetail: () => void;
  onAddFood: (food: { food_name: string; brand_name?: string; serving_unit: string }, quantity: string, mealType: string) => Promise<void>;
}

export default function FoodSearch({
  results,
  pagination,
  isLoading,
  error,
  onSearch,
  onPageChange,
  onSelectFood,
  foodDetail,
  isDetailLoading,
  detailError,
  onCloseDetail,
  onAddFood,
}: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [mealType, setMealType] = useState<string>('breakfast');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  const handleAddFood = async () => {
    if (!foodDetail) return;
    setAdding(true);
    setAddError(null);
    try {
      await onAddFood(
        {
          food_name: foodDetail.name,
          brand_name: foodDetail.brandName ?? undefined,
          serving_unit: 'g',
        },
        quantity,
        mealType,
      );
      onCloseDetail();
      setQuery('');
      onSearch('');
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 3000);
    } catch {
      setAddError('Couldn\'t save this food entry. Check your connection and try again.');
    } finally {
      setAdding(false);
    }
  };

  // Detail view
  if (foodDetail || isDetailLoading || detailError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onCloseDetail} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to results
        </Button>

        {isDetailLoading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading nutrition info...
          </div>
        )}

        {detailError && (
          <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
            {detailError}
          </div>
        )}

        {foodDetail && !isDetailLoading && (
          <div className="space-y-4">
            {/* Food header */}
            <div className="flex items-start gap-4">
              {foodDetail.images?.thumb && (
                <Image
                  src={foodDetail.images.thumb}
                  alt={foodDetail.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded object-cover flex-shrink-0"
                />
              )}
              <div>
                <h2 className="text-lg font-semibold">{foodDetail.name}</h2>
                {foodDetail.brandName && (
                  <p className="text-sm text-muted-foreground">{foodDetail.brandName}</p>
                )}
                <p className="text-xs text-muted-foreground">{foodDetail.foodType}</p>
              </div>
            </div>

            {/* Base nutrition (per 100g) */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Nutrition per 100g</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Calories: <span className="font-medium">{foodDetail.baseServing.calories.toFixed(1)} kcal</span></div>
                  <div>Protein: <span className="font-medium">{foodDetail.baseServing.protein.toFixed(1)}g</span></div>
                  <div>Carbs: <span className="font-medium">{foodDetail.baseServing.carbs.toFixed(1)}g</span></div>
                  <div>Fat: <span className="font-medium">{foodDetail.baseServing.fat.toFixed(1)}g</span></div>
                  {foodDetail.baseServing.fiber !== null && (
                    <div>Fiber: <span className="font-medium">{foodDetail.baseServing.fiber.toFixed(1)}g</span></div>
                  )}
                  {foodDetail.baseServing.sugar !== null && (
                    <div>Sugar: <span className="font-medium">{foodDetail.baseServing.sugar.toFixed(1)}g</span></div>
                  )}
                  {foodDetail.baseServing.sodium !== null && (
                    <div>Sodium: <span className="font-medium">{foodDetail.baseServing.sodium.toFixed(0)}mg</span></div>
                  )}
                  {foodDetail.baseServing.potassium !== null && (
                    <div>Potassium: <span className="font-medium">{foodDetail.baseServing.potassium.toFixed(0)}mg</span></div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alternate servings */}
            {foodDetail.servings.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Serving Sizes</h3>
                <div className="space-y-2">
                  {foodDetail.servings.map((serving) => (
                    <Card key={serving.id}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{serving.description}</p>
                            <p className="text-xs text-muted-foreground">{serving.weightGrams}g</p>
                          </div>
                          <div className="text-right text-sm">
                            <p>{serving.calories.toFixed(0)} kcal</p>
                            <p className="text-xs text-muted-foreground">
                              P: {serving.protein.toFixed(1)}g C: {serving.carbs.toFixed(1)}g F: {serving.fat.toFixed(1)}g
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Images */}
            {foodDetail.images?.medium && (
              <Image
                src={foodDetail.images.medium}
                alt={foodDetail.name}
                width={400}
                height={400}
                className="rounded-lg w-full max-w-sm h-auto"
              />
            )}

            {/* Add to log */}
            {addError && (
              <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
                {addError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Quantity (g)</label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  data-testid="quantity-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Meal</label>
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
            <Button onClick={handleAddFood} disabled={adding} className="w-full" data-testid="add-food-button">
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
          </div>
        )}
      </div>
    );
  }

  // Search results view
  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <label htmlFor="food-search-input" className="sr-only">Search foods</label>
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          id="food-search-input"
          placeholder="Search for foods (e.g., 'apple', 'chicken breast')"
          value={query}
          onChange={handleSearchChange}
          className="pl-10"
          data-testid="food-search-input"
        />
      </div>

      {/* Success Message */}
      {addSuccess && (
        <div className="text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg" data-testid="add-success-message">
          Added to your log.
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg" data-testid="error-message">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Searching foods...
        </div>
      )}

      {/* Pre-search: teach the user what to search */}
      {!isLoading && !error && query.length === 0 && (
        <div className="pt-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Try searching for
          </p>
          <div className="space-y-0.5">
            {['Chicken breast', 'Greek yogurt', 'Brown rice', 'Avocado'].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => { setQuery(example); onSearch(example); }}
                className="flex items-center w-full text-left text-sm text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors gap-2"
              >
                <Search className="h-3 w-3 opacity-40 shrink-0" aria-hidden="true" />
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-2" data-testid="search-results">
          {results.map((food, index) => (
            <Card
              key={`${food.fatSecretId}-${index}`}
              className="cursor-pointer hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => onSelectFood({ id: food.id, fatSecretId: food.fatSecretId })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectFood({ id: food.id, fatSecretId: food.fatSecretId });
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Select ${food.name}${food.brandName ? ` by ${food.brandName}` : ''}${food.calories !== null ? `, ${food.calories} kcal per 100g` : ''}`}
              data-testid={`food-result-${index}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  {food.thumbnail && (
                    <Image
                      src={food.thumbnail}
                      alt={food.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{food.name}</div>
                    {food.brandName && (
                      <div className="text-sm text-muted-foreground truncate">{food.brandName}</div>
                    )}
                    {food.calories !== null && (
                      <div className="text-xs text-muted-foreground">{food.calories} kcal/100g</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {food.isLocal && (
                      <span className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">saved</span>
                    )}
                    <Plus className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && query.length >= 3 && results.length === 0 && !error && (
        <div className="py-6" data-testid="empty-results">
          <p className="text-sm font-medium text-foreground mb-1">
            No results for &ldquo;{query}&rdquo;
          </p>
          <p className="text-sm text-muted-foreground">
            Try a shorter name, check spelling, or search by brand.
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalResults > 0 && (
        <div className="flex items-center justify-between pt-2" data-testid="pagination">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            data-testid="pagination-prev"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} · {pagination.totalResults} results
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page * pagination.maxResults >= pagination.totalResults}
            onClick={() => onPageChange(pagination.page + 1)}
            data-testid="pagination-next"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
