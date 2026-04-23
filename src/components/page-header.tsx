import { cn } from '@/lib/utils';

interface PageHeaderProps {
  overline?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export function PageHeader({ overline, title, subtitle, children, className, 'data-testid': testId }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6',
        className
      )}
    >
      <div>
        {overline && (
          <p className="text-primary font-bold uppercase tracking-[0.2em] text-xs mb-2">
            {overline}
          </p>
        )}
        <h1 className="text-4xl font-headline font-extrabold text-foreground tracking-tight leading-tight" data-testid={testId}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mt-1 max-w-lg">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex gap-2 shrink-0">{children}</div>}
    </div>
  );
}
