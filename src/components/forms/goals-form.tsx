'use client';

import { useForm } from '@tanstack/react-form';
import {
  Droplets,
  FlaskConical,
  Loader2,
  Target,
  UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNutritionGoals } from '@/hooks/use-nutrition-goals';
import { goalsFormSchema, zodValidator } from '@/lib/form-validation';
import { MACRO_HEX_COLORS } from '@/lib/nutrition-constants';
import type { ActivityLevel, GoalType } from '@/types/goals';

type GoalsFormValues = {
  goalType: GoalType;
  activityLevel: ActivityLevel;
  calories: string;
  hydration: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sodium: string;
};

const MACRO_COLORS = {
  protein: MACRO_HEX_COLORS.protein,
  carbs: MACRO_HEX_COLORS.carbs,
  fat: MACRO_HEX_COLORS.fat,
} as const;

export function GoalsForm({
  onOpenCalculator,
}: {
  onOpenCalculator?: () => void;
}) {
  const { data: goals, updateGoals } = useNutritionGoals();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm({
    defaultValues: {
      goalType: (goals?.goalType as GoalType) || 'maintenance',
      activityLevel: (goals?.activityLevel as ActivityLevel) || 'moderate',
      calories: goals?.calories?.toString() || '2000',
      hydration: goals?.hydration?.toString() || '2500',
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
        hydration: parseInt(value.hydration, 10),
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
      hydration: goals.hydration?.toString() || '2500',
      protein: goals.protein?.toString() || '150',
      carbs: goals.carbs?.toString() || '250',
      fat: goals.fat?.toString() || '65',
      fiber: goals.fiber?.toString() || '25',
      sodium: goals.sodium?.toString() || '2300',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals]);

  return (
    <div className="w-full space-y-12 py-12">
      {/* Page Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="inline-block px-4 py-1.5 bg-primary/5 text-primary text-xs font-black uppercase tracking-widest rounded-full">
          Personalization
        </span>
        <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-foreground tracking-tight leading-tight">
          Let&apos;s define your path.
        </h1>
        <p className="text-muted-foreground text-lg font-medium">
          Configure your daily targets to match your unique metabolism and
          fitness journey.
        </p>
        {onOpenCalculator && (
          <Button
            type="button"
            variant="outline"
            onClick={onOpenCalculator}
            className="gap-3"
          >
            <Target className="w-4 h-4 shrink-0" />
            Not sure about your numbers?
            <span className="font-black">Open Calculator →</span>
          </Button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-20"
      >
        {/* Section 1 — Lifestyle & Aim */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-headline font-extrabold">
              Lifestyle &amp; Aim
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your goals and daily activity level form the foundation of your
              calorie and macro recommendations.
            </p>
          </div>

          <div className="space-y-8">
            <form.Field
              name="goalType"
              validators={{
                onChange: zodValidator(goalsFormSchema.shape.goalType),
              }}
            >
              {(field) => (
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    What is your primary goal?
                  </label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v as GoalType)}
                  >
                    <SelectTrigger className="w-full w-full">
                      <SelectValue placeholder="Select your goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight_loss">Weight Loss</SelectItem>
                      <SelectItem value="fat_loss">Fat Loss</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="weight_gain">Weight Gain</SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="general_health">
                        General Health
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="activityLevel"
              validators={{
                onChange: zodValidator(goalsFormSchema.shape.activityLevel),
              }}
            >
              {(field) => (
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Daily Activity Level
                  </label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) =>
                      field.handleChange(v as ActivityLevel)
                    }
                  >
                    <SelectTrigger className="w-full w-full ">
                      <SelectValue placeholder="Select activity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">
                        Sedentary (office job, little exercise)
                      </SelectItem>
                      <SelectItem value="light">
                        Lightly Active (1–3 days/week)
                      </SelectItem>
                      <SelectItem value="moderate">
                        Moderately Active (3–5 days/week)
                      </SelectItem>
                      <SelectItem value="active">
                        Very Active (6–7 days/week)
                      </SelectItem>
                      <SelectItem value="extra_active">
                        Extra Active (athletic training)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>
        </section>

        {/* Section 2 — Energy & Vitality */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Droplets className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-headline font-extrabold">
              Energy &amp; Vitality
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Set your daily energy intake and hydration requirements to keep
              your body fueled and performing.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <form.Field
              name="calories"
              validators={{
                onChange: zodValidator(goalsFormSchema.shape.calories),
                onSubmit: zodValidator(goalsFormSchema.shape.calories),
              }}
            >
              {(field) => (
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Daily Target Calories
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="2500"
                      className="pr-20 py-3 text-2xl font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/40 uppercase">
                      kcal
                    </span>
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="hydration"
              validators={{
                onChange: zodValidator(goalsFormSchema.shape.hydration),
                onSubmit: zodValidator(goalsFormSchema.shape.hydration),
              }}
            >
              {(field) => (
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Target Hydration
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="3500"
                      className="pr-28 py-3 text-2xl font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/40 uppercase">
                      ml / day
                    </span>
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>
        </section>

        {/* Section 3 — Macronutrients */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-headline font-extrabold">
              Macronutrients
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Fine-tune your protein, carb, and fat distribution for optimal
              metabolic health.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {(
              [
                {
                  name: 'protein',
                  label: 'Protein',
                  color: MACRO_COLORS.protein,
                },
                {
                  name: 'carbs',
                  label: 'Carbohydrates',
                  color: MACRO_COLORS.carbs,
                },
                { name: 'fat', label: 'Fats', color: MACRO_COLORS.fat },
              ] as const
            ).map(({ name, label, color }) => (
              <form.Field
                key={name}
                name={name}
                validators={{
                  onChange: zodValidator(goalsFormSchema.shape[name]),
                  onSubmit: zodValidator(goalsFormSchema.shape[name]),
                }}
              >
                {(field) => (
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      {label}
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={
                          name === 'protein'
                            ? '180'
                            : name === 'carbs'
                              ? '250'
                              : '70'
                        }
                        className="px-6 py-4 text-2xl font-semibold pr-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        style={{ borderLeftWidth: 8, borderLeftColor: color }}
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/40 uppercase">
                        grams
                      </span>
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            ))}
          </div>
        </section>

        {/* Section 4 — Micros & Refinement */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <FlaskConical className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-headline font-extrabold">
              Micros &amp; Refinement
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Specify targets for fiber and sodium to ensure comprehensive
              nutritional balance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form.Field
              name="fiber"
              validators={{
                onChange: zodValidator(goalsFormSchema.shape.fiber),
                onSubmit: zodValidator(goalsFormSchema.shape.fiber),
              }}
            >
              {(field) => (
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Target Fiber
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="35"
                      className="pr-10 py-3 text-xl font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/40 uppercase">
                      g
                    </span>
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="sodium"
              validators={{
                onChange: zodValidator(goalsFormSchema.shape.sodium),
                onSubmit: zodValidator(goalsFormSchema.shape.sodium),
              }}
            >
              {(field) => (
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Target Sodium
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="2300"
                      className="pr-10 py-3 text-xl font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/40 uppercase">
                      mg
                    </span>
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>
        </section>

        {/* Submit Area */}
        <div className="pt-8 pb-16 border-t border-border/20 flex flex-col items-center gap-8">
          <div className="text-center max-w-md space-y-2">
            <h3 className="text-xl font-headline font-bold">Ready to start?</h3>
            <p className="text-sm text-muted-foreground">
              Saving these goals will update your daily tracking dashboard and
              progress metrics.
            </p>
          </div>

          {saveSuccess && (
            <Alert role="status" aria-live="polite" className="w-full max-w-sm">
              <AlertDescription>Goals saved successfully!</AlertDescription>
            </Alert>
          )}

          <form.Subscribe selector={(state) => [state.errorMap]}>
            {([errorMap]) =>
              errorMap.onSubmit ? (
                <Alert variant="destructive" className="w-full max-w-sm">
                  <AlertDescription>{String(errorMap.onSubmit)}</AlertDescription>
                </Alert>
              ) : null
            }
          </form.Subscribe>

          <form.Subscribe selector={(state) => [state.isSubmitting]}>
            {([isSubmitting]) => (
              <Button
                type="submit"
                disabled={isSubmitting}
              size="lg"
              className="w-full max-w-sm"
              >
                <span className="flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Goals'
                  )}
                </span>
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}
