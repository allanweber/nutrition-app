'use client';

import Link from 'next/link';
import { Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LogFoodButton() {
  return (
    <Button
      variant="outline"
      className="rounded-full h-auto gap-2 px-8 py-2.5 group min-w-32"
      asChild
    >
      <Link href="/food-log">
        <Utensils className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
        <span className="flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold text-primary">Log Food</span>
          <span className="text-[10px] font-bold text-primary/60 tabular-nums">+ Add meal</span>
        </span>
      </Link>
    </Button>
  );
}
