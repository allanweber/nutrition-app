import Link from 'next/link';

interface SectionNudgeProps {
  message?: string;
}

export function SectionNudge({ message = 'Set your goals' }: SectionNudgeProps) {
  return (
    <Link
      href="/goals"
      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
    >
      {message}
      <span aria-hidden="true">→</span>
    </Link>
  );
}
