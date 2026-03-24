'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCallback, useState } from 'react';
import { format } from 'date-fns';

import { Loader2, Trash2, UtensilsCrossed } from 'lucide-react';

import { FoodLogEntry } from '@/types/food';
import { MEAL_TYPE_ORDER, MEAL_TYPE_LABELS, MEAL_TYPE_COLORS } from '@/lib/nutrition-constants';

interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface FoodLogClientProps {
  logs: FoodLogEntry[];
  logsByMeal: Record<string, FoodLogEntry[]>;
  totals: Totals;
  isLoading?: boolean;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDeleteLog: (logId: string) => Promise<void>;
}

// Dot color for each meal type used in the header
const MEAL_DOT_COLORS: Record<string, string> = {
  breakfast: 'bg-amber-500',
  lunch: 'bg-sky-500',
  dinner: 'bg-violet-500',
  snack: 'bg-emerald-500',
};

// Macro badge styles (light + dark)
const MACRO_BADGE_COLORS = {
  protein: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  carbs: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  fat: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
} as const;

export default function FoodLogClient({
  logs,
  logsByMeal,
  isLoading = false,
  onDeleteLog,
}: FoodLogClientProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteRequest = (logId: string) => {
    setConfirmingDelete(logId);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async (logId: string) => {
    setDeleting(logId);
    setConfirmingDelete(null);
    try {
      await onDeleteLog(logId);
    } catch (error) {
      console.error('Error deleting log:', error);
      setDeleteError('Failed to remove food entry. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmingDelete(null);
  };

  const calculateLogNutrients = useCallback((log: FoodLogEntry) => {
    const quantity = log.quantity || 0;
    // nutrients are per 100g; quantity is always in grams
    return {
      calories: Math.round(((log.food?.calories || 0) / 100) * quantity),
      protein: Math.round(((log.food?.protein || 0) / 100) * quantity * 10) / 10,
      carbs: Math.round(((log.food?.carbs || 0) / 100) * quantity * 10) / 10,
      fat: Math.round(((log.food?.fat || 0) / 100) * quantity * 10) / 10,
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-on-surface-variant">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading meals…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Inline delete error */}
      {deleteError && (
        <div
          role="alert"
          className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl text-sm"
        >
          {deleteError}
          <button className="ml-2 underline hover:no-underline" onClick={() => setDeleteError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Meal sections — always render all 4, empty ones get placeholder */}
      {MEAL_TYPE_ORDER.map((mealType) => {
        const mealLogs = logsByMeal[mealType] || [];
        const isEmpty = mealLogs.length === 0;

        const mealTotals = mealLogs.reduce(
          (acc, log) => {
            const n = calculateLogNutrients(log);
            return {
              calories: acc.calories + n.calories,
              protein: acc.protein + n.protein,
              carbs: acc.carbs + n.carbs,
              fat: acc.fat + n.fat,
            };
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 },
        );

        // Find latest logged time for this meal
        const latestLoggedTime = !isEmpty
          ? (() => {
              const maxTime = Math.max(...mealLogs.map((l) => new Date(l.consumedAt).getTime()));
              return format(new Date(maxTime), 'hh:mm a');
            })()
          : null;

        return (
          <div
            key={mealType}
            className="rounded-2xl border border-outline-variant/20 hover:border-primary/20 transition-all shadow-sm bg-surface-container-lowest dark:bg-surface-container-low overflow-hidden"
          >
            {/* Meal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${MEAL_DOT_COLORS[mealType]}`}
                    aria-hidden
                  />
                  <h3 className="text-base font-bold text-foreground">
                    {MEAL_TYPE_LABELS[mealType]}
                  </h3>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${MEAL_TYPE_COLORS[mealType]}`}
                  >
                    {mealLogs.length} item{mealLogs.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {latestLoggedTime && (
                  <p className="text-xs text-on-surface-variant mt-0.5 ml-[18px]">
                    Logged at {latestLoggedTime}
                  </p>
                )}
              </div>
              {!isEmpty && (
                <span className="text-sm font-bold tabular-nums text-primary shrink-0">
                  {mealTotals.calories} kcal
                </span>
              )}
            </div>

            {/* Food rows or empty placeholder */}
            {isEmpty ? (
              <div
                className="flex items-center justify-center py-8 px-5"
                data-testid={`meal-empty-placeholder-${mealType}`}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <UtensilsCrossed className="h-6 w-6 text-on-surface-variant/30" aria-hidden />
                  <p className="text-sm text-on-surface-variant">
                    No {MEAL_TYPE_LABELS[mealType].toLowerCase()} logged
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {mealLogs.map((log) => {
                  const nutrients = calculateLogNutrients(log);
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-low/50 transition-colors"
                      data-testid={`food-log-${log.id}`}
                    >
                      {/* Photo thumbnail */}
                      {log.food.photoUrl ? (
                        <Image
                          src={log.food.photoUrl}
                          alt={log.food.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-surface-container-high shrink-0 flex items-center justify-center">
                          <UtensilsCrossed className="h-5 w-5 text-on-surface-variant/30" aria-hidden />
                        </div>
                      )}

                      {/* Name + serving + macro badges */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {log.food.name}
                        </p>
                        {log.food.brandName && (
                          <p className="text-xs text-on-surface-variant truncate">
                            {log.food.brandName}
                          </p>
                        )}
                        <p className="text-xs text-on-surface-variant">
                          {log.altMeasure
                            ? `${log.altMeasure.qty} ${log.altMeasure.description}`
                            : `${log.quantity}g`}
                        </p>
                        {/* Macro badges */}
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${MACRO_BADGE_COLORS.protein}`}>
                            P {nutrients.protein}g
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${MACRO_BADGE_COLORS.carbs}`}>
                            C {nutrients.carbs}g
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${MACRO_BADGE_COLORS.fat}`}>
                            F {nutrients.fat}g
                          </span>
                        </div>
                      </div>

                      {/* Calories — right aligned */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold tabular-nums text-foreground">
                          {nutrients.calories} kcal
                        </p>
                      </div>

                      {/* Delete */}
                      {confirmingDelete === log.id ? (
                        <div
                          className="flex items-center gap-1.5 shrink-0"
                          role="group"
                          aria-label={`Confirm removal of ${log.food.name}`}
                        >
                          <button
                            onClick={() => handleDeleteConfirm(log.id)}
                            data-testid={`delete-confirm-${log.id}`}
                            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 hover:border-destructive/40 transition-all"
                          >
                            Remove
                          </button>
                          <button
                            onClick={handleDeleteCancel}
                            data-testid={`delete-cancel-${log.id}`}
                            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 hover:border-primary/40 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRequest(log.id)}
                          disabled={deleting === log.id}
                          className="text-on-surface-variant hover:text-destructive hover:bg-destructive/10 shrink-0"
                          aria-label={`Remove ${log.food.name} from log`}
                          data-testid={`delete-log-${log.id}`}
                        >
                          {deleting === log.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : (
                            <Trash2 className="h-4 w-4" aria-hidden />
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Global empty state */}
      {logs.length === 0 && (
        <div className="text-center py-4" data-testid="empty-state">
          <p className="text-sm text-on-surface-variant">
            Search for foods above to start logging your meals.
          </p>
        </div>
      )}
    </div>
  );
}
