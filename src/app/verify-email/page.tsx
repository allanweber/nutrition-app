'use client';

import { use } from 'react';

import { LogoutButton } from '@/components/logout-button';
import { VerifyEmailForm } from '@/components/forms/verify-email-form';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const raw = use(searchParams).callbackURL ?? '';
  const callbackURL = raw.startsWith('/') ? raw : '/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            Enter the 6-digit code we sent to your email. Codes expire in ~10 minutes.
          </CardDescription>
          <CardAction>
            <LogoutButton />
          </CardAction>
        </CardHeader>
        <CardContent>
          <VerifyEmailForm callbackURL={callbackURL} />
        </CardContent>
      </Card>
    </div>
  );
}
