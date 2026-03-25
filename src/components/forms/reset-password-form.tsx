'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiError, ValidationError } from '@/lib/api-error';
import { resetPasswordFormSchema, zodValidator } from '@/lib/form-validation';
import type { ResetPasswordFormData } from '@/lib/form-validation';
import { useResetPasswordWithCodeMutation } from '@/queries/auth-codes';

interface ResetPasswordFormProps {
  defaultEmail?: string;
}

export function ResetPasswordForm({ defaultEmail = '' }: ResetPasswordFormProps) {
  const router = useRouter();
  const { error, handleError, clearError, isSubmitting, startSubmitting, finishSubmitting } = useApiError();
  const resetMutation = useResetPasswordWithCodeMutation();

  const form = useForm({
    defaultValues: {
      email: defaultEmail,
      code: '',
      newPassword: '',
    } as ResetPasswordFormData,
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
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="email"
        validators={{ onChange: zodValidator(resetPasswordFormSchema.shape.email) }}
      >
        {(field) => (
          <div className="space-y-2">
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
                field.state.meta.errors.length > 0 || error?.field === 'email'
                  ? 'border-destructive'
                  : ''
              }
            />
            {field.state.meta.errors.length > 0 ? (
              <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
            ) : (
              <ValidationError error={error} field="email" />
            )}
          </div>
        )}
      </form.Field>

      <form.Field
        name="code"
        validators={{ onChange: zodValidator(resetPasswordFormSchema.shape.code) }}
      >
        {(field) => (
          <div className="space-y-2">
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

      <form.Field
        name="newPassword"
        validators={{ onChange: zodValidator(resetPasswordFormSchema.shape.newPassword) }}
      >
        {(field) => (
          <div className="space-y-2">
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
                field.state.meta.errors.length > 0 || error?.field === 'newPassword'
                  ? 'border-destructive'
                  : ''
              }
            />
            {field.state.meta.errors.length > 0 ? (
              <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
            ) : (
              <ValidationError error={error} field="newPassword" />
            )}
          </div>
        )}
      </form.Field>

      <Button type="submit" className="w-full" disabled={isBusy}>
        {isBusy ? 'Resetting…' : 'Reset password'}
      </Button>
    </form>
  );
}
