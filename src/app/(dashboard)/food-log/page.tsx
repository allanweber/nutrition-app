
'use client';

import { useEffect, useState } from 'react';
import FoodSearch from '@/components/food-search';
import FoodLogClient from '@/components/food-log-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFoodLogsQuery, useCreateFoodLogMutation, useDeleteFoodLogMutation } from '@/queries/food-logs';
import { format } from 'date-fns';
import type { NutritionSourceFood } from '@/lib/nutrition-sources/types';

export default function FoodLogPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addSuccess, setAddSuccess] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const logsQuery = useFoodLogsQuery(dateStr);
  const createMutation = useCreateFoodLogMutation();
  const deleteMutation = useDeleteFoodLogMutation();

  useEffect(() => {
    if (!addSuccess) return;
    const timeout = setTimeout(() => setAddSuccess(false), 2000);
    return () => clearTimeout(timeout);
  }, [addSuccess]);

  const handleFoodAdded = async (payload: {
    food: NutritionSourceFood;
    quantity: string;
    servingUnit: string;
    grams: number;
    macros: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
      sugar?: number;
      sodium?: number;
    };
  }) => {
    const { food, quantity, servingUnit } = payload;
    await createMutation.mutateAsync({
      foodId: food.id,
      food,
      foodName: food.name,
      brandName: food.brandName ?? undefined,
      quantity,
      servingUnit,
      mealType: 'breakfast',
    });
  };

  const handleDeleteLog = async (logId: number) => {
    await deleteMutation.mutateAsync(logId);
  };

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
                 {addSuccess && (
                   <div className="mb-3 rounded-lg bg-green-50 p-3 text-green-700 dark:bg-green-950/30 dark:text-green-300">
                     Food added successfully!
                   </div>
                 )}
             <FoodSearch
               onAddFood={handleFoodAdded}
                   onAdded={() => setAddSuccess(true)}
                   actionLabel="Add to Log"
             />
           </CardContent>
        </Card>
      </div>

       {/* Food Log Display */}
       <FoodLogClient
         logs={logsQuery.data?.logs || []}
         logsByMeal={logsQuery.data?.logsByMeal || {}}
         totals={logsQuery.data?.totals || {
           calories: 0,
           protein: 0,
           carbs: 0,
           fat: 0,
           fiber: 0,
           sugar: 0,
           sodium: 0,
         }}
         isLoading={logsQuery.isLoading}
         onDateChange={setSelectedDate}
         onDeleteLog={handleDeleteLog}
       />
    </div>
  );
}
