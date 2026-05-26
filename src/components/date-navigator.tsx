'use client';

import { useState } from 'react';
import { format, addDays, subDays, startOfDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange(subDays(value, 1))}
        aria-label="Previous day"
        data-testid="date-nav-prev"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 px-2"
            aria-label="Pick a date"
            data-testid="date-nav-display"
          >
            <CalendarIcon className="h-3 w-3 text-primary" />
            <span className="font-bold text-foreground">{format(value, 'MMM d')}</span>
          </Button>
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

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange(addDays(value, 1))}
        disabled={isAtToday}
        aria-label="Next day"
        data-testid="date-nav-next"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
