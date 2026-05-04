'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLogFromPlanMutation } from '@/queries/food-logs';

interface LogMealsModalProps {
  open: boolean;
  planName: string;
  date: string;
  planId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function LogMealsModal({
  open,
  planName,
  date,
  planId,
  onClose,
  onSuccess,
}: LogMealsModalProps) {
  const mutation = useLogFromPlanMutation();
  const [pendingMode, setPendingMode] = useState<'add-all' | 'replace-all' | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (mutation.isPending) return;
    if (!nextOpen) {
      setPendingMode(null);
      onClose();
    }
  };

  const handleSubmit = async (mode: 'add-all' | 'replace-all') => {
    setPendingMode(mode);

    try {
      await mutation.mutateAsync({ mode, date, planId });
      onSuccess();
      setPendingMode(null);
      onClose();
    } catch (error) {
      setPendingMode(null);
      toast.error((error as Error).message ?? 'Failed to log meals from plan.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0" data-testid="log-meals-modal">
        <DialogHeader>
          <DialogTitle>Log meals from plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-2">
          <button
            type="button"
            onClick={() => handleSubmit('add-all')}
            disabled={mutation.isPending}
            data-testid="log-meals-add-btn"
            className="w-full rounded-2xl border border-border/60 bg-muted/30 p-4 text-left transition-colors hover:border-primary/20 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <p className="text-sm font-medium text-foreground">Add to existing log</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Keeps your current entries and merges matching foods by meal and serving unit.
            </p>
            {pendingMode === 'add-all' ? (
              <span className="mt-3 inline-flex items-center text-xs font-medium text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Applying plan...
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('replace-all')}
            disabled={mutation.isPending}
            data-testid="log-meals-replace-btn"
            className="w-full rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-left transition-colors hover:border-destructive/40 hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">Replace planned meal types</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Only meal types included in this day&apos;s plan are replaced. Unplanned meal types stay untouched.
                </p>
                {pendingMode === 'replace-all' ? (
                  <span className="mt-3 inline-flex items-center text-xs font-medium text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    Applying plan...
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        </div>

        <div className="border-t border-border/70 bg-secondary/40 px-6 py-4">
          <p className="text-center text-sm text-foreground">
            Select one of the options above to continue.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}