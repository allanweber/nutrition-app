/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { 
  Flame, 
  Beef, 
  Wheat, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Loader2,
} from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';

import { FoodLogEntry } from '@/types/food';

interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface FoodLogClientProps {
  initialDate?: string;
}

const mealTypeOrder = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

const mealTypeLabels: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export default function FoodLogClient({ initialDate }: FoodLogClientProps) {
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [logsByMeal, setLogsByMeal] = useState<Record<string, FoodLogEntry[]>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate ? new Date(initialDate) : new Date()
  );
  const [totals, setTotals] = useState<Totals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchLogs = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await fetch(`/api/food-logs?date=${dateStr}`);
      const data = await response.json();
      
      if (response.ok) {
        setLogs(data.logs || []);
        setLogsByMeal(data.logsByMeal || {});
        setTotals(data.totals || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(selectedDate);
  }, [selectedDate, fetchLogs]);

  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDelete = async (logId: number) => {
    if (!confirm('Are you sure you want to delete this food log?')) {
      return;
    }

    setDeleting(logId);
    try {
      const response = await fetch(`/api/food-logs/${logId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh logs
        fetchLogs(selectedDate);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete food log');
      }
    } catch (error) {
      console.error('Error deleting log:', error);
      alert('Failed to delete food log');
    } finally {
      setDeleting(null);
    }
  };

  const calculateLogNutrients = (log: FoodLogEntry) => {
    const qty = parseFloat(log.quantity) || 1;
    const servingQty = log.food?.servingQty || 1;
    const multiplier = qty / servingQty;

    return {
      calories: Math.round((log.food?.calories || 0) * multiplier),
      protein: Math.round((log.food?.protein || 0) * multiplier * 10) / 10,
      carbs: Math.round((log.food?.carbs || 0) * multiplier * 10) / 10,
      fat: Math.round((log.food?.fat || 0) * multiplier * 10) / 10,
    };
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={handlePreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
                </div>
                <div className="text-sm text-gray-500">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </div>
              </div>
              {!isToday(selectedDate) && (
                <Button variant="outline" size="sm" onClick={handleToday}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Today
                </Button>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleNextDay}
              disabled={isToday(selectedDate)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{totals.calories}</div>
              <div className="text-sm text-gray-500">Calories</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <Beef className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{totals.protein}g</div>
              <div className="text-sm text-gray-500">Protein</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Wheat className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">{totals.carbs}g</div>
              <div className="text-sm text-gray-500">Carbs</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="h-6 w-6 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold">F</div>
              <div className="text-2xl font-bold text-blue-600">{totals.fat}g</div>
              <div className="text-sm text-gray-500">Fat</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food Logs by Meal */}
      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading food logs...
            </div>
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div 
              className="text-center text-gray-500"
              data-testid="empty-state"
            >
              <p className="text-lg font-medium mb-2">No foods logged</p>
              <p>Start by searching and adding foods using the form above.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {mealTypeOrder.map(mealType => {
            const mealLogs = logsByMeal[mealType] || [];
            if (mealLogs.length === 0) return null;

            const mealTotals = mealLogs.reduce(
              (acc, log) => {
                const nutrients = calculateLogNutrients(log);
                return {
                  calories: acc.calories + nutrients.calories,
                  protein: acc.protein + nutrients.protein,
                  carbs: acc.carbs + nutrients.carbs,
                  fat: acc.fat + nutrients.fat,
                };
              },
              { calories: 0, protein: 0, carbs: 0, fat: 0 }
            );

            return (
              <Card key={mealType}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{mealTypeLabels[mealType]}</CardTitle>
                    <Badge variant="secondary">{mealTotals.calories} cal</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mealLogs.map(log => {
                      const nutrients = calculateLogNutrients(log);
                      return (
                        <div 
                          key={log.id} 
                          className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                          data-testid={`food-log-${log.id}`}
                        >
                          {log.food.photoUrl && (
                            <img
                              src={log.food.photoUrl}
                              alt={log.food.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{log.food.name}</div>
                            {log.food.brandName && (
                              <div className="text-sm text-gray-500 truncate">{log.food.brandName}</div>
                            )}
                            <div className="text-sm text-gray-500">
                              {log.quantity} {log.servingUnit || log.food.servingUnit}
                            </div>
                          </div>
                          <div className="text-right hidden sm:block">
                            <div className="font-medium">{nutrients.calories} cal</div>
                            <div className="text-xs text-gray-500">
                              P: {nutrients.protein}g | C: {nutrients.carbs}g | F: {nutrients.fat}g
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(log.id)}
                            disabled={deleting === log.id}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            data-testid={`delete-log-${log.id}`}
                          >
                            {deleting === log.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
