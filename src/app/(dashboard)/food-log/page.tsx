import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import FoodSearch from '@/components/food-search';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Flame, Wheat, Beef } from 'lucide-react';

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

export default async function FoodLogPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const handleAddFood = async (food: Food, quantity: string) => {
    'use server';
    
    // TODO: Get selected meal type from form
    const mealType = 'breakfast'; // Default for now
    
    try {
      const response = await fetch('/api/food-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodName: food.food_name,
          brandName: food.brand_name,
          quantity: quantity,
          servingUnit: food.serving_unit,
          mealType,
        }),
      });

      if (response.ok) {
        console.log('Food logged successfully');
        // TODO: Refresh food logs or redirect
      } else {
        console.error('Failed to log food');
      }
    } catch (error) {
      console.error('Error logging food:', error);
    }
  };

  // TODO: Fetch existing food logs for today
  const todayLogs: any[] = [];
  const todayTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

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
          <Card>
            <CardHeader>
              <CardTitle>Add Food</CardTitle>
            </CardHeader>
            <CardContent>
              <FoodSearch onAddFood={handleAddFood} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today's Food Log</CardTitle>
            </CardHeader>
            <CardContent>
              {todayLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No foods logged today. Start by searching and adding foods above.
                </div>
              ) : (
                <div className="space-y-4">
                  {todayLogs.map((log, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                      {log.food.photo && (
                        <img
                          src={log.food.photo}
                          alt={log.food.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{log.food.name}</div>
                        <div className="text-sm text-gray-500">
                          {log.quantity} {log.food.servingUnit} • {log.mealType}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{log.calories} cal</div>
                        <div className="text-sm text-gray-500">
                          P: {log.protein}g | C: {log.carbs}g | F: {log.fat}g
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span>Calories</span>
                  </div>
                  <Badge variant="secondary">{todayTotals.calories}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Beef className="h-4 w-4 text-red-500" />
                    <span>Protein</span>
                  </div>
                  <Badge variant="secondary">{todayTotals.protein}g</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wheat className="h-4 w-4 text-yellow-500" />
                    <span>Carbs</span>
                  </div>
                  <Badge variant="secondary">{todayTotals.carbs}g</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Beef className="h-4 w-4 text-blue-500" />
                    <span>Fat</span>
                  </div>
                  <Badge variant="secondary">{todayTotals.fat}g</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Log Previous Meal
              </Button>
              <Button className="w-full" variant="outline">
                Copy Yesterday's Log
              </Button>
              <Button className="w-full" variant="outline">
                Create Meal Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Water Intake</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-gray-500">glasses today</div>
                </div>
                <Button className="w-full">
                  Add Glass of Water
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}