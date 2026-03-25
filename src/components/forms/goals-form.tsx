'use client';

import { useForm } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
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
import { goalsFormSchema, zodValidator } from '@/lib/form-validation';
import type { ActivityLevel, GoalType } from '@/types/goals';

type GoalsFormValues = {
  goalType: GoalType;
  activityLevel: ActivityLevel;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sodium: string;
};

export function GoalsForm() {
  const { data: goals, updateGoals } = useNutritionGoals();
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
    } satisfies GoalsFormValues,
    onSubmit: async ({ value }) => {
      const result = await updateGoals({
        goalType: value.goalType,
        activityLevel: value.activityLevel,
        calories: parseInt(value.calories, 10),
        protein: parseInt(value.protein, 10),
        carbs: parseInt(value.carbs, 10),
        fat: parseInt(value.fat, 10),
        fiber: parseInt(value.fiber, 10),
        sodium: parseInt(value.sodium, 10),
      });

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(result.error || 'Failed to save goals');
      }
    },
  });

  useEffect(() => {
    if (!goals) return;
    form.reset({
      goalType: (goals.goalType as GoalType) || 'maintenance',
      activityLevel: (goals.activityLevel as ActivityLevel) || 'moderate',
      calories: goals.calories?.toString() || '2000',
      protein: goals.protein?.toString() || '150',
      carbs: goals.carbs?.toString() || '250',
      fat: goals.fat?.toString() || '65',
      fiber: goals.fiber?.toString() || '25',
      sodium: goals.sodium?.toString() || '2300',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals]);

  return (
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
          validators={{ onChange: zodValidator(goalsFormSchema.shape.goalType) }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="goalType">Goal Type</Label>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as GoalType)}
              >
                <SelectTrigger
                  id="goalType"
                  className={`w-full ${field.state.meta.errors.length > 0 ? 'border-destructive' : ''}`}
                >
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
                <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name="activityLevel"
          validators={{ onChange: zodValidator(goalsFormSchema.shape.activityLevel) }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="activityLevel">Activity Level</Label>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as ActivityLevel)}
              >
                <SelectTrigger
                  id="activityLevel"
                  className={`w-full ${field.state.meta.errors.length > 0 ? 'border-destructive' : ''}`}
                >
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
                <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
              )}
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(
          [
            { name: 'calories', label: 'Target Calories', placeholder: '2000', min: '500', max: '15000' },
            { name: 'protein', label: 'Target Protein (g)', placeholder: '150', min: '0', max: '2000' },
            { name: 'carbs', label: 'Target Carbs (g)', placeholder: '250', min: '0', max: '3000' },
            { name: 'fat', label: 'Target Fat (g)', placeholder: '65', min: '0', max: '1000' },
            { name: 'fiber', label: 'Target Fiber (g)', placeholder: '25', min: '0', max: '200' },
            { name: 'sodium', label: 'Target Sodium (mg)', placeholder: '2300', min: '0', max: '100000' },
          ] as const
        ).map(({ name, label, placeholder, min, max }) => (
          <form.Field
            key={name}
            name={name}
            validators={{ onChange: zodValidator(goalsFormSchema.shape[name]), onSubmit: zodValidator(goalsFormSchema.shape[name]) }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  type="number"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={placeholder}
                  min={min}
                  max={max}
                  className={field.state.meta.errors.length > 0 ? 'border-destructive' : ''}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>
        ))}
      </div>

      {saveSuccess && (
        <div role="status" aria-live="polite" className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400 p-3 rounded-md">
          Goals saved successfully!
        </div>
      )}

      <form.Subscribe selector={(state) => [state.errorMap]}>
        {([errorMap]) =>
          errorMap.onSubmit ? (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {String(errorMap.onSubmit)}
            </div>
          ) : null
        }
      </form.Subscribe>

      <div className="flex justify-end">
        <form.Subscribe selector={(state) => [state.isSubmitting]}>
          {([isSubmitting]) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : (
                'Save Goals'
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
