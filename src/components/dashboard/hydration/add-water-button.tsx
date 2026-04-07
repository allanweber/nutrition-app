'use client';

import { useTransition } from 'react';
import { Loader2, Droplets } from 'lucide-react';
import { addWaterAction } from '@/server/actions/hydration';

export function AddWaterButton() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await addWaterAction();
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label="Add 250ml water"
      className="flex items-center gap-2 bg-muted border border-border px-4 py-2.5 rounded-full hover:bg-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed group"
    >
      {isPending ? (
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      ) : (
        <Droplets className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
      )}
      <span className="flex flex-col items-start leading-tight">
        <span className="text-sm font-semibold text-blue-600">Log Hydration</span>
        <span className="text-[10px] font-bold text-blue-400 tabular-nums">+250 ml</span>
      </span>
    </button>
  );
}
