import { DashboardNav } from '@/components/dashboard-nav';
import { DashboardFooter } from '@/components/dashboard-footer';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { emailVerificationChallenges } from '@/server/db/schema';
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

  // New-signup gating only: users are gated iff an email_verification_challenge exists.
  const challenge = await db.query.emailVerificationChallenges.findFirst({
    where: eq(emailVerificationChallenges.userId, user.id),
  });

  if (challenge) {
    redirect('/verify-email');
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <DashboardNav
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
        }}
      />

      {/* Main content */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-16 pb-6">
        {children}
      </main>

      <DashboardFooter />
    </div>
  );
}
