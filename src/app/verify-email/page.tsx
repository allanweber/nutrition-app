'use client';

import { use } from 'react';

import { LogoutButton } from '@/components/logout-button';
import { VerifyEmailForm } from '@/components/forms/verify-email-form';

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const raw = use(searchParams).callbackURL ?? '';
  const callbackURL = raw.startsWith('/') ? raw : '/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md bg-background border rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Verify your email</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the 6-digit code we sent to your email. Codes expire in ~10 minutes.
            </p>
          </div>
          <LogoutButton />
        </div>
        <div className="mt-6">
          <VerifyEmailForm callbackURL={callbackURL} />
        </div>
      </div>
    </div>
  );
}
