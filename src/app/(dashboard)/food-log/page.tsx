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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Food Log</h1>
        <p className="text-muted-foreground">Track your daily food intake</p>
      </div>

      {/* Add Food Section */}
      <div className="mb-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <span>Add Food</span>
              </CardTitle>
          </CardHeader>
          <CardContent>
            <FoodSearch onFoodAdded={handleFoodAdded} />
          </CardContent>
        </Card>
      </div>

      {/* Food Log Display */}
      <FoodLogClient key={refreshKey} />
    </div>
  );
}
