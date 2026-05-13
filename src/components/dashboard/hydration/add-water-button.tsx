'use client';

import { Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HYDRATION_LOG_INCREMENT_ML } from '@/lib/nutrition-constants';

interface AddWaterButtonProps {
  onClick: () => void;
  isBusy?: boolean;
}

export function AddWaterButton({ onClick, isBusy }: AddWaterButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      aria-label={`Add ${HYDRATION_LOG_INCREMENT_ML}ml water`}
      aria-busy={isBusy || undefined}
      variant="outline"
      className="rounded-full h-auto gap-2 px-4 py-2.5 group"
    >
      <Droplets className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-sm font-semibold text-primary">Log Hydration</span>
        <span className="text-[10px] font-bold text-primary/60 tabular-nums">
          +{HYDRATION_LOG_INCREMENT_ML} ml
        </span>
      </span>
    </Button>
  );
}
