'use client';

import { useTransition } from 'react';
import { Loader2, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addWaterAction } from '@/server/actions/hydration';

export function AddWaterButton() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await addWaterAction();
    });
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      aria-label="Add 250ml water"
      variant="outline"
      className="rounded-full h-auto gap-2 px-4 py-2.5 group"
    >
      {isPending ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <Droplets className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
      )}
      <span className="flex flex-col items-start leading-tight">
        <span className="text-sm font-semibold text-primary">Log Hydration</span>
        <span className="text-[10px] font-bold text-primary/60 tabular-nums">+250 ml</span>
      </span>
    </Button>
  );
}
