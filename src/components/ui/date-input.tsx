'use client';

import { format, isValid, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateInputProps {
  value: string; // ISO "YYYY-MM-DD" or "" — external contract unchanged
  onChange: (value: string) => void; // emits ISO "YYYY-MM-DD" or ""
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function isoToDisplay(iso: string): string {
  if (!iso) return '';
  const d = parse(iso, 'yyyy-MM-dd', new Date());
  return isValid(d) ? format(d, 'dd/MM/yyyy') : iso;
}

function displayToIso(display: string): string {
  if (!display) return '';
  const d = parse(display, 'dd/MM/yyyy', new Date());
  return isValid(d) ? format(d, 'yyyy-MM-dd') : '';
}

export function DateInput({
  value,
  onChange,
  onBlur,
  placeholder = 'dd/mm/yyyy',
  disabled,
  className,
}: DateInputProps) {
  const [inputValue, setInputValue] = useState(() => isoToDisplay(value));
  const [open, setOpen] = useState(false);

  // Sync when the ISO value changes externally (e.g. form reset / initial load)
  useEffect(() => {
    setInputValue(isoToDisplay(value));
  }, [value]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setInputValue(raw);
    if (!raw) {
      onChange('');
      return;
    }
    const iso = displayToIso(raw);
    if (iso) onChange(iso);
    // while still typing an incomplete date, don't emit — parent keeps old ISO
  }

  function handleSelect(day: Date | undefined) {
    if (day) {
      setInputValue(format(day, 'dd/MM/yyyy'));
      onChange(format(day, 'yyyy-MM-dd'));
    } else {
      setInputValue('');
      onChange('');
    }
    setOpen(false);
  }

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  const validSelected = selected && isValid(selected) ? selected : undefined;

  return (
    <div className={cn('relative', className)}>
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="pr-10"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={validSelected}
            onSelect={handleSelect}
            defaultMonth={validSelected}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
