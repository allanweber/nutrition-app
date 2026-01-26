'use client';

import { useForm } from '@tanstack/react-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiError, ValidationError } from '@/lib/api-error';
import { validatePasswordPolicy } from '@/lib/password-policy';
import { useResetPasswordWithCodeMutation } from '@/queries/auth-codes';

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const defaultEmail = use(searchParams).email ?? '';
  
  const router = useRouter();
  
  const {
    error,
    handleError,
    clearError,
    isSubmitting,
    startSubmitting,
    finishSubmitting,
  } = useApiError();
  const resetMutation = useResetPasswordWithCodeMutation();

  const form = useForm({
    defaultValues: {
      email: defaultEmail,
      code: '',
      newPassword: '',
    },
    onSubmit: async ({ value }) => {
      clearError();
      startSubmitting();
      try {
        await resetMutation.mutateAsync({
          email: value.email,
          code: value.code,
          newPassword: value.newPassword,
        });

        router.push('/login?reset=1');
        router.refresh();
      } catch (e) {
        handleError(e);
        throw e;
      } finally {
        finishSubmitting();
      }
    },
  });

  const isBusy = isSubmitting || resetMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md bg-background border rounded-xl p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your email and choose a new password.
          </p>
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
            name="email"
            validators={{
              onChange: ({ value }) => {
                const trimmed = value.trim();
                if (!trimmed) return 'Email is required';
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
                <Label htmlFor={field.name}>Code</Label>
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

          <form.Field
            name="newPassword"
            validators={{
              onChange: ({ value }) => {
                const error = validatePasswordPolicy(value);
                return error ? error : undefined;
              },
            }}
          >
            {(field) => (
              <div className='space-y-2'>
                <Label htmlFor={field.name}>New password</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Enter a new password"
                  className={
                    field.state.meta.errors.length > 0 ||
                    error?.field === 'newPassword'
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }
                />
                {field.state.meta.errors.length > 0 ? (
                  <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {field.state.meta.errors[0]}
                  </div>
                ) : (
                  <ValidationError error={error} field="newPassword" />
                )}
              </div>
            )}
          </form.Field>

          <Button type="submit" className="w-full" disabled={isBusy}>
            {isBusy ? 'Resetting…' : 'Reset password'}
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
      </div>
    </div>
  );
}
