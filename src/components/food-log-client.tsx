'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';

import { Loader2, Trash2, UtensilsCrossed, ChefHat, ChevronDown } from 'lucide-react';
import { FavoriteToggleButton } from '@/components/favorite-toggle-button';

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
  onDeleteDishGroup?: (dishLogGroupId: string) => Promise<void>;
  onEdit?: (log: FoodLogEntry) => void;
}

// Dot color for each meal type used in the header
const MEAL_DOT_COLORS: Record<string, string> = {
  breakfast: 'bg-amber-500',
  lunch: 'bg-sky-500',
  dinner: 'bg-violet-500',
  snack: 'bg-emerald-500',
  morning_snack: 'bg-amber-500',
  afternoon_snack: 'bg-orange-500',
  evening_snack: 'bg-indigo-500',
  pre_workout: 'bg-lime-500',
  post_workout: 'bg-teal-500',
  other: 'bg-muted-foreground',
};


function groupByDish(logs: FoodLogEntry[]) {
  type DishGroup = { dishLogGroupId: string; dishNameSnapshot: string; items: FoodLogEntry[] };
  const groups: Array<FoodLogEntry | DishGroup> = [];
  const seen = new Map<string, DishGroup>();

  for (const log of logs) {
    if (log.dishLogGroupId) {
      if (!seen.has(log.dishLogGroupId)) {
        const group: DishGroup = {
          dishLogGroupId: log.dishLogGroupId,
          dishNameSnapshot: log.dishNameSnapshot ?? 'Dish',
          items: [],
        };
        seen.set(log.dishLogGroupId, group);
        groups.push(group);
      }
      seen.get(log.dishLogGroupId)!.items.push(log);
    } else {
      groups.push(log);
    }
  }
  return groups;
}

type GroupEntry =
  | FoodLogEntry
  | { dishLogGroupId: string; dishNameSnapshot: string; items: FoodLogEntry[] };

function isDishGroup(entry: GroupEntry): entry is { dishLogGroupId: string; dishNameSnapshot: string; items: FoodLogEntry[] } {
  return 'dishLogGroupId' in entry && 'items' in entry;
}

