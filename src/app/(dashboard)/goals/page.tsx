'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, TrendingUp, Activity, Loader2 } from 'lucide-react';
import { useNutritionGoals } from '@/hooks/use-nutrition-goals';

export default function GoalsPage() {
  const { data: goals, isLoading, updateGoals } = useNutritionGoals();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Track local edits - null means use value from goals
  const [localEdits, setLocalEdits] = useState<{
    goalType?: 'weight_loss' | 'maintenance' | 'weight_gain';
    activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'extra_active';
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
    fiber?: string;
    sodium?: string;
  }>({});

  // Get current form values (local edit or fetched goal)
  const getValue = <T,>(field: keyof typeof localEdits, defaultValue: T): T => {
    if (localEdits[field] !== undefined) {
      return localEdits[field] as T;
    }
    if (goals && field in goals) {
      const goalValue = goals[field as keyof typeof goals];
      if (typeof defaultValue === 'string' && typeof goalValue === 'number') {
        return goalValue.toString() as T;
      }
      return goalValue as T;
    }
    return defaultValue;
  };

  const goalType = getValue<'weight_loss' | 'maintenance' | 'weight_gain'>('goalType', 'maintenance');
  const activityLevel = getValue<'sedentary' | 'light' | 'moderate' | 'active' | 'extra_active'>('activityLevel', 'moderate');
  const calories = getValue<string>('calories', '2000');
  const protein = getValue<string>('protein', '150');
  const carbs = getValue<string>('carbs', '250');
  const fat = getValue<string>('fat', '65');
  const fiber = getValue<string>('fiber', '25');
  const sodium = getValue<string>('sodium', '2300');

  const handleSaveGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const goalsData = {
      goalType,
      activityLevel,
      calories: parseInt(calories) || 2000,
      protein: parseInt(protein) || 150,
      carbs: parseInt(carbs) || 250,
      fat: parseInt(fat) || 65,
      fiber: parseInt(fiber) || 25,
      sodium: parseInt(sodium) || 2300,
    };

    const success = await updateGoals(goalsData);
    
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setLocalEdits({}); // Clear local edits after successful save
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError('Failed to save goals. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Nutrition Goals
        </h1>
        <p className="text-gray-600">
          Set your daily nutrition targets to track your progress
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily Nutrition Targets</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveGoals} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="goalType">Goal Type</Label>
                    <Select 
                      value={goalType} 
                      onValueChange={(value) => setLocalEdits(prev => ({ ...prev, goalType: value as 'weight_loss' | 'maintenance' | 'weight_gain' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight_loss">Weight Loss</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="weight_gain">Weight Gain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activityLevel">Activity Level</Label>
                    <Select 
                      value={activityLevel} 
                      onValueChange={(value) => setLocalEdits(prev => ({ ...prev, activityLevel: value as 'sedentary' | 'light' | 'moderate' | 'active' | 'extra_active' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary</SelectItem>
                        <SelectItem value="light">Light Activity</SelectItem>
                        <SelectItem value="moderate">Moderate Activity</SelectItem>
                        <SelectItem value="active">Very Active</SelectItem>
                        <SelectItem value="extra_active">Extra Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="calories">Target Calories</Label>
                      <Input
                        id="calories"
                        type="number"
                        value={calories}
                        onChange={(e) => setLocalEdits(prev => ({ ...prev, calories: e.target.value }))}
                        placeholder="2000"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="protein">Target Protein (g)</Label>
                      <Input
                        id="protein"
                        type="number"
                        value={protein}
                        onChange={(e) => setLocalEdits(prev => ({ ...prev, protein: e.target.value }))}
                        placeholder="150"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="carbs">Target Carbs (g)</Label>
                      <Input
                        id="carbs"
                        type="number"
                        value={carbs}
                        onChange={(e) => setLocalEdits(prev => ({ ...prev, carbs: e.target.value }))}
                        placeholder="250"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fat">Target Fat (g)</Label>
                      <Input
                        id="fat"
                        type="number"
                        value={fat}
                        onChange={(e) => setLocalEdits(prev => ({ ...prev, fat: e.target.value }))}
                        placeholder="65"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fiber">Target Fiber (g)</Label>
                      <Input
                        id="fiber"
                        type="number"
                        value={fiber}
                        onChange={(e) => setLocalEdits(prev => ({ ...prev, fiber: e.target.value }))}
                        placeholder="25"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sodium">Target Sodium (mg)</Label>
                      <Input
                        id="sodium"
                        type="number"
                        value={sodium}
                        onChange={(e) => setLocalEdits(prev => ({ ...prev, sodium: e.target.value }))}
                        placeholder="2300"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {saveError && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {saveError}
                  </div>
                )}

                {saveSuccess && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                    Goals saved successfully!
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Goals'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Goal Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <Target className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">
                    Use our calculator to get personalized recommendations based on your age, gender, weight, and activity level.
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  Open Calculator
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Current Streak</span>
                  </div>
                  <span className="font-semibold">0 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Goals Met This Week</span>
                  </div>
                  <span className="font-semibold">0/7</span>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0%</div>
                  <div className="text-sm text-gray-500">Goals achieved this month</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Start with realistic goals</li>
                <li>Track consistently for best results</li>
                <li>Adjust goals based on your progress</li>
                <li>Consult a professional for personalized advice</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
