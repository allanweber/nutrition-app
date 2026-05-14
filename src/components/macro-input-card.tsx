'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MacroInputCardProps {
  label: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldApi: any;
  unit: string;
  bgClass?: string;
  textClass?: string;
  inputTestId?: string;
}

/**
 * Styled macro input card with tinted background and colored label.
 * Pass bgClass/textClass from MACRO_CELL_BG/TEXT for colored variants.
 * Omit them to render the neutral (calories) style.
 */
export function MacroInputCard({
  label,
  name,
  fieldApi,
  unit,
  bgClass,
  textClass,
  inputTestId,
}: MacroInputCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 min-w-0',
        bgClass ?? 'bg-background border-border/20',
      )}
    >
      <span className={cn('text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate', textClass ?? 'text-muted-foreground')}>
        {label}
      </span>
      <div className="flex items-center gap-1.5 min-w-0">
        <Input
          id={name}
          type="number"
          min="0"
          step="0.1"
          value={fieldApi.state.value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => fieldApi.handleChange(e.target.value)}
          onBlur={fieldApi.handleBlur}
          className={cn(
            'text-base sm:text-xl font-bold h-10 sm:h-11 bg-white min-w-0',
            fieldApi.state.meta.errors.length > 0 ? 'border-destructive' : 'border-border/30',
          )}
          data-testid={inputTestId ?? `field-${name}`}
        />
        <span className="text-xs sm:text-sm font-semibold text-muted-foreground shrink-0">{unit}</span>
      </div>
      {fieldApi.state.meta.errors.length > 0 && (
        <p className="text-xs text-destructive">{fieldApi.state.meta.errors[0]}</p>
      )}
    </div>
  );
}
