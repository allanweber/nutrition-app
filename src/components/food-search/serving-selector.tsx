'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ServingOption } from './types';

export function ServingSelector({
  options,
  selectedOptionId,
  quantity,
  selectedMeasure,
  onOptionChange,
  onQuantityChange,
  showWillLog = true,
  willLogQuantity,
  willLogUnit,
}: {
  options: ServingOption[];
  selectedOptionId: string;
  quantity: number;
  selectedMeasure: string;
  onOptionChange: (optionId: string) => void;
  onQuantityChange: (quantity: number) => void;
  showWillLog?: boolean;
  willLogQuantity?: string;
  willLogUnit?: string;
}) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-foreground">
          Serving
        </label>
        <Select value={selectedOptionId} onValueChange={onOptionChange}>
          <SelectTrigger className="h-9 w-full text-sm">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label} ({Math.round(o.grams)}g)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-foreground">
          Serving size
        </label>
        <div className="flex w-full items-center gap-2">
          <Input
            type="number"
            min={0.01}
            step={0.01}
            value={String(quantity)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onQuantityChange(Number.isFinite(val) && val > 0 ? val : 0.01);
            }}
            className="h-9 w-full text-sm"
            aria-label="Serving size"
            data-testid="serving-quantity-input"
          />
          <span className="text-xs text-muted-foreground">
            {selectedMeasure}
          </span>
        </div>
        {showWillLog && willLogQuantity && willLogUnit ? (
          <div className="text-xs text-muted-foreground">
            Will log {willLogQuantity} × {willLogUnit}
          </div>
        ) : null}
      </div>
    </div>
  );
}
