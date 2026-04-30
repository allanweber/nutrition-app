'use client';

import { useEffect, useState } from 'react';
import { ChefHat, ChevronDown, ChevronRight, Loader2, Trash2, Utensils, UtensilsCrossed } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { cn } from '@/lib/utils';
import { MEAL_TYPE_COLORS, MEAL_TYPE_LABELS, MACRO_TEXT_COLORS } from '@/lib/nutrition-constants';
import { MealItemRow } from './meal-item-row';
import type { DietPlanMealDTO, MealItemDTO } from '@/server/services/diet-plan.service';

interface MealCardProps {
  meal: DietPlanMealDTO;
  isDeleting?: boolean;
  defaultCollapsed?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

interface DishGroup {
  dishGroupId: string;
  dishName: string;
  items: MealItemDTO[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

function groupItems(items: MealItemDTO[]): {
  dishGroups: DishGroup[];
  soloItems: MealItemDTO[];
} {
  const dishGroupsMap = new Map<string, MealItemDTO[]>();
  const soloItems: MealItemDTO[] = [];

  for (const item of items) {
    if (item.dishGroupId) {
      if (!dishGroupsMap.has(item.dishGroupId)) dishGroupsMap.set(item.dishGroupId, []);
      dishGroupsMap.get(item.dishGroupId)!.push(item);
    } else {
      soloItems.push(item);
    }
  }

  const dishGroups: DishGroup[] = Array.from(dishGroupsMap.entries()).map(([id, groupItems]) => ({
    dishGroupId: id,
    dishName: groupItems[0].dishNameSnapshot ?? 'Unknown Dish',
    items: groupItems,
    totalCalories: groupItems.reduce((s, i) => s + i.calories, 0),
    totalProtein: groupItems.reduce((s, i) => s + i.protein, 0),
    totalCarbs: groupItems.reduce((s, i) => s + i.carbs, 0),
    totalFat: groupItems.reduce((s, i) => s + i.fat, 0),
  }));

  return { dishGroups, soloItems };
}

function DishGroupRow({ group }: { group: DishGroup }) {
  const [expanded, setExpanded] = useState(false);
  const ChevronIcon = expanded ? ChevronDown : ChevronRight;

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        className="w-full flex items-center gap-3 py-3 h-auto justify-start text-left px-0 hover:bg-transparent"
        onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
      >
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          <ChefHat className="h-3.5 w-3.5 text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            From: {group.dishName}
          </p>
          <p className="text-xs text-muted-foreground">
            {group.items.length} ingredient{group.items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="w-px h-8 bg-border shrink-0" />
        <div className="flex items-center shrink-0">
          <div className="flex flex-col items-center w-14 text-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">KCAL</span>
            <span className="text-sm font-semibold text-foreground">{Math.round(group.totalCalories)}</span>
          </div>
          <div className="flex flex-col items-center w-12 text-center">
            <span className={`text-[10px] ${MACRO_TEXT_COLORS.protein} uppercase tracking-wider leading-tight`}>PROT</span>
            <span className={`text-sm font-semibold ${MACRO_TEXT_COLORS.protein}`}>{Math.round(group.totalProtein)}g</span>
          </div>
          <div className="flex flex-col items-center w-12 text-center">
            <span className={`text-[10px] ${MACRO_TEXT_COLORS.carbs} uppercase tracking-wider leading-tight`}>CARB</span>
            <span className={`text-sm font-semibold ${MACRO_TEXT_COLORS.carbs}`}>{Math.round(group.totalCarbs)}g</span>
          </div>
          <div className="flex flex-col items-center w-10 text-center">
            <span className={`text-[10px] ${MACRO_TEXT_COLORS.fat} uppercase tracking-wider leading-tight`}>FAT</span>
            <span className={`text-sm font-semibold ${MACRO_TEXT_COLORS.fat}`}>{Math.round(group.totalFat)}g</span>
          </div>
        </div>
        <ChevronIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
      </Button>

      {expanded && (
        <div className="pl-8 divide-y divide-border/20 border-l-2 border-violet-200/60 ml-2.5 mb-1">
          {group.items.map((item) => (
            <MealItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MealCard({ meal, isDeleting = false, defaultCollapsed: _defaultCollapsed = false, onEdit, onDelete }: MealCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Mobile: always start collapsed (desktop is forced open via isDesktop below).
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const iconColors = MEAL_TYPE_COLORS[meal.mealType] ?? 'bg-muted text-muted-foreground';
  const label = (MEAL_TYPE_LABELS[meal.mealType] ?? meal.mealType).toUpperCase();

  const { dishGroups, soloItems } = groupItems(meal.items);

  // Desktop/tablet: keep content always visible (collapsible is mobile-only).
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <>
      <Collapsible open={isDesktop ? true : isOpen} onOpenChange={isDesktop ? undefined : setIsOpen}>
        <div
          data-testid={`meal-card-${meal.id}`}
          onClick={isDeleting ? undefined : onEdit}
          className={`rounded-2xl border bg-background transition-all flex flex-col relative ${isDeleting ? 'opacity-60 pointer-events-none' : 'cursor-pointer hover:shadow-sm'}`}
        >
          {isDeleting && (
            <div className="absolute inset-0 rounded-2xl flex items-center justify-center z-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Header: render ONE variant to avoid duplicate testids in DOM */}
          {isDesktop ? (
            <div className="flex items-center gap-3 px-5 py-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColors}`}>
                <Utensils className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-foreground flex-1">{label}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                data-testid={`meal-delete-btn-${meal.id}`}
                onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
                disabled={isDeleting}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label={`Delete ${label} meal`}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <CollapsibleTrigger asChild disabled={isDeleting}>
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColors}`}>
                  <Utensils className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest flex-1 text-left text-foreground">{label}</span>
                <span className="text-sm font-semibold tabular-nums text-foreground mr-1">
                  {Math.round(meal.totalCalories)} kcal
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-testid={`meal-delete-btn-${meal.id}`}
                  onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
                  disabled={isDeleting}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                  aria-label={`Delete ${label} meal`}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0', isOpen && 'rotate-180')} />
              </div>
            </CollapsibleTrigger>
          )}

          {/* Collapsible content — always visible on desktop, toggleable on mobile */}
          <CollapsibleContent>
            <div className="px-5 divide-y divide-border/30 flex-1">
              {dishGroups.map((group) => (
                <DishGroupRow key={group.dishGroupId} group={group} />
              ))}
              {soloItems.map((item) => (
                <MealItemRow key={item.id} item={item} />
              ))}
              {meal.items.length === 0 && (
                <div className="py-8 flex flex-col items-center gap-2 text-center">
                  <UtensilsCrossed className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground">No foods added</p>
                  <p className="text-xs text-muted-foreground/70">Click to add foods to this meal</p>
                </div>
              )}
            </div>

            <div className="flex items-stretch bg-muted/40 rounded-b-2xl divide-x divide-border/30 mt-auto">
              <div className="flex flex-col px-5 py-3 flex-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Calories</span>
                <span data-testid={`meal-total-calories-${meal.id}`} className="text-base font-bold text-foreground">
                  {Math.round(meal.totalCalories)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">kcal</span>
                </span>
              </div>
              <div className="flex flex-col px-4 py-3">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Protein</span>
                <span className={`text-base font-bold ${MACRO_TEXT_COLORS.protein}`}>{Math.round(meal.totalProtein)}g</span>
              </div>
              <div className="flex flex-col px-4 py-3">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Carbs</span>
                <span className={`text-base font-bold ${MACRO_TEXT_COLORS.carbs}`}>{Math.round(meal.totalCarbs)}g</span>
              </div>
              <div className="flex flex-col px-4 py-3">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Fats</span>
                <span className={`text-base font-bold ${MACRO_TEXT_COLORS.fat}`}>{Math.round(meal.totalFat)}g</span>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {label} meal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this meal and all its items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="meal-delete-confirm"
              onClick={onDelete}
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
