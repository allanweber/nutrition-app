'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Target,
  Utensils,
  TrendingUp,
  Trophy,
  Calendar,
  ArrowRight,
  Flame,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'Set Your Goals',
    description: 'Weight loss, maintenance, or gain with custom calorie and macro targets tailored to you.',
  },
  {
    icon: Utensils,
    title: 'Log Effortlessly',
    description: 'Search 500,000+ foods from the FatSecret database, or simply type "chicken salad for lunch".',
  },
  {
    icon: TrendingUp,
    title: 'See Your Progress',
    description: 'Beautiful charts showing daily, weekly, and monthly nutrition trends.',
  },
  {
    icon: Trophy,
    title: 'Stay Motivated',
    description: 'Streak tracking, achievements, and milestone celebrations keep you going.',
  },
  {
    icon: Calendar,
    title: 'Plan Meals',
    description: 'Create and save favorite meals for lightning-fast logging.',
  },
];

export default function ForIndividuals() {
  return (
    <section id="for-individuals" className="py-20 md:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              For Individuals
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Your Personal{' '}
              <span className="text-primary">
                Nutrition Companion
              </span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              Whether you&apos;re losing weight, building muscle, or just eating healthier, 
              we make tracking simple and insights powerful.
            </p>

            <div className="space-y-5 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-4"
                >
                   <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                   <div>
                     <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                     <p className="text-muted-foreground text-sm">{feature.description}</p>
                   </div>
                </motion.div>
              ))}
            </div>

            <Button size="lg" asChild>
              <Link href="/signup">
                Start Tracking Free
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </motion.div>

          {/* Right - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Phone Frame */}
            <div className="relative mx-auto w-72 md:w-80">
                    <div className="bg-foreground/90 rounded-[3rem] p-3 shadow-2xl">
                  <div className="bg-background rounded-[2.5rem] overflow-hidden">
                  {/* Phone Screen Content */}
                  <div className="p-6">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center mb-6 text-xs text-muted-foreground" aria-hidden="true">
                      <span>9:41</span>
                      <div className="flex space-x-1">
                        <div className="w-4 h-2 bg-muted-foreground/40 rounded-sm" />
                        <div className="w-4 h-2 bg-muted-foreground/40 rounded-sm" />
                        <div className="w-6 h-3 bg-primary rounded-sm" />
                      </div>
                    </div>

                    {/* Header */}
                    <div className="mb-6">
                       <h3 className="text-lg font-bold text-foreground">Good morning, Sarah!</h3>
                       <p className="text-sm text-muted-foreground">Let&apos;s crush your goals today</p>
                    </div>

                    {/* Calorie Ring */}
                    <div className="flex justify-center mb-6">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="hsl(var(--border))"
                            strokeWidth="10"
                            fill="none"
                          />
                          <motion.circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="url(#mobileGradient)"
                            strokeWidth="10"
                            fill="none"
                            strokeLinecap="round"
                            initial={{ strokeDasharray: '0 352' }}
                            whileInView={{ strokeDasharray: '275 352' }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            viewport={{ once: true }}
                          />
                          <defs>
                            <linearGradient id="mobileGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="hsl(var(--primary))" />
                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <Flame className="h-5 w-5 text-orange-500 mb-1" />
                           <span className="text-2xl font-bold text-foreground">1,560</span>
                           <span className="text-xs text-muted-foreground">/ 2,000 cal</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-rose-50 dark:bg-rose-950/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">85g</div>
                        <div className="text-xs text-muted-foreground">Protein</div>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">180g</div>
                        <div className="text-xs text-muted-foreground">Carbs</div>
                      </div>
                      <div className="bg-sky-50 dark:bg-sky-950/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-sky-600 dark:text-sky-400 tabular-nums">52g</div>
                        <div className="text-xs text-muted-foreground">Fat</div>
                      </div>
                    </div>

                    {/* Streak */}
                    <div className="bg-primary rounded-xl p-4 text-primary-foreground">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm opacity-80">Current Streak</div>
                          <div className="text-2xl font-bold tabular-nums">7 Days</div>
                        </div>
                        <Zap className="h-8 w-8 opacity-80" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
