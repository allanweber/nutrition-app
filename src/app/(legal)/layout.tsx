'use client';

import { ThemeSwitcher } from '@/components/theme-switcher';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const goBack = () => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      router.back();
    } else {
      // If no history, go to home
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={goBack}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} NutritionTracker. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <Link href="/terms" className={`text-sm hover:text-foreground transition-colors ${pathname === '/terms' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Terms of Service
              </Link>
              <Link href="/privacy" className={`text-sm hover:text-foreground transition-colors ${pathname === '/privacy' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Privacy Policy
              </Link>
              <Link href="mailto:support@nutritiontracker.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
