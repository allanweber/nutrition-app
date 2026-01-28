import { DashboardNav } from '@/components/dashboard-nav';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Gate dashboard access until email verification is complete.
  // Note: BetterAuth's cookieCache can temporarily serve stale session claims, so we read
  // the source-of-truth from the database.
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: {
      emailVerified: true,
    },
  });

  if (!userRecord?.emailVerified) {
    redirect('/verify-email');
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
