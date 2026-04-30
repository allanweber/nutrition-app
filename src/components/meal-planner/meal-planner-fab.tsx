'use client';

import { useState } from 'react';
import { CalendarPlus, Plus, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MealPlannerFabProps {
  hasActivePlan: boolean;
  onAddPlan: () => void;
  onAddMeal: () => void;
}

export function MealPlannerFab({ hasActivePlan, onAddPlan, onAddMeal }: MealPlannerFabProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="md:hidden fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {expanded && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setExpanded(false)}
          aria-hidden="true"
        />
      )}

      {expanded && (
        <div className="flex flex-col items-end gap-2 animate-in slide-in-from-bottom-2 fade-in duration-150">
          {hasActivePlan && (
            <button
              onClick={() => { setExpanded(false); onAddMeal(); }}
              aria-label="Add meal to current plan"
              className="flex items-center gap-2 bg-background border shadow-md rounded-full px-4 py-2.5 text-sm font-bold uppercase tracking-widest"
            >
              <Utensils className="h-4 w-4 text-primary" />
              Add Meal
            </button>
          )}
          <button
            onClick={() => { setExpanded(false); onAddPlan(); }}
            aria-label="Add new plan"
            className="flex items-center gap-2 bg-background border shadow-md rounded-full px-4 py-2.5 text-sm font-bold uppercase tracking-widest"
          >
            <CalendarPlus className="h-4 w-4 text-primary" />
            Add Plan
          </button>
        </div>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? 'Close actions' : 'Open actions'}
        aria-expanded={expanded}
        className={cn(
          'w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform duration-200',
          expanded && 'rotate-45',
        )}
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
