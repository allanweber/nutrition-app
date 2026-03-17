/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
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
    } catch {
      setAddError('Failed to add food. Please try again.');
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
            Loading details...
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
                <img
                  src={foodDetail.images.thumb}
                  alt={foodDetail.name}
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
            {foodDetail.images && (
              <div>
                {foodDetail.images.medium && (
                  <img
                    src={foodDetail.images.medium}
                    alt={foodDetail.name}
                    className="rounded-lg w-full max-w-sm"
                  />
                )}
              </div>
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
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for foods (e.g., 'apple', 'chicken breast')"
          value={query}
          onChange={handleSearchChange}
          className="pl-10"
          data-testid="food-search-input"
        />
      </div>

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
          Searching...
        </div>
      )}

      {/* Search Results */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-2" data-testid="search-results">
          {results.map((food, index) => (
            <Card
              key={`${food.fatSecretId}-${index}`}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSelectFood({ id: food.id, fatSecretId: food.fatSecretId })}
              data-testid={`food-result-${index}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  {food.thumbnail && (
                    <img
                      src={food.thumbnail}
                      alt={food.name}
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

      {/* Empty State */}
      {!isLoading && query.length >= 3 && results.length === 0 && !error && (
        <div className="text-center py-8 text-muted-foreground" data-testid="empty-results">
          No foods found. Try different search terms.
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
