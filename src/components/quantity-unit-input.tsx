'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
}

export function QuantityUnitInput({
  measures,
  selectedMeasureId,
  quantity,
  onMeasureChange,
  onQuantityChange,
}: QuantityUnitInputProps) {
  const measure = measures.find((m) => m.id === selectedMeasureId) ?? measures[0];

  const handleNumberChange = (raw: string) => {
    const val = parseFloat(raw);
    if (!isNaN(val) && val > 0) onQuantityChange(val);
  };

  const handleSliderChange = (raw: string) => {
    const val = parseFloat(raw);
    if (!isNaN(val)) onQuantityChange(val);
  };

  const handleMeasureChange = (id: string) => {
    const next = measures.find((m) => m.id === id);
    if (next) onMeasureChange(id, next.defaultQty);
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider ml-1">
        Quantity &amp; Serving Size
      </label>

      {/* Number input + unit select */}
      <div className="flex items-center rounded-lg border border-outline-variant bg-background overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
        <input
          type="number"
          min={measure.sliderMin}
          max={measure.sliderMax}
          step={measure.sliderStep}
          value={quantity}
          onChange={(e) => handleNumberChange(e.target.value)}
          className="flex-1 bg-transparent border-none px-3 py-2 font-bold text-on-surface focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          data-testid="quantity-input"
          aria-label="Quantity"
        />
        <div className="h-5 w-px bg-outline-variant shrink-0" />
        <div className="min-w-20">
          <Select value={selectedMeasureId} onValueChange={handleMeasureChange}>
            <SelectTrigger
              className="w-full border-none bg-transparent shadow-none font-bold text-on-surface focus:ring-0 pl-2 pr-6 py-2 rounded-none"
              data-testid="measure-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {measures.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Slider */}
      <div className="px-1">
        <input
          type="range"
          min={measure.sliderMin}
          max={measure.sliderMax}
          step={measure.sliderStep}
          value={quantity}
          onChange={(e) => handleSliderChange(e.target.value)}
          className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
          data-testid="quantity-slider"
          aria-label="Quantity slider"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{measure.sliderMin}</span>
          <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{measure.sliderMax}</span>
        </div>
      </div>
    </div>
  );
}
