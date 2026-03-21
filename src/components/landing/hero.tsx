'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Check, Droplets, Beef, Wheat } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-surface-container-lowest">

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-sm font-semibold mb-8"
            >
              <span>✦ New</span>
              <span>— AI-powered meal suggestions</span>
            </motion.div>

            {/* Headline */}
            <h1 className="font-headline text-5xl sm:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-[1.1] tracking-tight">
              The Living Archive of{' '}
              <span className="text-primary italic">
                Your Health.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg text-on-surface-variant mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Precision nutrition for individuals and professional tools for clinicians. Track, analyze, and optimize every aspect of human vitality.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-4 h-auto rounded-xl shadow-xl"
                asChild
              >
                <Link href="/signup">
                  Start Free Trial
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="bg-surface-container-high hover:bg-surface-container-highest text-foreground font-bold text-lg px-8 py-4 h-auto rounded-xl"
                asChild
              >
                <a href="#demo">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </a>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-on-surface-variant">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                14-day Pro trial
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-primary mr-2" />
                Cancel anytime
              </div>
            </div>
          </motion.div>

          {/* Right Content - Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Decorative blurs */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" aria-hidden="true" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10" aria-hidden="true" />

            {/* Dashboard Card */}
            <div className="bg-surface-container-lowest rounded-3xl shadow-2xl p-8 border border-outline-variant/10">
              {/* Mini Dashboard Header */}
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="font-headline font-bold text-xl text-foreground">Daily Snapshot</h3>
                  <p className="text-sm text-on-surface-variant">Wednesday, May 24</p>
                </div>
                <div className="w-10 h-10 bg-primary-fixed rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">JD</span>
                </div>
              </div>

              {/* Calorie Ring + Macro Bars side by side */}
              <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="relative w-48 h-48 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" aria-hidden="true">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="var(--surface-container)"
                      strokeWidth="12"
                      fill="none"
                    />
                    <motion.circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="var(--primary)"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 502' }}
                      animate={{ strokeDasharray: '392 502' }}
                      transition={{ duration: 2, delay: 1 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                      className="text-3xl font-black font-headline text-foreground tabular-nums"
                    >
                      1,560
                    </motion.span>
                    <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">/ 2000 kcal</span>
                  </div>
                </div>

              {/* Macro Bars */}
              <div className="flex-1 w-full space-y-6">
                <MacroBar icon={Beef} label="Protein" current={85} goal={120} color="bg-rose-500" />
                <MacroBar icon={Wheat} label="Carbs" current={180} goal={250} color="bg-amber-500" />
                <MacroBar icon={Droplets} label="Fat" current={52} goal={65} color="bg-sky-500" />
              </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function MacroBar({
  icon: Icon,
  label,
  current,
  goal,
  color,
}: {
  icon: React.ElementType;
  label: string;
  current: number;
  goal: number;
  color: string;
}) {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold">
        <span className="flex items-center gap-1.5 text-foreground">
          <Icon className="h-3.5 w-3.5 text-on-surface-variant" aria-hidden="true" />
          {label}
        </span>
        <span className="tabular-nums text-on-surface-variant">{current}g / {goal}g</span>
      </div>
      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, delay: 1.2 }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
}
