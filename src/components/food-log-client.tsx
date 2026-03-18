'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCallback, useState } from 'react';

import { addDays, format, isToday, subDays } from 'date-fns';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';

import { FoodLogEntry } from '@/types/food';
import { MEAL_TYPE_ORDER, MEAL_TYPE_LABELS, MACRO_TEXT_COLORS } from '@/lib/nutrition-constants';

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
  onDateChange: (date: Date) => void;
  onDeleteLog: (logId: number) => Promise<void>;
}


export default function FoodLogClient({
  logs,
  logsByMeal,
  totals,
  isLoading = false,
  onDateChange,
  onDeleteLog
}: FoodLogClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handlePreviousDay = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    onDateChange(newDate);
  };

  const handleToday = () => {
    const newDate = new Date();
    setSelectedDate(newDate);
    onDateChange(newDate);
  };

  const handleDeleteRequest = (logId: number) => {
    setConfirmingDelete(logId);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async (logId: number) => {
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
    const qty = log.quantity || 1;
    const servingQty = log.food?.servingQty || 1;
    const multiplier = qty / servingQty;

    return {
      calories: Math.round((log.food?.calories || 0) * multiplier),
      protein: Math.round((log.food?.protein || 0) * multiplier * 10) / 10,
      carbs: Math.round((log.food?.carbs || 0) * multiplier * 10) / 10,
      fat: Math.round((log.food?.fat || 0) * multiplier * 10) / 10,
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={handlePreviousDay} aria-label="Previous day">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>

            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {isToday(selectedDate)
                    ? 'Today'
                    : format(selectedDate, 'EEEE')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </div>
              </div>
              {!isToday(selectedDate) && (
                <Button variant="outline" size="sm" onClick={handleToday}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Today
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextDay}
              disabled={isToday(selectedDate)}
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-2" data-testid="daily-summary">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Calories</p>
          <p className="text-3xl font-bold tabular-nums text-foreground leading-none" data-testid="calories-total">{totals.calories}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Protein</p>
          <p className={`text-3xl font-bold tabular-nums ${MACRO_TEXT_COLORS.protein} leading-none`}>
            {totals.protein}<span className="text-base font-medium ml-0.5">g</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Carbs</p>
          <p className={`text-3xl font-bold tabular-nums ${MACRO_TEXT_COLORS.carbs} leading-none`}>
            {totals.carbs}<span className="text-base font-medium ml-0.5">g</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Fat</p>
          <p className={`text-3xl font-bold tabular-nums ${MACRO_TEXT_COLORS.fat} leading-none`}>
            {totals.fat}<span className="text-base font-medium ml-0.5">g</span>
          </p>
        </div>
      </div>

      {/* Inline delete error */}
      {deleteError && (
        <div role="alert" className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg text-sm">
          {deleteError}
          <button
            className="ml-2 underline hover:no-underline"
            onClick={() => setDeleteError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Food Logs by Meal */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading food logs...
            </div>
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div
              className="text-center space-y-3"
              data-testid="empty-state"
            >
              <UtensilsCrossed className="h-10 w-10 text-muted-foreground/30 mx-auto" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">No meals logged yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Search for a food above — calories and macros update as you log.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {MEAL_TYPE_ORDER.map((mealType) => {
            const mealLogs = logsByMeal[mealType] || [];
            if (mealLogs.length === 0) return null;

            const mealTotals = mealLogs.reduce(
              (acc, log) => {
                const nutrients = calculateLogNutrients(log);
                return {
                  calories: acc.calories + nutrients.calories,
                  protein: acc.protein + nutrients.protein,
                  carbs: acc.carbs + nutrients.carbs,
                  fat: acc.fat + nutrients.fat,
                };
              },
              { calories: 0, protein: 0, carbs: 0, fat: 0 },
            );

            return (
              <Card key={mealType}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {MEAL_TYPE_LABELS[mealType]}
                    </CardTitle>
                    <Badge variant="secondary">{mealTotals.calories} cal</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mealLogs.map((log) => {
                      const nutrients = calculateLogNutrients(log);
                      return (
                        <div
                          key={log.id}
                          className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          data-testid={`food-log-${log.id}`}
                        >
                          {log.food.photoUrl && (
                            <Image
                              src={log.food.photoUrl}
                              alt={log.food.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {log.food.name}
                            </div>
                            {log.food.brandName && (
                              <div className="text-sm text-muted-foreground truncate">
                                {log.food.brandName}
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground">
                              {log.quantity}{' '}
                              {log.servingUnit || log.food.servingUnit}
                            </div>
                            {/* Mobile-only: nutrition summary inline */}
                            <div className="sm:hidden mt-1 flex items-center gap-2 text-xs">
                              <span className="font-medium text-foreground tabular-nums">
                                {nutrients.calories} cal
                              </span>
                              <span className="text-muted-foreground">
                                P: {nutrients.protein}g · C: {nutrients.carbs}g · F: {nutrients.fat}g
                              </span>
                            </div>
                          </div>
                          {/* Desktop: right-aligned nutrition block */}
                          <div className="text-right hidden sm:block shrink-0">
                            <div className="font-medium tabular-nums">
                              {nutrients.calories} cal
                            </div>
                            <div className="text-xs text-muted-foreground">
                              P: {nutrients.protein}g | C: {nutrients.carbs}g |
                              F: {nutrients.fat}g
                            </div>
                          </div>
                          {confirmingDelete === log.id ? (
                            <div className="flex items-center gap-1 shrink-0" role="group" aria-label={`Confirm removal of ${log.food.name}`}>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteConfirm(log.id)}
                                data-testid={`delete-confirm-${log.id}`}
                              >
                                Remove
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDeleteCancel}
                                data-testid={`delete-cancel-${log.id}`}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRequest(log.id)}
                              disabled={deleting === log.id}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                              aria-label={`Remove ${log.food.name} from log`}
                              data-testid={`delete-log-${log.id}`}
                            >
                              {deleting === log.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                              ) : (
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
