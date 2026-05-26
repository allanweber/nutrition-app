'use client';

import { ThemeSwitcher } from '@/components/theme-switcher';
import { SignupForm } from '@/components/forms/signup-form';
import { Button } from '@/components/ui/button';
import { signIn } from '@/lib/auth-client';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { VitalisMark } from '@/components/vitalis-mark';
import { useState } from 'react';

export default function SignupPage() {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      });
    } catch {
      setGoogleLoading(false);
    }
  };

  const capabilities = [
    'Log food against 500,000+ verified entries',
    'Track calories and macros to the gram',
    'Set clinician-grade nutrition targets',
    'Review trends on a precision dashboard',
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left — product positioning (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-border bg-muted/40 p-12">
        <Link href="/" className="flex items-center gap-3">
          <VitalisMark size={48} className="size-12 shrink-0 rounded-xl" priority />
          <span className="font-headline text-2xl font-extrabold text-foreground">Vitalis</span>
        </Link>

        <div className="space-y-8 max-w-md">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Precision nutrition
            </p>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-foreground">
              Nutrition tracking built for accuracy.
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              For dietitians who need credible client data and individuals who want the same rigor in daily logging.
            </p>
          </div>

          <ul className="space-y-3">
            {capabilities.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-3 w-3" aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <dl className="grid grid-cols-3 gap-6 border-t border-border pt-8">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Database</dt>
            <dd className="mt-1 font-headline text-2xl font-black tabular-nums text-foreground">500K+</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Macros</dt>
            <dd className="mt-1 font-headline text-2xl font-black tabular-nums text-foreground">Per g</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Plans</dt>
            <dd className="mt-1 font-headline text-2xl font-black tabular-nums text-foreground">Pro</dd>
          </div>
        </dl>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-background">
        <div className="flex items-center justify-between p-4 lg:p-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            <span className="text-sm font-medium">Back to home</span>
          </Link>
          <ThemeSwitcher />
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-6">
            <div className="lg:hidden text-center">
              <Link href="/" className="inline-flex items-center gap-2">
                <VitalisMark size={40} className="size-10 shrink-0 rounded-lg" />
                <span className="font-headline text-xl font-extrabold text-foreground">Vitalis</span>
              </Link>
            </div>

            <div className="text-center lg:text-left">
              <h2 className="font-headline text-3xl font-extrabold text-foreground">
                Create your account
              </h2>
              <p className="mt-2 text-muted-foreground">
                Start logging with professional-grade precision.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base font-medium"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              data-testid="google-button"
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {googleLoading ? 'Connecting...' : 'Sign up with Google'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <SignupForm />

            <p className="text-xs text-center text-muted-foreground">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>

            <p className="text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
