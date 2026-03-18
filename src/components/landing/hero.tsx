'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Check, Droplets, Beef, Wheat } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-muted/40">

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
              className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6"
            >
              <span className="mr-2">New</span>
              <span>AI-powered meal suggestions</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Track Smarter.{' '}
              <span className="text-primary">
                Eat Better.
              </span>{' '}
              Live Healthier.
            </h1>

            {/* Subtext */}
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              The intelligent nutrition platform for{' '}
              <strong className="text-foreground">individuals</strong> reaching their goals and{' '}
              <strong className="text-foreground">professionals</strong> managing client success.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 h-auto"
                asChild
              >
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 h-auto"
                asChild
              >
                <a href="#demo">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </a>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-muted-foreground">
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
          >
            {/* Dashboard Card */}
            <div className="bg-card rounded-2xl shadow-2xl p-6 border border-border">
              {/* Mini Dashboard Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-card-foreground">Today&apos;s Progress</h3>
                  <p className="text-sm text-muted-foreground">Calories &amp; Macros</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-sm tabular-nums">78%</span>
                </div>
              </div>

              {/* Calorie Ring */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90" aria-hidden="true">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="var(--border)"
                      strokeWidth="12"
                      fill="none"
                    />
                    <motion.circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="var(--primary)"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 440' }}
                      animate={{ strokeDasharray: '343 440' }}
                      transition={{ duration: 2, delay: 1 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                      className="text-3xl font-bold text-card-foreground tabular-nums"
                    >
                      1,560
                    </motion.span>
                    <span className="text-sm text-muted-foreground">of 2,000 cal</span>
                  </div>
                </div>
              </div>

              {/* Macro Bars */}
              <div className="space-y-4">
                <MacroBar icon={Beef} label="Protein" current={85} goal={120} color="bg-rose-500" />
                <MacroBar icon={Wheat} label="Carbs" current={180} goal={250} color="bg-amber-500" />
                <MacroBar icon={Droplets} label="Fat" current={52} goal={65} color="bg-sky-500" />
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
    <div className="flex items-center space-x-3">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-foreground font-medium tabular-nums">{current}g / {goal}g</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.5, delay: 1.2 }}
            className={`h-full ${color} rounded-full`}
          />
        </div>
      </div>
    </div>
  );
}
