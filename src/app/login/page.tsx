'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/lib/auth-client';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Apple, ArrowLeft, Flame, Target, TrendingUp, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn.email(
        {
          email,
          password,
        },
        {
          onSuccess: () => {
            router.push('/dashboard');
            router.refresh();
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Invalid email or password');
          },
        }
      );

      if (result.error) {
        setError(result.error.message || 'Invalid email or password');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      });
    } catch {
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-emerald-600 dark:from-primary/80 dark:via-primary/70 dark:to-emerald-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 -left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
        
        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">N</span>
            </div>
            <span className="text-2xl font-bold text-white">NutritionTracker</span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome back!
            </h1>
            <p className="text-xl text-white/80">
              Continue your journey to better health and nutrition.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Track Calories</h3>
                <p className="text-sm text-white/70">Monitor your daily intake effortlessly</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Set Goals</h3>
                <p className="text-sm text-white/70">Personalized nutrition targets</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">See Progress</h3>
                <p className="text-sm text-white/70">Beautiful charts and insights</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/60 text-sm">
            Trusted by thousands of health-conscious individuals
          </p>
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
                <span className="text-primary-foreground font-bold text-xl">N</span>
              </div>
              <span className="text-xl font-bold text-foreground">NutritionTracker</span>
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
              <span className="bg-background px-4 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="h-12"
                data-testid="email-input"
              />
            </div>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="h-12"
                data-testid="password-input"
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg" data-testid="error-message">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium" 
              disabled={loading}
              data-testid="submit-button"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary font-medium hover:underline">
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
