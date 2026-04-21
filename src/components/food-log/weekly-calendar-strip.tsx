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
      className="bg-background dark:bg-secondary rounded-2xl p-6 border border-border/30 shadow-sm relative"
      data-testid="weekly-calendar-strip"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Weekly Overview
        </span>

        <div className="flex items-center gap-3">
          {/* Today button — only shown when not already on today */}
          {(!isOnCurrentWeek || !isTodaySelected) && (
            <Button
              onClick={handleGoToToday}
              variant="ghost"
              size="sm"
              className="rounded-full h-auto py-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 hover:border-primary/40"
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
                className="rounded-full h-auto py-1.5 gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 hover:border-primary/40"
              >
                <CalendarIcon className="h-3 w-3" />
                Full Month
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

      {/* Day pills with flanking arrows */}
      <div className="flex items-center gap-1">
        <Button
          onClick={handlePrevWeek}
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

          <div className="flex flex-1 justify-between items-center overflow-x-auto hide-scrollbar">
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
                  className={[
                    'flex flex-col items-center p-3 rounded-xl min-w-13 select-none h-auto',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground'
                      : isDisabled
                        ? 'opacity-30 cursor-not-allowed text-foreground'
                        : 'cursor-pointer text-foreground',
                  ].join(' ')}
                >
                  <span
                    className={`text-xs font-bold mb-1 ${isSelected ? 'opacity-80' : 'text-muted-foreground'}`}
                  >
                    {DAY_LABELS[i]}
                  </span>
                  <span className="text-lg font-headline font-bold">{format(day, 'd')}</span>
                </Button>
              );
            })}
          </div>

        <Button
          onClick={handleNextWeek}
          disabled={weekOffset >= 0}
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
