'use client';

import { useForm } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dietPlanFormSchema, zodValidator } from '@/lib/form-validation';
import type { DietPlanFormData } from '@/lib/form-validation';
import { useCreateDietPlanMutation } from '@/queries/diet-plans';
import { useActivatePlan } from '@/hooks/use-activate-plan';
import type { DietPlanDTO } from '@/server/services/diet-plan.service';

interface NutritionGoalDefaults {
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
}

interface NewPlanModalProps {
  open: boolean;
  plans: DietPlanDTO[];
  nutritionGoalDefaults: NutritionGoalDefaults | null;
  onClose: () => void;
  onCreated: (planId: string) => void;
}

export function NewPlanModal({ open, plans, nutritionGoalDefaults, onClose, onCreated }: NewPlanModalProps) {
  const createMutation = useCreateDietPlanMutation();
  const { activate, conflict } = useActivatePlan();

  const defaults = nutritionGoalDefaults ?? { targetCalories: null, targetProtein: null, targetCarbs: null, targetFat: null };

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      targetCalories: defaults.targetCalories ?? ('' as unknown as number),
      targetProtein: defaults.targetProtein ?? ('' as unknown as number),
      targetCarbs: defaults.targetCarbs ?? ('' as unknown as number),
      targetFat: defaults.targetFat ?? ('' as unknown as number),
      startDate: new Date(),
      endDate: undefined,
      status: 'draft',
    } as DietPlanFormData,
    onSubmit: async ({ value }) => {
      const status = value.status as 'active' | 'draft' | 'archived';

      async function proceed() {
        const res = await createMutation.mutateAsync({
          name: value.name,
          description: value.description || undefined,
          targetCalories: value.targetCalories,
          targetProtein: value.targetProtein,
          targetCarbs: value.targetCarbs,
          targetFat: value.targetFat,
          startDate: value.startDate.toISOString(),
          endDate: value.endDate?.toISOString(),
          status,
        });
        onCreated(res.plan.id);
      }

      if (status === 'active') {
        await activate({ plans, onProceed: proceed });
      } else {
        await proceed();
      }
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Meal Plan</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            {/* Name */}
            <form.Field
              name="name"
              validators={{ onChange: zodValidator(dietPlanFormSchema.shape.name) }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>Plan name *</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g. Cutting Phase"
                    className={field.state.meta.errors.length ? 'border-destructive' : ''}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">{String(field.state.meta.errors[0])}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Description */}
            <form.Field name="description">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>Description</Label>
                  <Input
                    id={field.name}
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Optional notes"
                  />
                </div>
              )}
            </form.Field>

            {/* Macro targets */}
            <div className="grid grid-cols-2 gap-3">
              <form.Field
                name="targetCalories"
                validators={{ onChange: zodValidator(dietPlanFormSchema.shape.targetCalories) }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Calories (kcal) *</Label>
                    <Input
                      id={field.name}
                      type="number"
                      min={0}
                      value={field.state.value as unknown as string}
                      onChange={(e) => field.handleChange(e.target.value as unknown as number)}
                      onBlur={field.handleBlur}
                      className={field.state.meta.errors.length ? 'border-destructive' : ''}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">{String(field.state.meta.errors[0])}</p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="targetProtein"
                validators={{ onChange: zodValidator(dietPlanFormSchema.shape.targetProtein) }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Protein (g) *</Label>
                    <Input
                      id={field.name}
                      type="number"
                      min={0}
                      value={field.state.value as unknown as string}
                      onChange={(e) => field.handleChange(e.target.value as unknown as number)}
                      onBlur={field.handleBlur}
                      className={field.state.meta.errors.length ? 'border-destructive' : ''}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">{String(field.state.meta.errors[0])}</p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="targetCarbs"
                validators={{ onChange: zodValidator(dietPlanFormSchema.shape.targetCarbs) }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Carbs (g) *</Label>
                    <Input
                      id={field.name}
                      type="number"
                      min={0}
                      value={field.state.value as unknown as string}
                      onChange={(e) => field.handleChange(e.target.value as unknown as number)}
                      onBlur={field.handleBlur}
                      className={field.state.meta.errors.length ? 'border-destructive' : ''}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">{String(field.state.meta.errors[0])}</p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="targetFat"
                validators={{ onChange: zodValidator(dietPlanFormSchema.shape.targetFat) }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Fat (g) *</Label>
                    <Input
                      id={field.name}
                      type="number"
                      min={0}
                      value={field.state.value as unknown as string}
                      onChange={(e) => field.handleChange(e.target.value as unknown as number)}
                      onBlur={field.handleBlur}
                      className={field.state.meta.errors.length ? 'border-destructive' : ''}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">{String(field.state.meta.errors[0])}</p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            {/* Start date */}
            <form.Field
              name="startDate"
              validators={{ onChange: zodValidator(dietPlanFormSchema.shape.startDate) }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>Start date *</Label>
                  <Input
                    id={field.name}
                    type="date"
                    value={field.state.value instanceof Date ? field.state.value.toISOString().split('T')[0] : ''}
                    onChange={(e) => field.handleChange(new Date(e.target.value))}
                    onBlur={field.handleBlur}
                    className={field.state.meta.errors.length ? 'border-destructive' : ''}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">{String(field.state.meta.errors[0])}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Status */}
            <form.Field name="status">
              {(field) => (
                <div className="flex items-center gap-3">
                  <Label>Start as</Label>
                  <div className="flex gap-2">
                    {(['draft', 'active'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => field.handleChange(s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          field.state.value === s
                            ? s === 'active'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                              : 'bg-muted text-muted-foreground border-border'
                            : 'border-border text-on-surface-variant hover:bg-muted/50'
                        }`}
                      >
                        {s === 'draft' ? 'Draft' : 'Active'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form.Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Plan
                  </Button>
                )}
              </form.Subscribe>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Active plan conflict */}
      {conflict && (
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive current active plan?</AlertDialogTitle>
              <AlertDialogDescription>
                Activating this plan will archive &quot;{conflict.conflictPlan.name}&quot;. Continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={conflict.onCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={conflict.onConfirm}>Archive and Activate</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
