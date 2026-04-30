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
  id?: string;
  value: string; // ISO "YYYY-MM-DD" or "" — external contract unchanged
  onChange: (value: string) => void; // emits ISO "YYYY-MM-DD" or ""
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  inputTestId?: string;
  inputClassName?: string;
  className?: string;
}

function isoToDisplay(iso: string): string {
  if (!iso) return '';
  const d = parse(iso, 'yyyy-MM-dd', new Date());
  return isValid(d) ? format(d, 'dd/MM/yyyy') : iso;
}

function displayToIso(display: string): string {
  if (!display) return '';
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(display)) return '';
  const d = parse(display, 'dd/MM/yyyy', new Date());
  if (!isValid(d)) return '';
  return format(d, 'dd/MM/yyyy') === display ? format(d, 'yyyy-MM-dd') : '';
}

function applyDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function DateInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder = 'dd/mm/yyyy',
  disabled,
  inputTestId,
  inputClassName,
  className,
}: DateInputProps) {
  const [inputValue, setInputValue] = useState(() => isoToDisplay(value));
  const [open, setOpen] = useState(false);

  // Sync when the ISO value changes externally (e.g. form reset / initial load)
  useEffect(() => {
    setInputValue(isoToDisplay(value));
  }, [value]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = applyDateMask(e.target.value);
    setInputValue(masked);
    if (!masked) {
      onChange('');
      return;
    }
    const iso = displayToIso(masked);
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
        id={id}
        data-testid={inputTestId}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn('pr-10', inputClassName)}
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
