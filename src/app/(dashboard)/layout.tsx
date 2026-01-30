import { DashboardNav } from '@/components/dashboard-nav';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import Image from 'next/image';
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 [&+footer]:inset-x-auto [&+footer]:left-auto [&+footer]:right-4 [&+footer]:bottom-4 [&+footer]:w-auto [&+footer]:justify-end [&+footer]:bg-transparent [&+footer]:p-0">
        {children}
      </main>
      <footer className="fixed inset-x-0 !bottom-0 z-50 flex !justify-end bg-muted/30 !p-0 !m-0 !left-0 !right-0 !inset-x-0 !inset-y-auto !top-auto !right-auto !left-auto !right-0">
        <a
          className="!p-0 !m-0"
          href="https://www.fatsecret.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Powered by FatSecret"
        >
          <Image
            className="block !m-0"
            src="https://platform.fatsecret.com/api/static/images/powered_by_fatsecret.png"
            alt="Powered by FatSecret"
            width={170}
            height={32}
            unoptimized
          />
        </a>
      </footer>
    </div>
  );
}
