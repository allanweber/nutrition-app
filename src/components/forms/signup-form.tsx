'use client';

import { useForm } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { signUp } from '@/lib/auth-client';
import { signupSchema, zodValidator } from '@/lib/form-validation';
import type { SignupFormData } from '@/lib/form-validation';

export function SignupForm() {
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'individual' as const,
    } as SignupFormData,
    onSubmit: async ({ value }) => {
      setAuthError(null);

      const result = await signUp.email(
        { email: value.email, password: value.password, name: value.name },
        {
          onSuccess: () => {
            void fetch('/api/auth/request-email-verification-code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ callbackURL: '/dashboard' }),
              keepalive: true,
            }).catch(() => {});
            router.push('/verify-email?callbackURL=/dashboard');
            router.refresh();
          },
          onError: (ctx) => {
            const msg = ctx.error.message || 'Signup failed';
            setAuthError(msg);
            throw new Error(msg);
          },
        },
      );

      if (result.error) {
        const msg = result.error.message || 'Signup failed';
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
      className="space-y-4"
    >
      <form.Field
        name="name"
        validators={{ onChange: zodValidator(signupSchema.shape.name) }}
      >
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Full name</Label>
            <Input
              id="name"
              type="text"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="John Doe"
              className={`h-12 ${field.state.meta.errors.length > 0 ? 'border-destructive' : ''}`}
              data-testid="name-input"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field
        name="email"
        validators={{ onChange: zodValidator(signupSchema.shape.email) }}
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
        validators={{ onChange: zodValidator(signupSchema.shape.password) }}
      >
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Min. 8 characters"
              className={`h-12 ${field.state.meta.errors.length > 0 ? 'border-destructive' : ''}`}
              data-testid="password-input"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field
        name="role"
        validators={{ onChange: zodValidator(signupSchema.shape.role) }}
      >
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="role" className="text-foreground">I am a...</Label>
            <Select
              value={field.state.value}
              onValueChange={(v) => field.handleChange(v as 'individual' | 'professional')}
            >
              <SelectTrigger
                className={`h-12 ${field.state.meta.errors.length > 0 ? 'border-destructive' : ''}`}
                data-testid="role-select"
              >
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
              </SelectContent>
            </Select>
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
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Creating account...</>
            ) : (
              'Create account'
            )}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

