'use client';

import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

export interface QuantityMeasure {
  id: string;
  label: string;
  defaultQty: number;
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  /** Grams per 1 unit (1 for base grams mode) */
  weightGrams: number;
}

interface QuantityUnitInputProps {
  measures: QuantityMeasure[];
  selectedMeasureId: string;
  quantity: number;
  onMeasureChange: (id: string, newQty: number) => void;
  onQuantityChange: (qty: number) => void;
  /** Whether to show the range slider. Defaults to true. */
  showSlider?: boolean;
  /** Whether to show the "Quantity & Serving Size" label. Defaults to true. */
  showLabel?: boolean;
  qtyInputTestId?: string;
  measureSelectTestId?: string;
}

export function QuantityUnitInput({
  measures,
  selectedMeasureId,
  quantity,
  onMeasureChange,
  onQuantityChange,
  showSlider = true,
  showLabel = true,
  qtyInputTestId = 'quantity-input',
  measureSelectTestId = 'measure-select',
}: QuantityUnitInputProps) {
  const measure = measures.find((m) => m.id === selectedMeasureId) ?? measures[0];
  const [displayQuantity, setDisplayQuantity] = useState(() => String(quantity));

  useEffect(() => {
    setDisplayQuantity(String(quantity));
  }, [quantity]);

  const handleNumberChange = (raw: string) => {
    setDisplayQuantity(raw);

    if (raw === '') return;

    const val = parseFloat(raw);
    if (!isNaN(val) && val > 0) onQuantityChange(val);
  };

  const handleNumberBlur = () => {
    if (displayQuantity === '') {
      setDisplayQuantity(String(quantity));
    }
  };

  const handleSliderChange = (values: number[]) => {
    if (values[0] !== undefined) onQuantityChange(values[0]);
  };

  const handleMeasureChange = (id: string) => {
    const next = measures.find((m) => m.id === id);
    if (next) onMeasureChange(id, next.defaultQty);
  };

  return (
    <div className="space-y-1.5 min-w-0">
      {showLabel && (
        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
          Quantity &amp; Serving Size
        </label>
      )}

      {/* Number input + unit select — matches app's h-9 / text-sm input style */}
      <div className="flex items-center h-9 rounded-md border border-input bg-transparent shadow-xs overflow-hidden transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
        <Input
          type="number"
          min={measure.sliderMin}
          max={measure.sliderMax}
          step={measure.sliderStep}
          value={displayQuantity}
          onChange={(e) => handleNumberChange(e.target.value)}
          onBlur={handleNumberBlur}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 h-full border-none shadow-none rounded-none px-3 py-1 text-sm font-medium focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none w-[30%] sm:flex-1 sm:w-auto"
          data-testid={qtyInputTestId}
          aria-label="Quantity"
        />
        <div className="h-4 w-px bg-border shrink-0" />
        <Select value={selectedMeasureId} onValueChange={handleMeasureChange}>
          <SelectTrigger
            className="h-full border-none bg-transparent shadow-none text-sm font-medium text-foreground focus:ring-0 pl-2 pr-7 rounded-none min-w-0 w-[70%] sm:w-auto sm:min-w-20 sm:max-w-36"
            data-testid={measureSelectTestId}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {measures.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-sm">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Slider */}
      {showSlider && (
        <div className="px-1">
          <Slider
            min={measure.sliderMin}
            max={measure.sliderMax}
            step={measure.sliderStep}
            value={[quantity]}
            onValueChange={handleSliderChange}
            data-testid="quantity-slider"
            aria-label="Quantity slider"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{measure.sliderMin}</span>
            <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{measure.sliderMax}</span>
          </div>
        </div>
      )}
    </div>
  );
}
