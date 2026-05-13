import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

export type MacroFillTrackProps = {
  /** Visual fill amount, 0–100 (clamped). */
  percent: number;
  /** Tailwind `bg-*` class(es) for the fill (e.g. from `MACRO_COLORS` or `MACRO_CELL_FILL`). */
  fillClassName: string;
  /** Tailwind classes for the track behind the fill. */
  trackClassName?: string;
  /** Extra classes on the outer track element (e.g. `flex-1`). */
  className?: string;
  /** Height utility for the bar (default `h-2`). */
  heightClassName?: string;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

/**
 * Horizontal macro / goal fill using transform (scaleX) for smoother compositor-friendly updates.
 * Pass `role="progressbar"` and ARIA props when the bar represents a determinate goal (see `ProgressBar`).
 */
export function MacroFillTrack({
  percent,
  fillClassName,
  trackClassName = 'bg-border',
  className,
  heightClassName = 'h-2',
  ...rest
}: MacroFillTrackProps) {
  const p = Math.min(100, Math.max(0, percent));

  return (
    <div
      className={cn(heightClassName, 'w-full overflow-hidden rounded-full', trackClassName, className)}
      {...rest}
    >
      <div
        className={cn(
          'h-full w-full origin-left rounded-full transition-transform duration-500 ease-out motion-reduce:transition-none',
          fillClassName,
        )}
        style={{ transform: `scaleX(${p / 100})` }}
      />
    </div>
  );
}