export default function FoodLogClient({
  logs,
  logsByMeal,
  onEdit,
  isLoading = false,
  onDeleteLog,
  onDeleteDishGroup,
}: FoodLogClientProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [collapsedMeals, setCollapsedMeals] = useState<Set<string>>(new Set());
  const initialCollapseApplied = useRef(false);

  useEffect(() => {
    if (isLoading || initialCollapseApplied.current) return;
    initialCollapseApplied.current = true;
    setCollapsedMeals(new Set(
      MEAL_TYPE_ORDER.filter((mt) => !logsByMeal[mt] || logsByMeal[mt].length === 0)
    ));
  }, [isLoading, logsByMeal]);

  const handleDeleteRequest = (id: string) => {
    setConfirmingDelete(id);
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

  const handleDeleteGroupRequest = (dishLogGroupId: string) => {
    setConfirmingDelete(`group:${dishLogGroupId}`);
    setDeleteError(null);
  };

  const handleDeleteGroupConfirm = async (dishLogGroupId: string) => {
    const key = `group:${dishLogGroupId}`;
    setDeleting(key);
    setConfirmingDelete(null);
    try {
      await onDeleteDishGroup?.(dishLogGroupId);
    } catch {
      setDeleteError('Failed to remove dish group. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmingDelete(null);
  };

  const calculateLogNutrients = useCallback((log: FoodLogEntry) => {
    const quantity = log.quantity || 0;
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

      {/* Meal sections */}
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

        const latestLoggedTime = !isEmpty
          ? (() => {
              const maxTime = Math.max(...mealLogs.map((l) => new Date(l.consumedAt).getTime()));
              return format(new Date(maxTime), 'hh:mm a');
            })()
          : null;

        const grouped = groupByDish(mealLogs);
        const isMealCollapsed = collapsedMeals.has(mealType);
        const toggleMeal = () => {
          setCollapsedMeals((prev) => {
            const next = new Set(prev);
            if (next.has(mealType)) next.delete(mealType);
            else next.add(mealType);
            return next;
          });
        };

        return (
          <div
            key={mealType}
            data-testid={`meal-section-${mealType}`}
            className="rounded-2xl border border-outline-variant/20 hover:border-primary/20 transition-all shadow-sm bg-surface-container-lowest dark:bg-surface-container-low overflow-hidden"
          >
            {/* Meal header */}
            <button
              type="button"
              onClick={toggleMeal}
              aria-expanded={!isMealCollapsed}
              data-testid={`meal-toggle-${mealType}`}
              className={`w-full flex items-center justify-between px-5 py-4 text-left group transition-colors hover:bg-surface-container/40 ${!isMealCollapsed && !isEmpty ? 'border-b border-outline-variant/10' : ''}`}
            >
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
              <div className="flex items-center gap-2 shrink-0">
                {!isEmpty && (
                  <span className="text-sm font-bold tabular-nums text-primary">
                    {mealTotals.calories} kcal
                  </span>
                )}
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-outline-variant/20 group-hover:bg-outline-variant/40 transition-colors">
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-on-surface-variant transition-transform duration-200 ${isMealCollapsed ? '-rotate-90' : ''}`}
                    aria-hidden
                  />
                </span>
              </div>
            </button>

            {!isMealCollapsed && isEmpty ? (
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
            ) : !isMealCollapsed ? (
              <div className="divide-y divide-outline-variant/10">
                {grouped.map((entry) => {
                  if (isDishGroup(entry)) {
                    const groupKey = `group:${entry.dishLogGroupId}`;
                    const groupCalories = entry.items.reduce((acc, log) => acc + calculateLogNutrients(log).calories, 0);
                    const isCollapsed = !collapsedGroups.has(entry.dishLogGroupId);

                    const toggleCollapse = () => {
                      setCollapsedGroups((prev) => {
                        const next = new Set(prev);
                        if (next.has(entry.dishLogGroupId)) {
                          next.delete(entry.dishLogGroupId);
                        } else {
                          next.add(entry.dishLogGroupId);
                        }
                        return next;
                      });
                    };

                    return (
                      <div key={entry.dishLogGroupId} className="bg-surface-container/30">
                        {/* Dish group header */}
                        <div className="flex items-center justify-between px-5 py-2 bg-violet-50/50 dark:bg-violet-900/10 border-b border-violet-100/50 dark:border-violet-800/20">
                          <button
                            type="button"
                            onClick={toggleCollapse}
                            className="flex items-center gap-2 flex-1 min-w-0 text-left group"
                            aria-expanded={!isCollapsed}
                          >
                            <ChefHat className="h-3.5 w-3.5 text-violet-500 shrink-0" aria-hidden />
                            <span className="text-xs font-semibold text-violet-700 dark:text-violet-400 truncate">
                              From: {entry.dishNameSnapshot}
                            </span>
                            <span className="shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-violet-200/70 dark:bg-violet-700/40 group-hover:bg-violet-300/80 dark:group-hover:bg-violet-600/50 transition-colors">
                              <ChevronDown
                                className={`h-3 w-3 text-violet-700 dark:text-violet-300 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                                aria-hidden
                              />
                            </span>
                          </button>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold tabular-nums text-violet-600 dark:text-violet-400">
                              {groupCalories} kcal
                            </span>
                            {confirmingDelete === groupKey ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteGroupConfirm(entry.dishLogGroupId)}
                                  className="text-[10px] font-semibold px-2 py-1 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-all"
                                  data-testid={`delete-group-confirm-${entry.dishLogGroupId}`}
                                >
                                  Remove all
                                </button>
                                <button
                                  onClick={handleDeleteCancel}
                                  className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-violet-500/50 hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteGroupRequest(entry.dishLogGroupId)}
                                disabled={deleting === groupKey}
                                aria-label={`Remove entire ${entry.dishNameSnapshot} dish`}
                                data-testid={`delete-dish-group-${entry.dishLogGroupId}`}
                              >
                                {deleting === groupKey ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Dish items */}
                        {!isCollapsed && entry.items.map((log) => {
                          const nutrients = calculateLogNutrients(log);
                          return (
                            <FoodLogRow
                              key={log.id}
                              log={log}
                              nutrients={nutrients}
                              confirmingDelete={confirmingDelete}
                              deleting={deleting}
                              onDeleteRequest={handleDeleteRequest}
                              onDeleteConfirm={handleDeleteConfirm}
                              onDeleteCancel={handleDeleteCancel}
                              onEdit={onEdit}
                              indent
                            />
                          );
                        })}
                      </div>
                    );
                  }

                  // Regular food log item
                  const log = entry as FoodLogEntry;
                  const nutrients = calculateLogNutrients(log);
                  return (
                    <FoodLogRow
                      key={log.id}
                      log={log}
                      nutrients={nutrients}
                      confirmingDelete={confirmingDelete}
                      deleting={deleting}
                      onDeleteRequest={handleDeleteRequest}
                      onDeleteConfirm={handleDeleteConfirm}
                      onDeleteCancel={handleDeleteCancel}
                      onEdit={onEdit}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}

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

interface FoodLogRowProps {
  log: FoodLogEntry;
  nutrients: { calories: number; protein: number; carbs: number; fat: number };
  confirmingDelete: string | null;
  deleting: string | null;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => Promise<void>;
  onDeleteCancel: () => void;
  onEdit?: (log: FoodLogEntry) => void;
  indent?: boolean;
}

const MACRO_BADGE_COLORS2 = {
  protein: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  carbs: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  fat: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
} as const;

function FoodLogRow({ log, nutrients, confirmingDelete, deleting, onDeleteRequest, onDeleteConfirm, onDeleteCancel, onEdit, indent = false }: FoodLogRowProps) {
  return (
    <div
      className={`flex items-center gap-3 py-3 transition-colors ${indent ? 'pl-8 pr-5' : 'px-5'}`}
      data-testid={`food-log-${log.id}`}
    >
      <button
        type="button"
        onClick={() => onEdit?.(log)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-75 transition-opacity"
        aria-label={`Edit ${log.food.name}`}
      >
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

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{log.food.name}</p>
          {log.food.brandName && (
            <p className="text-xs text-on-surface-variant truncate">{log.food.brandName}</p>
          )}
          <p className="text-xs text-on-surface-variant">
            {log.altMeasure
              ? `${log.altMeasure.description}`
              : `${log.quantity}g`}
          </p>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${MACRO_BADGE_COLORS2.protein}`}>
              P {nutrients.protein}g
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${MACRO_BADGE_COLORS2.carbs}`}>
              C {nutrients.carbs}g
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${MACRO_BADGE_COLORS2.fat}`}>
              F {nutrients.fat}g
            </span>
          </div>
        </div>
      </button>

      <div className="text-right shrink-0">
        <p className="text-sm font-bold tabular-nums text-foreground">{nutrients.calories} kcal</p>
      </div>

      <FavoriteToggleButton foodId={log.food.id} />

      {confirmingDelete === log.id ? (
        <div className="flex items-center gap-1.5 shrink-0" role="group" aria-label={`Confirm removal of ${log.food.name}`}>
          <button
            onClick={() => onDeleteConfirm(log.id)}
            data-testid={`delete-confirm-${log.id}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 hover:border-destructive/40 transition-all"
          >
            Remove
          </button>
          <button
            onClick={onDeleteCancel}
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
          onClick={() => onDeleteRequest(log.id)}
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
}
