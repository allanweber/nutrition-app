'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiError, ValidationError } from '@/lib/api-error';
import { verifyEmailFormSchema, zodValidator } from '@/lib/form-validation';
import type { VerifyEmailFormData } from '@/lib/form-validation';
import {
  useRequestEmailVerificationCodeMutation,
  useVerifyEmailCodeMutation,
} from '@/queries/auth-codes';

const RESEND_COOLDOWN_SECONDS = 60;

interface VerifyEmailFormProps {
  callbackURL: string;
}

export function VerifyEmailForm({ callbackURL }: VerifyEmailFormProps) {
  const router = useRouter();
  const { error, handleError, clearError, isSubmitting, startSubmitting, finishSubmitting } = useApiError();
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
    defaultValues: { code: '' } as VerifyEmailFormData,
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
  const isResendDisabled = requestCodeMutation.isPending || cooldownSecondsLeft > 0;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="code"
        validators={{ onChange: zodValidator(verifyEmailFormSchema.shape.code) }}
      >
        {(field) => (
          <div className="space-y-2">
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
                field.state.meta.errors.length > 0 || error?.field === 'code'
                  ? 'border-destructive'
                  : ''
              }
            />
            {field.state.meta.errors.length > 0 ? (
              <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
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
          Didn&apos;t receive it? Check your spam folder. You can request a new code every 60 seconds.
        </p>
      </div>
    </form>
  );
}
