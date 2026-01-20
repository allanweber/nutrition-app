'use client';

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
import { signIn, signUp } from '@/lib/auth-client';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { ArrowLeft, Check, Loader2, Sparkles, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'individual' | 'professional'>('individual');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signUp.email(
        {
          email,
          password,
          name,
        },
        {
          onSuccess: () => {
            router.push('/dashboard');
            router.refresh();
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Signup failed');
          },
        },
      );

      if (result.error) {
        setError(result.error.message || 'Signup failed');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An error occurred. Please try again.';
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

  const benefits = [
    'Track calories and macros effortlessly',
    'Access 500,000+ food database',
    'Set personalized nutrition goals',
    'Beautiful charts and insights',
    'Sync across all your devices',
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-primary to-teal-600 dark:from-emerald-800 dark:via-primary/80 dark:to-teal-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">N</span>
            </div>
            <span className="text-2xl font-bold text-white">
              NutritionTracker
            </span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium text-white">
                Free forever for individuals
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Transform your health with smart nutrition tracking
            </h1>
            <p className="text-lg text-white/80">
              Join thousands who have achieved their health goals with our
              intuitive platform.
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/90">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <p className="text-white/90 italic mb-4">
              &quot;This app completely changed how I approach nutrition. The
              insights are incredible and the food database is massive!&quot;
            </p>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">SM</span>
              </div>
              <div>
                <p className="text-white font-medium">Sarah M.</p>
                <p className="text-white/60 text-sm">Lost 30 lbs in 6 months</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-6">
          <div>
            <p className="text-3xl font-bold text-white">500K+</p>
            <p className="text-white/60 text-sm">Foods in database</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">50K+</p>
            <p className="text-white/60 text-sm">Active users</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">4.9</p>
            <p className="text-white/60 text-sm">App store rating</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
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
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <Link href="/" className="inline-flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">
                  N
                </span>
              </div>
              <span className="text-xl font-bold text-foreground">
                NutritionTracker
              </span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">
              Create your account
            </h2>
            <p className="mt-2 text-muted-foreground">
              Start your journey to better nutrition today
            </p>
          </div>

          {/* Google Sign Up */}
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
            {googleLoading ? 'Connecting...' : 'Sign up with Google'}
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Full name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="h-12"
                data-testid="name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email address
              </Label>
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
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                minLength={8}
                className="h-12"
                data-testid="password-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-foreground">
                I am a...
              </Label>
              <Select
                value={role}
                onValueChange={(value: 'individual' | 'professional') =>
                  setRole(value)
                }
              >
                <SelectTrigger
                  data-testid="role-select"
                  className="w-full h-12"
                >
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                      Individual tracking my nutrition
                    </div>
                  </SelectItem>
                  <SelectItem value="professional">
                    <div className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-muted-foreground" />
                      Professional dietitian/nutritionist
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div
                className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg"
                data-testid="error-message"
              >
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
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
