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
import { DateInput } from '@/components/ui/date-input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

function toIsoDate(date: Date | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromIsoDate(value: string): Date | undefined {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }
  return date;
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
          targetCalories: Number(value.targetCalories),
          targetProtein: Number(value.targetProtein),
          targetCarbs: Number(value.targetCarbs),
          targetFat: Number(value.targetFat),
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
        <DialogContent data-testid="new-plan-modal" className="md:min-w-2xl">
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
                    data-testid="plan-name-input"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g., Summer Shred 2024"
                    className={`${field.state.meta.errors.length ? 'border-destructive' : ''}`}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p data-testid="plan-name-error" className="text-xs text-destructive mt-1">{String(field.state.meta.errors[0])}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Description */}
            <form.Field name="description">
              {(field) => (
                <div className="space-y-1.5">
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    id={field.name}
                    data-testid="plan-description-input"
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Briefly describe the objectives of this plan..."
                    rows={3}
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
                      inputTestId="plan-target-calories-input"
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
                      bgClass={`${MACRO_CELL_BG.protein} border-border`}
                      textClass={MACRO_CELL_TEXT.protein}
                      borderClass={MACRO_CELL_BORDER.protein}
                      inputTestId="plan-target-protein-input"
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
                      bgClass={`${MACRO_CELL_BG.carbs} border-border`}
                      textClass={MACRO_CELL_TEXT.carbs}
                      borderClass={MACRO_CELL_BORDER.carbs}
                      inputTestId="plan-target-carbs-input"
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
                      bgClass={`${MACRO_CELL_BG.fat} border-border`}
                      textClass={MACRO_CELL_TEXT.fat}
                      borderClass={MACRO_CELL_BORDER.fat}
                      inputTestId="plan-target-fat-input"
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
                    <DateInput
                      id={field.name}
                      inputTestId="plan-start-date-input"
                      inputClassName={field.state.meta.errors.length ? 'border-destructive' : ''}
                      value={toIsoDate(field.state.value instanceof Date ? field.state.value : undefined)}
                      onChange={(v) => {
                        const parsed = fromIsoDate(v);
                        if (parsed) {
                          field.handleChange(parsed);
                        }
                      }}
                      onBlur={field.handleBlur}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>

              <form.Field name="endDate">
                {(field) => (
                  <div className="space-y-1.5">
                    <FieldLabel>End Date (Optional)</FieldLabel>
                    <DateInput
                      id={field.name}
                      inputTestId="plan-end-date-input"
                      value={toIsoDate(field.state.value instanceof Date ? field.state.value : undefined)}
                      onChange={(v) => field.handleChange(v ? fromIsoDate(v) : undefined)}
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
                  <ToggleGroup
                    type="single"
                    value={field.state.value}
                    onValueChange={(v) => { if (v) field.handleChange(v as 'active' | 'draft' | 'archived'); }}
                    className="justify-start"
                  >
                    <ToggleGroupItem data-testid="plan-status-draft" value="draft" className="flex-1 text-xs font-bold uppercase tracking-widest">Draft</ToggleGroupItem>
                    <ToggleGroupItem data-testid="plan-status-active" value="active" className="flex-1 text-xs font-bold uppercase tracking-widest">Active</ToggleGroupItem>
                    <ToggleGroupItem data-testid="plan-status-archived" value="archived" className="flex-1 text-xs font-bold uppercase tracking-widest">Archived</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}
            </form.Field>

            <div className="flex gap-3 pt-2 pb-6">
              <Button data-testid="new-plan-cancel" type="button" variant="outline" onClick={onClose} className="w-[30%] font-medium bg-background">
                Cancel
              </Button>
              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <Button data-testid="new-plan-submit" type="submit" disabled={isSubmitting} className="flex-1">
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
          <AlertDialogContent data-testid="activate-conflict-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Archive current active plan?</AlertDialogTitle>
              <AlertDialogDescription data-testid="activate-conflict-description">
                Activating this plan will archive &quot;{conflict.conflictPlan.name}&quot;. Continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="activate-conflict-cancel" onClick={conflict.onCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction data-testid="activate-conflict-confirm" onClick={conflict.onConfirm}>Archive and Activate</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
