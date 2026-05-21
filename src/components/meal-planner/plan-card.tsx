'use client';

import { useEffect, useState } from 'react';
import { Copy, Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import {
  useDeleteDietPlanMutation,
  useDuplicateDietPlanMutation,
  useUpdateDietPlanMutation,
  useDietPlansQuery,
} from '@/queries/diet-plans';
import { useActivatePlan } from '@/hooks/use-activate-plan';
import { MACRO_TEXT_COLORS } from '@/lib/nutrition-constants';

// ─── PlanOptionsMenu ──────────────────────────────────────────────────────────

interface PlanOptionsMenuProps {
  plan: DietPlanDTO;
  onEdit?: (plan: DietPlanDTO) => void;
  onDuplicated?: (planId: string) => void;
  onDeleted?: (planId: string) => void;
  /** Override testid prefix to avoid strict-mode duplicates across responsive UIs */
  testIdPrefix?: string;
}

export function PlanOptionsMenu({
  plan,
  onEdit,
  onDuplicated,
  onDeleted,
  testIdPrefix = 'plan',
}: PlanOptionsMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inlineConfirmOpen, setInlineConfirmOpen] = useState(false);
  const [useInlineDeleteConfirm, setUseInlineDeleteConfirm] = useState(false);
  const plansQuery = useDietPlansQuery();
  const updateMutation = useUpdateDietPlanMutation();
  const deleteMutation = useDeleteDietPlanMutation();
  const duplicateMutation = useDuplicateDietPlanMutation();
  const { activate, conflict } = useActivatePlan();

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setUseInlineDeleteConfirm(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

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
    setInlineConfirmOpen(false);
    setDeleteDialogOpen(false);
    onDeleted?.(plan.id);
  }

  function handleDeleteRequest() {
    if (useInlineDeleteConfirm) {
      setInlineConfirmOpen(true);
      return;
    }

    setDeleteDialogOpen(true);
  }

  async function handleDuplicate() {
    const res = await duplicateMutation.mutateAsync(plan.id);
    onDuplicated?.(res.plan.id);
  }

  return (
    <>
      {inlineConfirmOpen ? (
        <div className="hidden lg:flex items-center gap-1.5 shrink-0" role="group" aria-label={`Confirm deletion of ${plan.name}`}>
          <Button
            variant="destructive"
            size="sm"
            data-testid="plan-delete-confirm"
            disabled={deleteMutation.isPending}
            onClick={(event) => {
              event.stopPropagation();
              void handleDelete();
            }}
            className="text-xs h-auto py-1.5 px-3 rounded-full"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-testid="plan-delete-cancel"
            disabled={deleteMutation.isPending}
            onClick={(event) => {
              event.stopPropagation();
              setInlineConfirmOpen(false);
            }}
            className="text-xs h-auto py-1.5 px-3 rounded-full"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              data-testid={`${testIdPrefix}-menu-trigger-${plan.id}`}
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 -mr-1.5 text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              data-testid={`${testIdPrefix}-menu-edit-${plan.id}`}
              onSelect={() => onEdit?.(plan)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid={`${testIdPrefix}-menu-duplicate-${plan.id}`}
              disabled={duplicateMutation.isPending}
              onSelect={() => void handleDuplicate()}
            >
              {duplicateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid={`${testIdPrefix}-menu-set-active-${plan.id}`}
              disabled={plan.status === 'active'}
              onSelect={() => handleStatusChange('active')}
            >
              Set Active
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid={`${testIdPrefix}-menu-set-draft-${plan.id}`}
              disabled={plan.status === 'draft'}
              onSelect={() => handleStatusChange('draft')}
            >
              Set Draft
            </DropdownMenuItem>
            <DropdownMenuItem
              data-testid={`${testIdPrefix}-menu-archive-${plan.id}`}
              disabled={plan.status === 'archived'}
              onSelect={() => handleStatusChange('archived')}
            >
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid={`${testIdPrefix}-menu-delete-${plan.id}`}
              className="text-destructive focus:text-destructive"
              onSelect={handleDeleteRequest}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {conflict && (
        <AlertDialog open>
          <AlertDialogContent data-testid="activate-conflict-dialog" onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive current active plan?</AlertDialogTitle>
              <AlertDialogDescription data-testid="activate-conflict-description">
                Activating &quot;{plan.name}&quot; will archive &quot;{conflict.conflictPlan.name}&quot;. Continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="activate-conflict-cancel" onClick={conflict.onCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction data-testid="activate-conflict-confirm" onClick={conflict.onConfirm}>Archive and Activate</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{plan.name}&quot; and all its meals. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="plan-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="plan-delete-confirm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── PlanCard ─────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: DietPlanDTO;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: (plan: DietPlanDTO) => void;
  onDuplicated?: (planId: string) => void;
  onDeleted?: (planId: string) => void;
}

function progressLabel(plan: DietPlanDTO): string {
  if (plan.status === 'archived') return 'Overall Completion';
  if (plan.status === 'draft') return 'Setup Incomplete';
  return 'Weekly Progress';
}

export function PlanCard({ plan, isSelected, onSelect, onEdit, onDuplicated, onDeleted }: PlanCardProps) {
  const isActive = plan.status === 'active';
  const completeness = plan.completeness ?? 0;

  return (
    <div
      data-testid={`plan-card-${plan.id}`}
      onClick={onSelect}
      className={cn(
        'plan-card relative flex flex-col gap-4 p-5 rounded-2xl border cursor-pointer transition-all select-none w-[320px] shrink-0',
        isSelected && 'bg-primary/10 dark:bg-secondary',
      )}
    >
      {/* Status badge + menu */}
      <div className="flex items-center justify-between">
        <span
          data-testid={`plan-status-badge-${plan.id}`}
          className={cn(
            'text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full',
            isActive
              ? 'bg-primary text-primary-foreground'
              : plan.status === 'draft'
                ? 'bg-muted text-muted-foreground border border-border'
                : 'bg-muted text-muted-foreground',
          )}
        >
          {isActive ? 'Active Plan' : plan.status === 'draft' ? 'Draft' : 'Archived'}
        </span>

        <PlanOptionsMenu
          plan={plan}
          onEdit={onEdit}
          onDuplicated={onDuplicated}
          onDeleted={onDeleted}
          testIdPrefix="plan"
        />
      </div>

      {/* Plan name */}
      <p data-testid={`plan-name-${plan.id}`} className="text-2xl font-bold text-foreground truncate">{plan.name}</p>

      {/* Calories row */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">Calories</p>
          <p data-testid={`plan-target-calories-${plan.id}`} className="text-2xl font-bold text-foreground tabular-nums">
            {plan.targetCalories ? `${Math.round(plan.targetCalories).toLocaleString()} kcal` : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">Daily Average</p>
          <p data-testid={`plan-avg-calories-${plan.id}`} className="text-sm font-semibold text-foreground tabular-nums">
            {plan.avgDailyCalories ? `${Math.round(plan.avgDailyCalories).toLocaleString()} kcal` : '0 kcal'}
          </p>
        </div>
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
          <span data-testid={`plan-completeness-${plan.id}`} className="font-semibold text-foreground">{completeness}%</span>
        </div>
        <Progress
          value={completeness}
          className={cn('h-1.5', isActive && '[&>div]:bg-primary')}
        />
      </div>
    </div>
  );
}
