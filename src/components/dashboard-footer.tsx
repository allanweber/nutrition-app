import Link from 'next/link';

export function DashboardFooter() {
  return (
    <footer className="border-t border-border bg-background/50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-headline font-extrabold text-sm text-primary italic">Vitalis</p>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Vitalis. All rights reserved.
        </p>
        <nav className="flex items-center gap-4">
          <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Terms
          </Link>
          <Link href="/support" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}
