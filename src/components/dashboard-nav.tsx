'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserNav } from '@/components/user-nav';
import { ThemeSwitcher } from '@/components/theme-switcher';
import {
  Menu,
  X,
  LayoutDashboard,
  UtensilsCrossed,
  CalendarDays,
  Dumbbell,
  Target,
  Bell,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Food Log', href: '/food-log', icon: UtensilsCrossed },
  { name: 'Meal Planner', href: '/meal-planner', icon: CalendarDays },
  { name: 'Exercise Library', href: '/exercise-library', icon: Dumbbell },
  { name: 'Goals', href: '/goals', icon: Target },
];

interface DashboardNavProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-outline-variant"
      style={{ paddingRight: 'var(--removed-body-scroll-bar-size, 0px)' }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand + desktop nav links */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="shrink-0">
              <span className="text-xl italic font-headline font-semibold text-primary">
                Vitalis
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative px-4 py-5 text-sm font-medium transition-colors ${
                      active
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Notifications"
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Bell className="h-5 w-5" />
            </button>
            <ThemeSwitcher />
            <UserNav user={user} />

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div id="mobile-nav-menu" className="md:hidden border-t border-outline-variant bg-background/95">
          <div className="py-2 max-w-screen-2xl mx-auto px-4">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-md ${
                    active
                      ? 'text-primary bg-primary/5 border-l-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
