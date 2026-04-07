'use client';

import { useForm } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { MACRO_CELL_BG, MACRO_CELL_BORDER, MACRO_CELL_TEXT } from '@/lib/nutrition-constants';
import { MacroInputCard } from '@/components/macro-input-card';

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

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
  );
}

function FieldError({ errors }: { errors: unknown[] }) {
  if (!errors.length) return null;
  return <p className="text-xs text-destructive mt-1">{String(errors[0])}</p>;
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
        <DialogContent className="md:min-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Diet Plan</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-5 px-6"
          >
            {/* Plan Name */}
            <form.Field
              name="name"
              validators={{ onChange: zodValidator(dietPlanFormSchema.shape.name) }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <FieldLabel required>Plan Name</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g., Summer Shred 2024"
                    className={`${field.state.meta.errors.length ? 'border-destructive' : ''}`}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            {/* Description */}
            <form.Field name="description">
              {(field) => (
                <div className="space-y-1.5">
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                    id={field.name}
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Briefly describe the objectives of this plan..."
                    rows={3}
                    className="border-input placeholder:text-muted-foreground w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none resize-y transition-[color,box-shadow] focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                  />
                </div>
              )}
            </form.Field>

            {/* Macro targets */}
            <div>
              <FieldLabel required>Daily Targets</FieldLabel>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1.5">
                <form.Field
                  name="targetCalories"
                  validators={{ onChange: zodValidator(dietPlanFormSchema.shape.targetCalories) }}
                >
                  {(field) => (
                    <MacroInputCard
                      label="Calories"
                      name={field.name}
                      fieldApi={field}
                      unit="kcal"
                    />
                  )}
                </form.Field>

                <form.Field
                  name="targetProtein"
                  validators={{ onChange: zodValidator(dietPlanFormSchema.shape.targetProtein) }}
                >
                  {(field) => (
                    <MacroInputCard
                      label="Protein"
                      name={field.name}
                      fieldApi={field}
                      unit="g"
                      bgClass={`${MACRO_CELL_BG.protein} border-border/20`}
                      textClass={MACRO_CELL_TEXT.protein}
                      borderClass={MACRO_CELL_BORDER.protein}
                    />
                  )}
                </form.Field>

                <form.Field
                  name="targetCarbs"
                  validators={{ onChange: zodValidator(dietPlanFormSchema.shape.targetCarbs) }}
                >
                  {(field) => (
                    <MacroInputCard
                      label="Carbs"
                      name={field.name}
                      fieldApi={field}
                      unit="g"
                      bgClass={`${MACRO_CELL_BG.carbs} border-border/20`}
                      textClass={MACRO_CELL_TEXT.carbs}
                      borderClass={MACRO_CELL_BORDER.carbs}
                    />
                  )}
                </form.Field>

                <form.Field
                  name="targetFat"
                  validators={{ onChange: zodValidator(dietPlanFormSchema.shape.targetFat) }}
                >
                  {(field) => (
                    <MacroInputCard
                      label="Fat"
                      name={field.name}
                      fieldApi={field}
                      unit="g"
                      bgClass={`${MACRO_CELL_BG.fat} border-border/20`}
                      textClass={MACRO_CELL_TEXT.fat}
                      borderClass={MACRO_CELL_BORDER.fat}
                    />
                  )}
                </form.Field>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <form.Field
                name="startDate"
                validators={{ onChange: zodValidator(dietPlanFormSchema.shape.startDate) }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <FieldLabel required>Start Date</FieldLabel>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value instanceof Date ? field.state.value.toISOString().split('T')[0] : ''}
                      onChange={(e) => field.handleChange(new Date(e.target.value))}
                      onBlur={field.handleBlur}
                      className={field.state.meta.errors.length ? 'border-destructive' : ''}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>

              <form.Field name="endDate">
                {(field) => (
                  <div className="space-y-1.5">
                    <FieldLabel>End Date (Optional)</FieldLabel>
                    <Input
                      id={field.name}
                      type="date"
                      value={field.state.value instanceof Date ? field.state.value.toISOString().split('T')[0] : ''}
                      onChange={(e) => field.handleChange(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            {/* Initial Status */}
            <form.Field name="status">
              {(field) => (
                <div className="space-y-1.5">
                  <FieldLabel required>Initial Status</FieldLabel>
                  <div className="flex gap-2">
                    {(['active', 'draft', 'archived'] as const).map((s) => {
                      const selected = field.state.value === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => field.handleChange(s)}
                          className={`flex-1 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-colors ${
                            selected
                              ? 'border-2 border-primary text-primary bg-white'
                              : 'border border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </form.Field>

            <div className="flex gap-3 pt-2 pb-6">
              <Button type="button" variant="outline" onClick={onClose} className="w-[30%] font-medium bg-background">
                Cancel
              </Button>
              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create Plan
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
