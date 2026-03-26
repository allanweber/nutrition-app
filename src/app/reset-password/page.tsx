'use client';

import Link from 'next/link';
import { use } from 'react';

import { ResetPasswordForm } from '@/components/forms/reset-password-form';

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const defaultEmail = use(searchParams).email ?? '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md bg-background border rounded-xl p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your email and choose a new password.
          </p>
        </div>
        <div className="mt-6">
          <ResetPasswordForm defaultEmail={defaultEmail} />
        </div>
        <div className="text-center mt-4">
          <Link
            href="/login"
            className="text-sm text-primary hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
