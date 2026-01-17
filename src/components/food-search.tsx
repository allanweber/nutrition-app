'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus } from 'lucide-react';

interface Food {
  food_name: string;
  brand_name?: string;
  serving_unit: string;
  serving_qty: number;
  photo?: {
    thumb: string;
  };
  tag_id?: number;
}

interface FoodSearchProps {
  onFoodSelect?: (food: Food) => void;
  onAddFood?: (food: Food, quantity: string) => void;
}

export default function FoodSearch({ onFoodSelect, onAddFood }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ common?: Food[], branded?: Food[] }>({});
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('1');

  const searchFoods = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults({});
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/foods/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.results) {
        setResults(data.results);
      } else {
        setResults({});
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchFoods(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchFoods]);

  const handleAddFood = () => {
    if (selectedFood && onAddFood) {
      onAddFood(selectedFood, quantity);
      setSelectedFood(null);
      setQuantity('1');
      setQuery('');
      setResults({});
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search for foods (e.g., '1 apple', 'chicken breast')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="text-center py-4 text-gray-500">
          Searching...
        </div>
      )}

      {(results.common?.length || results.branded?.length) ? (
        <div className="space-y-4">
          {results.common && results.common.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Common Foods</h3>
              <div className="space-y-2">
                {results.common.map((food, index) => (
                  <Card
                    key={`common-${index}`}
                    className={`cursor-pointer transition-colors ${
                      selectedFood === food ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedFood(food)}
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
                          <div className="text-sm text-gray-500">
                            {food.serving_qty} {food.serving_unit}
                          </div>
                        </div>
                        {selectedFood === food && (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="text"
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                              placeholder="Quantity"
                              className="w-20"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button size="sm" onClick={handleAddFood}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {results.branded && results.branded.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Branded Products</h3>
              <div className="space-y-2">
                {results.branded.map((food, index) => (
                  <Card
                    key={`branded-${index}`}
                    className={`cursor-pointer transition-colors ${
                      selectedFood === food ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedFood(food)}
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
                          <div className="text-sm text-gray-500">{food.brand_name}</div>
                          <div className="text-sm text-gray-500">
                            {food.serving_qty} {food.serving_unit}
                          </div>
                        </div>
                        {selectedFood === food && (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="text"
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                              placeholder="Quantity"
                              className="w-20"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button size="sm" onClick={handleAddFood}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : query.length >= 2 && !loading ? (
        <div className="text-center py-8 text-gray-500">
          No foods found. Try different search terms.
        </div>
      ) : null}
    </div>
  );
}