'use client';

import { useState } from 'react';
import { format, addDays, subDays, startOfDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface DateNavigatorProps {
  value: Date;
  onChange: (date: Date) => void;
}

export function DateNavigator({ value, onChange }: DateNavigatorProps) {
  const [open, setOpen] = useState(false);
  const isAtToday = isToday(value) || startOfDay(value) > startOfDay(new Date());

  return (
    <div
      className="flex items-center justify-between p-1.5 rounded-lg border border-border bg-background"
      data-testid="date-navigator"
    >
      <button
        type="button"
        onClick={() => onChange(subDays(value, 1))}
        className="size-6 flex items-center justify-center text-foreground hover:bg-muted rounded transition-colors"
        aria-label="Previous day"
        data-testid="date-nav-prev"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-muted transition-colors"
            aria-label="Pick a date"
            data-testid="date-nav-display"
          >
            <CalendarIcon className="h-3 w-3 text-primary" />
            <span className="font-bold text-foreground">{format(value, 'MMM d')}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={value}
            disabled={{ after: new Date() }}
            onSelect={(date) => {
              if (date) {
                onChange(date);
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>

      <button
        type="button"
        onClick={() => !isAtToday && onChange(addDays(value, 1))}
        disabled={isAtToday}
        className="size-6 flex items-center justify-center text-foreground hover:bg-muted rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Next day"
        data-testid="date-nav-next"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
