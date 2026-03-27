'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';

import { ForgotPasswordForm } from '@/components/forms/forgot-password-form';
import { Button } from '@/components/ui/button';
import { useApiError, ValidationError } from '@/lib/api-error';
import { useRequestPasswordResetCodeMutation } from '@/queries/auth-codes';

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const defaultEmail = use(searchParams).email ?? '';

  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (cooldownSecondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setCooldownSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldownSecondsLeft]);

  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const { error, handleError, clearError } = useApiError();
  const requestMutation = useRequestPasswordResetCodeMutation();

  const handleResend = async () => {
    if (!submittedEmail) return;
    clearError();
    try {
      await requestMutation.mutateAsync({ email: submittedEmail });
    } catch (e) {
      const parsed = handleError(e);
      const match = parsed.message.match(/Please wait (\d+)s/i);
      if (match) {
        const seconds = Number(match[1]);
        if (Number.isFinite(seconds) && seconds > 0) {
          setCooldownSecondsLeft(seconds);
        }
      }
    }
  };

  const isResendDisabled = requestMutation.isPending || cooldownSecondsLeft > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md bg-background border rounded-xl p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Forgot your password?</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a 6-digit reset code.
          </p>
        </div>

        {submittedEmail ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm">
              If an account exists for{' '}
              <span className="font-medium">{submittedEmail}</span>, we sent a
              reset code.
            </p>
            <p className="text-sm text-muted-foreground">
              Check your inbox (and spam), then enter the code to set a new
              password. Codes expire in ~10 minutes.
            </p>
            <p className="text-xs text-muted-foreground">
              You can request another code after 60 seconds (limit ~5/hour).
            </p>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link
                  href={`/reset-password?email=${encodeURIComponent(submittedEmail)}`}
                >
                  Continue
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleResend}
                disabled={isResendDisabled}
              >
                {requestMutation.isPending
                  ? 'Sending\u2026'
                  : cooldownSecondsLeft > 0
                    ? `Resend in ${cooldownSecondsLeft}s`
                    : 'Resend code'}
              </Button>
            </div>
            <ValidationError error={error} />
            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-primary hover:underline"
              >
                Back to login
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <ForgotPasswordForm
              defaultEmail={defaultEmail}
              onSuccess={(email) => setSubmittedEmail(email)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
