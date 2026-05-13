'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';

import { Loader2, Plus, Trash2, UtensilsCrossed, ChefHat, ChevronDown, Sunrise, Sandwich, Moon } from 'lucide-react';
import { FavoriteToggleButton } from '@/components/favorite-toggle-button';
import { MealPlanAddon } from '@/components/food-log/meal-plan-addon';

import { FoodLogEntry } from '@/types/food';
import { MEAL_TYPE_ORDER, MEAL_TYPE_LABELS, MEAL_TYPE_COLORS, MEAL_DOT_COLORS, MACRO_BADGE_COLORS, type MealType } from '@/lib/nutrition-constants';
import type { DietPlanMealDTO } from '@/server/services/diet-plan.service';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  isPlanLoading?: boolean;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onDeleteLog: (logId: string) => Promise<void>;
  onDeleteDishGroup?: (dishLogGroupId: string) => Promise<void>;
  onEdit?: (log: FoodLogEntry) => void;
  lastAdded?: { mealType: MealType; seq: number } | null;
  planMealsByMealType?: Partial<Record<MealType, DietPlanMealDTO>>;
  planId?: string;
  loggingMealType?: MealType | null;
  onLogPlanForMeal?: (mealType: MealType) => void | Promise<void>;
  onAddFoodForMeal?: (mealType: MealType) => void;
}



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

function buildFoodCountMap(foodIds: string[]) {
  const counts = new Map<string, number>();

  for (const foodId of foodIds) {
    counts.set(foodId, (counts.get(foodId) ?? 0) + 1);
  }

  return counts;
}

function formatLoggedQuantity(log: FoodLogEntry) {
  const quantityGrams = Math.round(log.quantity);

  if (!log.altMeasure) {
    return `${quantityGrams}g`;
  }

  const rawDescription = log.altMeasure.description.trim();
  const cleanedDescription = rawDescription.replace(/^\d+(?:[.,/]\d+)?\s+/u, '');
  const measureLabel = cleanedDescription || rawDescription;
  const baseQty = log.altMeasure.qty || 1;
  const displayQty = (log.quantity / log.altMeasure.weightGrams) * baseQty;
  const normalizedQty = Number.isInteger(displayQty)
    ? String(displayQty)
    : String(+displayQty.toFixed(2));

  return `${normalizedQty} ${measureLabel} (${quantityGrams}g)`;
}

function mealLogsCoverPlan(mealLogs: FoodLogEntry[], planMeal?: DietPlanMealDTO) {
  if (!planMeal || planMeal.items.length === 0 || mealLogs.length === 0) {
    return false;
  }

  const plannedCounts = buildFoodCountMap(planMeal.items.map((item) => item.foodId));
  const loggedCounts = buildFoodCountMap(mealLogs.map((log) => log.food.id));

  for (const [foodId, plannedCount] of plannedCounts) {
    if ((loggedCounts.get(foodId) ?? 0) < plannedCount) {
      return false;
    }
  }

  return true;
}

