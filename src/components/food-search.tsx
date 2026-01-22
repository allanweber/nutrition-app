/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Loader2, Check } from 'lucide-react';

interface Food {
  food_name: string;
  brand_name?: string;
  serving_unit: string;
  serving_qty: number;
  photo?: {
    thumb: string;
  };
  tag_id?: number;
  nix_item_id?: string;
}

interface FoodSearchProps {
  searchResults?: { common?: Food[], branded?: Food[] };
  isSearching?: boolean;
  onSearch: (query: string) => void;
  onAddFood: (food: Food, quantity: string, mealType: string) => void;
}

export default function FoodSearch({
  searchResults = {},
  isSearching = false,
  onSearch,
  onAddFood
}: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [mealType, setMealType] = useState<string>('breakfast');
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const selectFood = (food: Food) => {
    if (selectedFood === food) {
      setSelectedFood(null);
    } else {
      setSelectedFood(food);
      setQuantity(String(food.serving_qty || 1));
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for foods (e.g., 'apple', 'chicken breast')"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
          className="pl-10"
          data-testid="food-search-input"
        />
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
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg" data-testid="error-message">
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
                  alt={selectedFood.food_name}
                  className="w-16 h-16 rounded object-cover"
                />
              )}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="font-medium text-lg">{selectedFood.food_name}</div>
                  {selectedFood.brand_name && (
                    <div className="text-sm text-muted-foreground">{selectedFood.brand_name}</div>
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
                      {selectedFood.serving_unit}
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
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedFood(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {(searchResults.common?.length || searchResults.branded?.length) && !selectedFood ? (
        <div className="space-y-4" data-testid="search-results">
          {searchResults.common && searchResults.common.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">Common Foods</h3>
              <div className="space-y-2">
                {searchResults.common.slice(0, 5).map((food: Food, index: number) => (
                  <Card
                    key={`common-${index}`}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => selectFood(food)}
                    data-testid={`food-result-${index}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        {food.photo?.thumb && (
                          <img
                            src={food.photo.thumb}
                            alt={food.food_name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{food.food_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {food.serving_qty} {food.serving_unit}
                          </div>
                        </div>
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {searchResults.branded && searchResults.branded.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">Branded Products</h3>
              <div className="space-y-2">
                {searchResults.branded.slice(0, 5).map((food: Food, index: number) => (
                  <Card
                    key={`branded-${index}`}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => selectFood(food)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        {food.photo?.thumb && (
                          <img
                            src={food.photo.thumb}
                            alt={food.food_name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{food.food_name}</div>
                          <div className="text-sm text-muted-foreground">{food.brand_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {food.serving_qty} {food.serving_unit}
                          </div>
                        </div>
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : query.length >= 2 && !isSearching && !selectedFood ? (
        <div className="text-center py-8 text-muted-foreground">
          No foods found. Try different search terms.
        </div>
      ) : null}
    </div>
  );
}
