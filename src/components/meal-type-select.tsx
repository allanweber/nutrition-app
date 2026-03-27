'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, type MealType } from '@/lib/nutrition-constants';

interface MealTypeSelectProps {
  value: MealType;
  onChange: (value: MealType) => void;
  error?: string;
  id?: string;
}

export function MealTypeSelect({ value, onChange, error, id }: MealTypeSelectProps) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1"
      >
        Meal Type
      </label>
      <div className="relative">
        <Select value={value} onValueChange={(v) => onChange(v as MealType)}>
          <SelectTrigger
            id={id}
            className={`w-full rounded-lg border border-outline-variant bg-background font-bold focus:border-primary focus:ring-1 focus:ring-primary${error ? ' border-destructive' : ''}`}
            data-testid="meal-type-select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEAL_TYPE_ORDER.map((type) => (
              <SelectItem key={type} value={type}>
                {MEAL_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
