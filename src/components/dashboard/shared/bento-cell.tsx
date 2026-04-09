import { cn } from '@/lib/utils';

interface BentoCellProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoCell({ children, className }: BentoCellProps) {
  return (
    <div
      className={cn(
        'rounded-[24px] bg-muted border border-border shadow-sm p-5 sm:p-8 h-full',
        className,
      )}
    >
      {children}
    </div>
  );
}