export default function FoodLogClient({
  logs,
  logsByMeal,
  selectedDate,
  onEdit,
  isLoading = false,
  isPlanLoading = false,
  onDeleteLog,
  onDeleteDishGroup,
  lastAdded,
  planMealsByMealType,
  planId,
  loggingMealType,
  onLogPlanForMeal,
  onAddFoodForMeal,
}: FoodLogClientProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [collapsedMeals, setCollapsedMeals] = useState<Set<string>>(new Set());
  const initialCollapseApplied = useRef(false);

  useEffect(() => {
    if (isLoading || isPlanLoading || initialCollapseApplied.current) return;
    initialCollapseApplied.current = true;
    setCollapsedMeals(new Set(
      MEAL_TYPE_ORDER.filter((mt) => {
        const hasLogs = !!logsByMeal[mt] && logsByMeal[mt].length > 0;
        const hasPlan = !!planMealsByMealType?.[mt];
        return !hasLogs && !hasPlan;
      })
    ));
  }, [isLoading, isPlanLoading, logsByMeal, planMealsByMealType]);

  useEffect(() => {
    if (!lastAdded) return;
    const { mealType } = lastAdded;
    setCollapsedMeals((prev) => {
      if (!prev.has(mealType)) return prev;
      const next = new Set(prev);
      next.delete(mealType);
      return next;
    });
    const timer = setTimeout(() => {
      document.querySelector(`[data-testid="meal-section-${mealType}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    return () => clearTimeout(timer);
  }, [lastAdded]);

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

  const visibleMealTypes = MEAL_TYPE_ORDER.filter((mealType) => {
    const hasLogs = (logsByMeal[mealType] || []).length > 0;
    const hasPlan = !!planMealsByMealType?.[mealType];
    return hasLogs || hasPlan;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading meals…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Inline delete error */}
      {deleteError && (
        <Alert variant="destructive">
          <AlertDescription>
            {deleteError}
            <Button variant="link" size="sm" className="h-auto p-0 ml-2 text-destructive-foreground underline" onClick={() => setDeleteError(null)}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Meal sections */}
      {visibleMealTypes.map((mealType) => {
        const mealLogs = logsByMeal[mealType] || [];
        const planMeal = planMealsByMealType?.[mealType];
        const isEmpty = mealLogs.length === 0;
        const shouldShowPlanAddon = !!planMeal && !!planId && !!onLogPlanForMeal && !mealLogsCoverPlan(mealLogs, planMeal);

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
            className="rounded-2xl border border-border/20 hover:border-primary/20 transition-all shadow-sm bg-background dark:bg-muted overflow-hidden"
          >
            {/* Meal header */}
            <Button
              type="button"
              variant="ghost"
              onClick={toggleMeal}
              aria-expanded={!isMealCollapsed}
              data-testid={`meal-toggle-${mealType}`}
              className={`w-full flex items-center justify-between px-5 py-4 text-left h-auto rounded-none group transition-colors hover:bg-secondary/40 ${!isMealCollapsed && (!isEmpty || !!planMeal) ? 'border-b border-border/10' : ''}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="sm:hidden text-muted-foreground">
                    {mealType === 'breakfast' ? (
                      <Sunrise className="h-4 w-4" aria-hidden />
                    ) : mealType === 'lunch' ? (
                      <Sandwich className="h-4 w-4" aria-hidden />
                    ) : mealType === 'dinner' ? (
                      <Moon className="h-4 w-4" aria-hidden />
                    ) : (
                      <UtensilsCrossed className="h-4 w-4" aria-hidden />
                    )}
                  </span>
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
                  <p className="text-xs text-muted-foreground mt-0.5 ml-4.5">
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
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-border/20 group-hover:bg-border/40 transition-colors">
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isMealCollapsed ? '-rotate-90' : ''}`}
                    aria-hidden
                  />
                </span>
              </div>
            </Button>

            {!isMealCollapsed && isEmpty ? (
              <div>
                <div
                  className="px-5 py-6"
                  data-testid={`meal-empty-placeholder-${mealType}`}
                >
                  {onAddFoodForMeal ? (
                    <button
                      type="button"
                      onClick={() => onAddFoodForMeal(mealType)}
                      data-testid={`meal-empty-add-${mealType}`}
                      aria-label={`Log food for ${MEAL_TYPE_LABELS[mealType]}`}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-5 text-sm text-muted-foreground select-none transition-[colors,transform] duration-150 ease-out hover:border-primary/40 hover:bg-primary/5 hover:text-foreground active:scale-[0.99] active:bg-primary/10 motion-reduce:active:scale-100 [-webkit-tap-highlight-color:transparent]"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background ring-1 ring-border/60 transition-colors group-hover:ring-primary/40 group-hover:text-primary">
                        <Plus className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="font-medium">
                        Log {MEAL_TYPE_LABELS[mealType].toLowerCase()}
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <UtensilsCrossed className="h-6 w-6 text-muted-foreground/30" aria-hidden />
                        <p className="text-sm text-muted-foreground">
                          No {MEAL_TYPE_LABELS[mealType].toLowerCase()} logged
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {shouldShowPlanAddon ? (
                  <MealPlanAddon
                    mealType={mealType}
                    planMeal={planMeal}
                    planId={planId}
                    date={selectedDate.toISOString()}
                    isLogging={loggingMealType === mealType}
                    onLogPlan={() => void onLogPlanForMeal(mealType)}
                  />
                ) : null}
              </div>
            ) : !isMealCollapsed ? (
              <div className="divide-y divide-border/10">
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
                      <div key={entry.dishLogGroupId} className="bg-secondary/30">
                        {/* Dish group header */}
                        <div className="flex items-center justify-between px-5 py-2 bg-violet-50/50 dark:bg-violet-900/10 border-b border-violet-100/50 dark:border-violet-800/20">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={toggleCollapse}
                            className="flex items-center gap-2 flex-1 min-w-0 text-left h-auto p-0 rounded-none hover:bg-transparent group"
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
                          </Button>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold tabular-nums text-violet-600 dark:text-violet-400">
                              {groupCalories} kcal
                            </span>
                            <div className="hidden lg:flex items-center gap-1">
                              {confirmingDelete === groupKey ? (
                                <>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteGroupConfirm(entry.dishLogGroupId)}
                                    className="text-[10px] h-auto py-1 px-2 rounded-full"
                                    data-testid={`delete-group-confirm-${entry.dishLogGroupId}`}
                                  >
                                    Remove all
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDeleteCancel}
                                    className="text-[10px] h-auto py-1 px-2 rounded-full"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-10 text-violet-500/50 hover:bg-destructive/10 hover:text-destructive"
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
                            <div className="lg:hidden">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-10 text-violet-500/50 hover:bg-destructive/10 hover:text-destructive"
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

                              <AlertDialog open={confirmingDelete === groupKey} onOpenChange={(open) => { if (!open) handleDeleteCancel(); }}>
                                <AlertDialogContent size="sm">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove dish group?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove all items from {entry.dishNameSnapshot} in your food log.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel disabled={deleting === groupKey}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      variant="destructive"
                                      disabled={deleting === groupKey}
                                      onClick={() => void handleDeleteGroupConfirm(entry.dishLogGroupId)}
                                    >
                                      {deleting === groupKey ? (
                                        <>
                                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                          Removing...
                                        </>
                                      ) : (
                                        'Remove all'
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
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
                {shouldShowPlanAddon ? (
                  <MealPlanAddon
                    mealType={mealType}
                    planMeal={planMeal}
                    planId={planId}
                    date={selectedDate.toISOString()}
                    isLogging={loggingMealType === mealType}
                    onLogPlan={() => void onLogPlanForMeal(mealType)}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}

      {logs.length === 0 && (
        <div className="py-4 text-center" data-testid="empty-state">
          <p className="text-sm text-muted-foreground lg:hidden">
            Tap the + button to search and add foods to your log.
          </p>
          <p className="hidden text-sm text-muted-foreground lg:block">
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


function FoodLogRow({ log, nutrients, confirmingDelete, deleting, onDeleteRequest, onDeleteConfirm, onDeleteCancel, onEdit, indent = false }: FoodLogRowProps) {
  const [mobileDeleteOpen, setMobileDeleteOpen] = useState(false);

  return (
    <div
      className={`flex items-center gap-3 py-3 transition-colors ${indent ? 'pl-8 pr-5' : 'px-5'}`}
      data-testid={`food-log-${log.id}`}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={() => onEdit?.(log)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left h-auto p-0 rounded-none hover:bg-transparent hover:opacity-75 transition-opacity"
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
          <div className="w-12 h-12 rounded-lg bg-secondary shrink-0 flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5 text-muted-foreground/30" aria-hidden />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {log.food.name}
          </p>
          <p className="sm:hidden text-xs text-muted-foreground tabular-nums mt-0.5 truncate">
            {formatLoggedQuantity(log)}
          </p>
          <div className="hidden sm:block">
            {log.food.brandName && (
              <p className="text-xs text-muted-foreground truncate">{log.food.brandName}</p>
            )}
            <p className="text-xs text-muted-foreground">{formatLoggedQuantity(log)}</p>
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

          <div className="sm:hidden mt-0.5 text-xs text-muted-foreground tabular-nums flex items-center gap-2 max-[450px]:flex-col max-[450px]:items-start max-[450px]:gap-0.5">
            <span className="truncate">P: {nutrients.protein}g</span>
            <span className="truncate">C: {nutrients.carbs}g</span>
            <span className="truncate">F: {nutrients.fat}g</span>
          </div>
        </div>
      </Button>

      <div className="text-right shrink-0">
        <p className="text-sm font-bold tabular-nums text-foreground">{nutrients.calories}</p>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground -mt-0.5">kcal</p>
      </div>

      {/* Desktop actions */}
      <div className="hidden lg:flex items-center gap-2 shrink-0">
        <FavoriteToggleButton foodId={log.food.id} />

        {confirmingDelete === log.id ? (
          <div className="flex items-center gap-1.5 shrink-0" role="group" aria-label={`Confirm removal of ${log.food.name}`}>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeleteConfirm(log.id)}
              data-testid={`delete-confirm-${log.id}`}
              className="text-xs h-auto py-1.5 px-3 rounded-full"
            >
              Remove
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteCancel}
              data-testid={`delete-cancel-${log.id}`}
              className="text-xs h-auto py-1.5 px-3 rounded-full"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteRequest(log.id)}
            disabled={deleting === log.id}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
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

      {/* Mobile always-visible actions */}
      <div className="lg:hidden flex items-center gap-1.5 shrink-0">
        <FavoriteToggleButton foodId={log.food.id} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileDeleteOpen(true)}
          disabled={deleting === log.id}
          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          aria-label={`Remove ${log.food.name} from log`}
          data-testid={`delete-log-mobile-${log.id}`}
        >
          {deleting === log.id ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="h-4 w-4" aria-hidden />
          )}
        </Button>

        <AlertDialog open={mobileDeleteOpen} onOpenChange={setMobileDeleteOpen}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove food log?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove {log.food.name} from your food log.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting === log.id}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={deleting === log.id}
                onClick={() => {
                  void onDeleteConfirm(log.id);
                  setMobileDeleteOpen(false);
                }}
              >
                {deleting === log.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Removing...
                  </>
                ) : (
                  'Remove'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
