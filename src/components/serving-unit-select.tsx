'use client';

import { SERVING_UNIT_VALUES } from '@/lib/form-validation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const SERVING_UNIT_LABELS: Record<typeof SERVING_UNIT_VALUES[number], string> = {
  g: 'Grams (g)',
  oz: 'Ounces (oz)',
  mL: 'Milliliters (mL)',
  c: 'Cups (c)',
  'fl oz': 'Fluid ounces (fl oz)',
  container: 'Container',
  scoop: 'Scoop',
  piece: 'Piece',
  unit: 'Unit',
};

interface ServingUnitSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
  disabled?: boolean;
}

export function ServingUnitSelect({ value, onChange, error, id, disabled }: ServingUnitSelectProps) {
  const validValue = (SERVING_UNIT_VALUES as readonly string[]).includes(value) ? value : undefined;

  return (
    <div>
      <Select value={validValue} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          className={cn('w-full', error && 'border-destructive')}
        >
          <SelectValue placeholder="Select unit" />
        </SelectTrigger>
        <SelectContent>
          {SERVING_UNIT_VALUES.map((unit) => (
            <SelectItem key={unit} value={unit}>
              {SERVING_UNIT_LABELS[unit]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
