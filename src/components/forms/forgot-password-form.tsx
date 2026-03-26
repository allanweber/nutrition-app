'use client';

import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiError, ValidationError } from '@/lib/api-error';
import { forgotPasswordFormSchema, zodValidator } from '@/lib/form-validation';
import type { ForgotPasswordFormData } from '@/lib/form-validation';
import { useRequestPasswordResetCodeMutation } from '@/queries/auth-codes';

interface ForgotPasswordFormProps {
  defaultEmail?: string;
  onSuccess: (email: string) => void;
}

export function ForgotPasswordForm({ defaultEmail = '', onSuccess }: ForgotPasswordFormProps) {
  const { error, handleError, clearError, isSubmitting, startSubmitting, finishSubmitting } = useApiError();
  const requestMutation = useRequestPasswordResetCodeMutation();

  const form = useForm({
    defaultValues: {
      email: defaultEmail,
    } as ForgotPasswordFormData,
    onSubmit: async ({ value }) => {
      clearError();
      startSubmitting();
      try {
        await requestMutation.mutateAsync({ email: value.email });
        onSuccess(value.email);
      } catch (e) {
        handleError(e);
        throw e;
      } finally {
        finishSubmitting();
      }
    },
  });

  const isBusy = isSubmitting || requestMutation.isPending;

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
        validators={{ onChange: zodValidator(forgotPasswordFormSchema.shape.email) }}
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

      <ValidationError error={error} />

      <Button type="submit" className="w-full" disabled={isBusy}>
        {isBusy ? 'Sending…' : 'Send reset code'}
      </Button>
    </form>
  );
}
