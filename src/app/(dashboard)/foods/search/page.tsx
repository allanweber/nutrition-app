import FoodSearch from '@/components/food-search';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export default function FoodSearchPage() {
  const handleAddFood = async (food: Food, quantity: string) => {
    'use server';
    
    console.log('Adding food:', food.food_name, 'Quantity:', quantity);
    // TODO: Implement food logging logic
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Food Search
        </h1>
        <p className="text-gray-600">
          Search for foods to add to your nutrition log
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Search Foods</CardTitle>
            </CardHeader>
            <CardContent>
              <FoodSearch onAddFood={handleAddFood} />
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
                <li>• Try simple terms like "apple" or "chicken"</li>
                <li>• Include quantities like "1 cup rice"</li>
                <li>• Search for branded products</li>
                <li>• Use UPC codes for packaged foods</li>
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