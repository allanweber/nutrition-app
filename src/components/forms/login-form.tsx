'use client';

import { useForm } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/lib/auth-client';
import { loginSchema, zodValidator } from '@/lib/form-validation';
import type { LoginFormData } from '@/lib/form-validation';

export function LoginForm() {
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } as LoginFormData,
    onSubmit: async ({ value }) => {
      setAuthError(null);

      const result = await signIn.email(
        { email: value.email, password: value.password },
        {
          onSuccess: () => {
            router.push('/dashboard');
            router.refresh();
          },
          onError: (ctx) => {
            const msg = ctx.error.message || 'Invalid email or password';
            setAuthError(msg);
            throw new Error(msg);
          },
        },
      );

      if (result.error) {
        const msg = result.error.message || 'Invalid email or password';
        setAuthError(msg);
        throw new Error(msg);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-5"
    >
      <form.Field
        name="email"
        validators={{ onChange: zodValidator(loginSchema.shape.email) }}
      >
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email address</Label>
            <Input
              id="email"
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="you@example.com"
              className={`h-12 ${field.state.meta.errors.length > 0 ? 'border-destructive' : ''}`}
              data-testid="email-input"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field
        name="password"
        validators={{ onChange: zodValidator(loginSchema.shape.password) }}
      >
        {(field) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Enter your password"
              className={`h-12 ${field.state.meta.errors.length > 0 ? 'border-destructive' : ''}`}
              data-testid="password-input"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.errorMap]}>
        {([errorMap]) =>
          errorMap.onSubmit || authError ? (
            <div
              className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg"
              data-testid="error-message"
            >
              {authError || String(errorMap.onSubmit)}
            </div>
          ) : null
        }
      </form.Subscribe>

      <form.Subscribe selector={(state) => [state.isSubmitting]}>
        {([isSubmitting]) => (
          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={isSubmitting}
            data-testid="submit-button"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Signing in...</>
            ) : (
              'Sign in'
            )}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
