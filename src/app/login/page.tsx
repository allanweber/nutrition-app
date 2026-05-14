'use client';

import { ThemeSwitcher } from '@/components/theme-switcher';
import { LoginForm } from '@/components/forms/login-form';
import { Button } from '@/components/ui/button';
import { signIn } from '@/lib/auth-client';
import {
  Apple,
  ArrowLeft,
  Loader2,
  Target,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { VitalisMark } from '@/components/vitalis-mark';
import { useState } from 'react';

export default function LoginPage() {
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
      // Error will be shown through form state if needed
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-primary to-teal-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center space-x-3">
          <VitalisMark size={40} className="size-10 shrink-0 rounded-lg ring-2 ring-white/25" priority />
          <span className="text-xl font-bold text-white">
            Vitalis
          </span>
        </Link>

        {/* Main Content */}
        <div className="relative z-10 space-y-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-4">
              Nutrition Intelligence
            </p>
            <h2 className="text-4xl font-bold text-white leading-tight mb-5">
              Precision tracking for serious results.
            </h2>
            <p className="text-lg text-white/80 leading-relaxed">
              Built for dietitians and health professionals. Every macro, every
              meal, every client — visible at a glance.
            </p>
          </div>

          <div className="space-y-0 border-t border-white/20 pt-8">
            <div className="flex justify-between items-baseline py-3 border-b border-white/20">
              <span className="text-sm text-white/60">Foods in database</span>
              <span className="text-sm font-semibold text-white tabular-nums">500,000+</span>
            </div>
            <div className="flex justify-between items-baseline py-3 border-b border-white/20">
              <span className="text-sm text-white/60">Macros tracked</span>
              <span className="text-sm font-semibold text-white">Calories · Protein · Carbs · Fat</span>
            </div>
            <div className="flex justify-between items-baseline py-3">
              <span className="text-sm text-white/60">Goal types</span>
              <span className="text-sm font-semibold text-white tabular-nums">7</span>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 border-t border-white/20 pt-6">
          <blockquote className="text-white/70 text-sm leading-relaxed">
            &ldquo;The data density is exactly what I needed as a practitioner.
            Finally a tool that respects my workflow.&rdquo;
          </blockquote>
          <p className="text-white/50 text-xs mt-2">— Registered Dietitian</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-background">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between p-4 lg:p-6">
          <Link
            href="/"
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to home</span>
          </Link>
          <ThemeSwitcher />
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center">
              <Link href="/" className="inline-flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl">
                    N
                  </span>
                </div>
                <span className="text-xl font-bold text-foreground">
                  Vitalis
                </span>
              </Link>
            </div>

            {/* Header */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-foreground">Sign in</h2>
              <p className="mt-2 text-muted-foreground">
                Enter your credentials to access your account
              </p>
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base font-medium dark:hover:bg-muted dark:hover:text-foreground dark:hover:border-primary/50"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              data-testid="google-button"
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
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
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </Button>

            {/* Divider */}
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

            {/* Form */}
            <LoginForm />

            {/* Sign Up Link */}
            <p className="text-center text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-primary font-medium hover:underline"
              >
                Create one free
              </Link>
            </p>

            {/* Trust Indicators */}
            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-center space-x-6 text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Apple className="w-4 h-4" />
                  <span className="text-xs">500K+ Foods</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span className="text-xs">Smart Goals</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
