'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FoodSearch from '@/components/food-search';

export default function FoodsSearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Search Foods
        </h1>
        <p className="text-gray-600">
          Find nutrition information for any food
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Search Foods</CardTitle>
            </CardHeader>
            <CardContent>
              <FoodSearch />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Try simple terms like &quot;apple&quot; or &quot;chicken&quot;</li>
                <li>Include quantities like &quot;1 cup rice&quot;</li>
                <li>Search for branded products</li>
                <li>Use UPC codes for packaged foods</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Searches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-4">
                No recent searches
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}