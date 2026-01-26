'use client';

import { useForm } from '@tanstack/react-form';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const {
    error,
    handleError,
    clearError,
    isSubmitting,
    startSubmitting,
    finishSubmitting,
  } = useApiError();

  const requestMutation = useRequestPasswordResetCodeMutation();

  const form = useForm({
    defaultValues: {
      email: defaultEmail,
    },
    onSubmit: async ({ value }) => {
      clearError();
      startSubmitting();
      try {
        await requestMutation.mutateAsync({ email: value.email });
        setSubmittedEmail(value.email);
      } catch (e) {
        handleError(e);
        throw e;
      } finally {
        finishSubmitting();
      }
    },
  });

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

  const isBusy = isSubmitting || requestMutation.isPending;
  const isResendDisabled = requestMutation.isPending || cooldownSecondsLeft > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md bg-background border rounded-xl p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Forgot your password?</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we’ll send you a 6-digit reset code.
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
            <ValidationError error={error} />
            <div className="flex gap-2">
              <Button asChild className="w-full">
                <Link
                  href={`/reset-password?email=${encodeURIComponent(submittedEmail)}`}
                >
                  Continue
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={isResendDisabled}
              >
                {requestMutation.isPending
                  ? 'Sending…'
                  : cooldownSecondsLeft > 0
                    ? `Resend in ${cooldownSecondsLeft}s`
                    : 'Resend code'}
              </Button>
            </div>
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
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) => {
                  const trimmed = value.trim();
                  if (!trimmed) return 'Email is required';
                  // simple email check
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
                    return 'Please enter a valid email address';
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className='space-y-2'>
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="you@example.com"
                    className={
                      field.state.meta.errors.length > 0 ||
                      error?.field === 'email'
                        ? 'border-red-500 focus-visible:ring-red-500'
                        : ''
                    }
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {field.state.meta.errors[0]}
                    </div>
                  ) : (
                    <ValidationError error={error} field="email" />
                  )}
                </div>
              )}
            </form.Field>

            <ValidationError error={error} />

            <Button type="submit" className="w-full" disabled={isBusy}>
              {isBusy ? 'Sending…' : 'Send reset code'}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-primary hover:underline"
              >
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
