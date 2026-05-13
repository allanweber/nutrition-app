'use client';

import { useState } from 'react';
import {
  addDays,
  addWeeks,
  differenceInCalendarWeeks,
  format,
  isFuture,
  isToday,
  startOfWeek,
} from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface WeeklyCalendarStripProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function WeeklyCalendarStrip({ selectedDate, onDateChange }: WeeklyCalendarStripProps) {
  const baseWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const [weekOffset, setWeekOffset] = useState(() => {
    const selWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Math.min(differenceInCalendarWeeks(selWeekStart, baseWeekStart, { weekStartsOn: 1 }), 0);
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const weekStart = addWeeks(baseWeekStart, weekOffset);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const selectedStr = format(selectedDate, 'yyyy-MM-dd');

  const isOnCurrentWeek = weekOffset === 0;
  const isTodaySelected = format(new Date(), 'yyyy-MM-dd') === selectedStr;

  const handlePrevWeek = () => setWeekOffset((o) => o - 1);
  const handleNextWeek = () => setWeekOffset((o) => Math.min(o + 1, 0));
  const handleGoToToday = () => {
    setWeekOffset(0);
    onDateChange(new Date());
  };

  const handleCalendarSelect = (picked: Date | undefined) => {
    if (!picked) return;
    const pickedWeekStart = startOfWeek(picked, { weekStartsOn: 1 });
    const offset = differenceInCalendarWeeks(pickedWeekStart, baseWeekStart, { weekStartsOn: 1 });
    setWeekOffset(Math.min(offset, 0));
    onDateChange(picked);
    setCalendarOpen(false);
  };

  return (
    <div
      className="w-full min-w-0 max-w-full bg-background dark:bg-secondary rounded-2xl p-3 sm:p-6 border border-border/30 shadow-sm relative"
      data-testid="weekly-calendar-strip"
    >
      <div className="mb-3 flex w-full min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-2 sm:mb-4">
        <span className="min-w-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:text-[11px]">
          Weekly Overview
        </span>

        <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          {/* Today button — only shown when not already on today */}
          {(!isOnCurrentWeek || !isTodaySelected) && (
            <Button
              onClick={handleGoToToday}
              variant="ghost"
              size="sm"
              className="rounded-full h-auto py-1 px-2.5 sm:py-1.5 sm:px-3 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 hover:border-primary/40"
            >
              Today
            </Button>
          )}

          {/* Full Month button */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full h-auto py-1 px-2.5 sm:py-1.5 sm:px-3 gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 hover:border-primary/40"
              >
                <CalendarIcon className="h-3 w-3" />
                <span className="hidden sm:inline">Full Month</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleCalendarSelect}
                disabled={(date) => isFuture(date) && !isToday(date)}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Day pills with flanking arrows — equal-width flex tiles, no horizontal scroll */}
      <div className="flex items-stretch gap-1 min-w-0">
        <Button
          onClick={handlePrevWeek}
          variant="ghost"
          size="icon"
          className="size-7 sm:size-8 shrink-0 self-center"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-1 min-w-0 gap-0.5 sm:gap-1 items-stretch">
            {days.map((day, i) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isSelected = dayStr === selectedStr;
              const isDisabled = isFuture(day) && !isToday(day);

              return (
                <Button
                  key={dayStr}
                  data-testid={`week-day-${dayStr}`}
                  onClick={() => !isDisabled && onDateChange(day)}
                  disabled={isDisabled}
                  variant="ghost"
                  className={cn(
                    'flex flex-1 basis-0 min-w-0 flex-col items-center justify-center border px-0.5 py-1.5 sm:px-1 sm:py-2.5 rounded-lg sm:rounded-xl select-none h-auto',
                    isDisabled &&
                      'cursor-not-allowed border-transparent text-foreground opacity-30',
                    !isDisabled &&
                      isSelected &&
                      'border-border bg-primary/10 text-foreground shadow-sm hover:bg-primary/[0.12] dark:bg-secondary dark:hover:bg-secondary/90',
                    !isDisabled &&
                      !isSelected &&
                      'cursor-pointer border-transparent text-foreground hover:border-border/80 hover:bg-muted/30',
                  )}
                >
                  <span className="mb-0.5 text-[9px] font-bold leading-none text-muted-foreground sm:mb-1 sm:text-[10px]">
                    {DAY_LABELS[i]}
                  </span>
                  <span className="text-xs font-headline font-bold tabular-nums leading-none text-foreground sm:text-base md:text-lg">
                    {format(day, 'd')}
                  </span>
                </Button>
              );
            })}
          </div>

        <Button
          onClick={handleNextWeek}
          disabled={weekOffset >= 0}
          variant="ghost"
          size="icon"
          className="size-7 sm:size-8 shrink-0 self-center"
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
