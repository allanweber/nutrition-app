'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

import { LogoutButton } from '@/components/logout-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiError, ValidationError } from '@/lib/api-error';
import {
  useRequestEmailVerificationCodeMutation,
  useVerifyEmailCodeMutation,
} from '@/queries/auth-codes';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const router = useRouter();

  const raw =  use(searchParams).callbackURL ?? '';
  const callbackURL = raw.startsWith('/') ? raw : '/dashboard';

  const {
    error,
    handleError,
    clearError,
    isSubmitting,
    startSubmitting,
    finishSubmitting,
  } = useApiError();

  const requestCodeMutation = useRequestEmailVerificationCodeMutation();
  const verifyCodeMutation = useVerifyEmailCodeMutation();


  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (cooldownSecondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setCooldownSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldownSecondsLeft]);

  const form = useForm({
    defaultValues: {
      code: '',
    },
    onSubmit: async ({ value }) => {
      clearError();
      startSubmitting();
      try {
        await verifyCodeMutation.mutateAsync({ code: value.code });
        router.push(callbackURL);
        router.refresh();
      } catch (e) {
        handleError(e);
        throw e;
      } finally {
        finishSubmitting();
      }
    },
  });

  const handleResend = async () => {
    clearError();
    try {
      await requestCodeMutation.mutateAsync({ callbackURL });
      setCooldownSecondsLeft(RESEND_COOLDOWN_SECONDS);
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

  const isBusy = isSubmitting || verifyCodeMutation.isPending;
  const isResendDisabled =
    requestCodeMutation.isPending || cooldownSecondsLeft > 0;

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

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="code"
            validators={{
              onChange: ({ value }) => {
                const trimmed = value.trim();
                if (!trimmed) return 'Code is required';
                if (!/^\d{6}$/.test(trimmed)) return 'Code must be 6 digits';
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className='space-y-2'>
                <Label htmlFor={field.name}>Verification code</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className={
                    field.state.meta.errors.length > 0 ||
                    error?.field === 'code'
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }
                />
                {field.state.meta.errors.length > 0 ? (
                  <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {field.state.meta.errors[0]}
                  </div>
                ) : (
                  <ValidationError error={error} field="code" />
                )}
              </div>
            )}
          </form.Field>

          {error?.field == null ? <ValidationError error={error} /> : null}

          <Button type="submit" className="w-full" disabled={isBusy}>
            {isBusy ? 'Verifying…' : 'Verify email'}
          </Button>

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={isResendDisabled}
            >
              {requestCodeMutation.isPending
                ? 'Sending…'
                : cooldownSecondsLeft > 0
                  ? `Resend in ${cooldownSecondsLeft}s`
                  : 'Resend code'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Didn’t get it? Check spam, then resend (60s cooldown, ~5/hour).
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
