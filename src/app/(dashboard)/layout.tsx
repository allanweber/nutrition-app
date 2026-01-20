import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { DashboardNav } from '@/components/dashboard-nav';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNav 
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
        }}
      />

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
