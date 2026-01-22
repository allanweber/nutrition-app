'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNutritionGoals } from '@/hooks/use-nutrition-goals';
import { Activity, Loader2, Target, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { goalsFormSchema, type GoalsFormData } from '@/lib/form-validation';
import type { GoalType, ActivityLevel } from '@/types/food';

export default function GoalsPage() {
  const { data: goals, isLoading, updateGoals } = useNutritionGoals();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm({
    defaultValues: {
      goalType: (goals?.goalType as GoalType) || 'maintenance',
      activityLevel: (goals?.activityLevel as ActivityLevel) || 'moderate',
      calories: goals?.calories?.toString() || '2000',
      protein: goals?.protein?.toString() || '150',
      carbs: goals?.carbs?.toString() || '250',
      fat: goals?.fat?.toString() || '65',
      fiber: goals?.fiber?.toString() || '25',
      sodium: goals?.sodium?.toString() || '2300',
    } as any, // GoalsFormData expects numbers but form uses strings
    onSubmit: async ({ value }) => {
      const result = await updateGoals({
        goalType: value.goalType,
        activityLevel: value.activityLevel,
        calories: parseInt(value.calories),
        protein: parseInt(value.protein),
        carbs: parseInt(value.carbs),
        fat: parseInt(value.fat),
        fiber: parseInt(value.fiber),
        sodium: parseInt(value.sodium),
      });

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(result.error || 'Failed to save goals');
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Nutrition Goals
        </h1>
        <p className="text-muted-foreground">
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="space-y-6"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field
                    name="goalType"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor="goalType">Goal Type</Label>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => field.handleChange(value as GoalType)}
                        >
                          <SelectTrigger className={`w-full ${field.state.meta.errors.length > 0 ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Select your goal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weight_loss">Weight Loss</SelectItem>
                            <SelectItem value="fat_loss">Fat Loss</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="weight_gain">Weight Gain</SelectItem>
                            <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                            <SelectItem value="performance">Performance</SelectItem>
                            <SelectItem value="general_health">General Health</SelectItem>
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors.length > 0 && (
                          <div className="text-sm text-red-600 dark:text-red-400">
                            {field.state.meta.errors[0]}
                          </div>
                        )}
                      </div>
                    )}
                  />

                  <form.Field
                    name="activityLevel"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor="activityLevel">Activity Level</Label>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => field.handleChange(value as ActivityLevel)}
                        >
                          <SelectTrigger className={`w-full ${field.state.meta.errors.length > 0 ? 'border-red-500' : ''}`}>
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
                        {field.state.meta.errors.length > 0 && (
                          <div className="text-sm text-red-600 dark:text-red-400">
                            {field.state.meta.errors[0]}
                          </div>
                        )}
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <form.Field
                      name="calories"
                      validators={{
                        onChange: ({ value }) =>
                          !value || isNaN(parseInt(value)) || parseInt(value) < 500 || parseInt(value) > 15000
                            ? 'Calories must be between 500 and 15,000'
                            : undefined,
                      }}
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor="calories">Target Calories</Label>
                          <Input
                            id="calories"
                            type="number"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="2000"
                            min="500"
                            max="15000"
                            className={field.state.meta.errors.length > 0 ? 'border-red-500' : ''}
                          />
                          {field.state.meta.errors.length > 0 && (
                            <div className="text-sm text-red-600 dark:text-red-400">
                              {field.state.meta.errors[0]}
                            </div>
                          )}
                        </div>
                      )}
                    />

                    <form.Field
                      name="protein"
                      validators={{
                        onChange: ({ value }) =>
                          !value || isNaN(parseInt(value)) || parseInt(value) < 0 || parseInt(value) > 2000
                            ? 'Protein must be between 0 and 2,000g'
                            : undefined,
                      }}
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor="protein">Target Protein (g)</Label>
                          <Input
                            id="protein"
                            type="number"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="150"
                            min="0"
                            max="2000"
                            className={field.state.meta.errors.length > 0 ? 'border-red-500' : ''}
                          />
                          {field.state.meta.errors.length > 0 && (
                            <div className="text-sm text-red-600 dark:text-red-400">
                              {field.state.meta.errors[0]}
                            </div>
                          )}
                        </div>
                      )}
                    />

                    <form.Field
                      name="carbs"
                      validators={{
                        onChange: ({ value }) =>
                          !value || isNaN(parseInt(value)) || parseInt(value) < 0 || parseInt(value) > 3000
                            ? 'Carbs must be between 0 and 3,000g'
                            : undefined,
                      }}
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor="carbs">Target Carbs (g)</Label>
                          <Input
                            id="carbs"
                            type="number"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="250"
                            min="0"
                            max="3000"
                            className={field.state.meta.errors.length > 0 ? 'border-red-500' : ''}
                          />
                          {field.state.meta.errors.length > 0 && (
                            <div className="text-sm text-red-600 dark:text-red-400">
                              {field.state.meta.errors[0]}
                            </div>
                          )}
                        </div>
                      )}
                    />

                    <form.Field
                      name="fat"
                      validators={{
                        onChange: ({ value }) =>
                          !value || isNaN(parseInt(value)) || parseInt(value) < 0 || parseInt(value) > 1000
                            ? 'Fat must be between 0 and 1,000g'
                            : undefined,
                      }}
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor="fat">Target Fat (g)</Label>
                          <Input
                            id="fat"
                            type="number"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="65"
                            min="0"
                            max="1000"
                            className={field.state.meta.errors.length > 0 ? 'border-red-500' : ''}
                          />
                          {field.state.meta.errors.length > 0 && (
                            <div className="text-sm text-red-600 dark:text-red-400">
                              {field.state.meta.errors[0]}
                            </div>
                          )}
                        </div>
                      )}
                    />

                    <form.Field
                      name="fiber"
                      validators={{
                        onChange: ({ value }) =>
                          !value || isNaN(parseInt(value)) || parseInt(value) < 0 || parseInt(value) > 200
                            ? 'Fiber must be between 0 and 200g'
                            : undefined,
                      }}
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor="fiber">Target Fiber (g)</Label>
                          <Input
                            id="fiber"
                            type="number"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="25"
                            min="0"
                            max="200"
                            className={field.state.meta.errors.length > 0 ? 'border-red-500' : ''}
                          />
                          {field.state.meta.errors.length > 0 && (
                            <div className="text-sm text-red-600 dark:text-red-400">
                              {field.state.meta.errors[0]}
                            </div>
                          )}
                        </div>
                      )}
                    />

                    <form.Field
                      name="sodium"
                      validators={{
                        onChange: ({ value }) =>
                          !value || isNaN(parseInt(value)) || parseInt(value) < 0 || parseInt(value) > 100000
                            ? 'Sodium must be between 0 and 100,000mg'
                            : undefined,
                      }}
                      children={(field) => (
                        <div className="space-y-2">
                          <Label htmlFor="sodium">Target Sodium (mg)</Label>
                          <Input
                            id="sodium"
                            type="number"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="2300"
                            min="0"
                            max="100000"
                            className={field.state.meta.errors.length > 0 ? 'border-red-500' : ''}
                          />
                          {field.state.meta.errors.length > 0 && (
                            <div className="text-sm text-red-600 dark:text-red-400">
                              {field.state.meta.errors[0]}
                            </div>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>

                {saveSuccess && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                    Goals saved successfully!
                  </div>
                )}

                <form.Subscribe
                  selector={(state) => [state.errorMap]}
                  children={([errorMap]) =>
                    errorMap.onSubmit ? (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        {errorMap.onSubmit}
                      </div>
                    ) : null
                  }
                />

                <div className="flex justify-end">
                  <form.Subscribe
                    selector={(state) => [state.isSubmitting]}
                    children={([isSubmitting]) => (
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Goals'
                        )}
                      </Button>
                    )}
                  />
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
                  <div className="text-sm text-muted-foreground">
                    Use our calculator to get personalized recommendations based
                    on your age, gender, weight, and activity level.
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
                  <div className="text-2xl font-bold text-foreground">0%</div>
                  <div className="text-sm text-muted-foreground">
                    Goals achieved this month
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
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
