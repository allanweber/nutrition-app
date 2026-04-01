'use client';

import { useState } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { DietPlanDTO } from '@/server/services/diet-plan.service';
import { useDeleteDietPlanMutation, useUpdateDietPlanMutation, useDietPlansQuery } from '@/queries/diet-plans';
import { useActivatePlan } from '@/hooks/use-activate-plan';
import { MACRO_TEXT_COLORS } from '@/lib/nutrition-constants';

interface PlanCardProps {
  plan: DietPlanDTO;
  isSelected: boolean;
  onSelect: () => void;
}

function progressLabel(plan: DietPlanDTO): string {
  if (plan.status === 'archived') return 'Overall Completion';
  if ((plan.completeness ?? 0) === 0) return 'Setup Incomplete';
  return 'Weekly Progress';
}

export function PlanCard({ plan, isSelected, onSelect }: PlanCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const plansQuery = useDietPlansQuery();
  const updateMutation = useUpdateDietPlanMutation();
  const deleteMutation = useDeleteDietPlanMutation();
  const { activate, conflict } = useActivatePlan();

  const isActive = plan.status === 'active';
  const completeness = plan.completeness ?? 0;

  async function handleStatusChange(status: 'active' | 'draft' | 'archived') {
    if (status === plan.status) return;
    if (status === 'active') {
      await activate({
        plans: (plansQuery.data?.plans ?? []).filter((p) => p.id !== plan.id),
        onProceed: () => updateMutation.mutateAsync({ planId: plan.id, status }),
      });
    } else {
      await updateMutation.mutateAsync({ planId: plan.id, status });
    }
  }

  async function handleDelete() {
    await deleteMutation.mutateAsync(plan.id);
    setDeleteDialogOpen(false);
  }

  return (
    <>
      <div
        onClick={onSelect}
        className={cn(
          'relative flex flex-col gap-4 p-5 rounded-2xl border cursor-pointer transition-all select-none w-[320px] shrink-0',
          isSelected && 'bg-[#C1F0B1] dark:bg-surface-container text-white',
        )}
      >
        {/* Status badge + menu */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full',
              isActive
                ? 'bg-emerald-800 text-white'
                : plan.status === 'draft'
                  ? 'bg-muted text-muted-foreground border border-border'
                  : 'bg-zinc-200 text-zinc-600',
            )}
          >
            {isActive ? 'Active Plan' : plan.status === 'draft' ? 'Draft' : 'Archived'}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-1.5 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem disabled={plan.status === 'active'} onSelect={() => handleStatusChange('active')}>
                Set Active
              </DropdownMenuItem>
              <DropdownMenuItem disabled={plan.status === 'draft'} onSelect={() => handleStatusChange('draft')}>
                Set Draft
              </DropdownMenuItem>
              <DropdownMenuItem disabled={plan.status === 'archived'} onSelect={() => handleStatusChange('archived')}>
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Plan name */}
        <p className="text-2xl font-bold text-foreground truncate">{plan.name}</p>

        {/* Calories row */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">Calories</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {plan.targetCalories ? `${Math.round(plan.targetCalories).toLocaleString()} kcal` : '—'}
            </p>
          </div>
          {plan.status === 'archived' ? (
            <div className="text-right">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">Status</p>
              <p className="text-sm font-semibold text-foreground">Completed</p>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">Daily Average</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {plan.avgDailyCalories ? `${Math.round(plan.avgDailyCalories).toLocaleString()} kcal` : '0 kcal'}
              </p>
            </div>
          )}
        </div>

        {/* Macros */}
        <div className="flex gap-10 text-xs">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">Protein</p>
            <p className={`text-sm font-bold ${MACRO_TEXT_COLORS.protein}`}>{plan.targetProtein ? `${Math.round(plan.targetProtein)}g` : '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">Carbs</p>
            <p className={`text-sm font-bold ${MACRO_TEXT_COLORS.carbs}`}>{plan.targetCarbs ? `${Math.round(plan.targetCarbs)}g` : '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">Fats</p>
            <p className={`text-sm font-bold ${MACRO_TEXT_COLORS.fat}`}>{plan.targetFat ? `${Math.round(plan.targetFat)}g` : '—'}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{progressLabel(plan)}</span>
            <span className="font-semibold text-foreground">{completeness}%</span>
          </div>
          <Progress
            value={completeness}
            className={cn('h-1.5', isActive && '[&>div]:bg-emerald-800')}
          />
        </div>
      </div>

      {/* Conflict AlertDialog */}
      {conflict && (
        <AlertDialog open>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive current active plan?</AlertDialogTitle>
              <AlertDialogDescription>
                Activating &quot;{plan.name}&quot; will archive &quot;{conflict.conflictPlan.name}&quot;. Continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={conflict.onCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={conflict.onConfirm}>Archive and Activate</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{plan.name}&quot; and all its meals. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
