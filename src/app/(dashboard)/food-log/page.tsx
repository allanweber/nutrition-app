'use client';

import { useState, useCallback } from 'react';
import FoodSearch from '@/components/food-search';
import FoodLogClient from '@/components/food-log-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FoodLogPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFoodAdded = useCallback(() => {
    // Trigger refresh of food log list
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Food Log
        </h1>
        <p className="text-gray-600">
          Track your daily food intake
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Add Food Section */}
          <Card>
            <CardHeader>
              <CardTitle>Add Food</CardTitle>
            </CardHeader>
            <CardContent>
              <FoodSearch onFoodAdded={handleFoodAdded} />
            </CardContent>
          </Card>

          {/* Food Log Display */}
          <FoodLogClient key={refreshKey} />
        </div>

        <div className="space-y-6">
          {/* Quick Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>Search for foods by name or brand.</p>
              <p>Select a food to adjust quantity and meal type before adding.</p>
              <p>Use the date navigation to view previous days.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
