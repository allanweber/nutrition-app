'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { name: 'Dashboard', active: true },
  { name: 'Food Log', active: false },
  { name: 'Meal Planner', active: false },
  { name: 'Goals', active: false },
];

const MACROS = [
  { label: 'Protein', val: '85g', goal: '120g', pct: 71, color: 'bg-rose-500' },
  { label: 'Carbs', val: '180g', goal: '250g', pct: 72, color: 'bg-amber-500' },
  { label: 'Fat', val: '52g', goal: '65g', pct: 80, color: 'bg-sky-500' },
];

export default function Hero() {
  return (
    <section
      className="relative bg-background"
      style={{ backgroundImage: 'radial-gradient(circle, oklch(0.5 0 0 / 0.045) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
    >
      <div className="container mx-auto px-6 pt-28 pb-0 relative z-10">

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground"
        >
          Precision nutrition · For clinicians and individuals
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-headline text-7xl sm:text-8xl lg:text-[120px] font-extrabold text-foreground leading-[0.88] tracking-tight mb-10 max-w-5xl"
        >
          The Living Archive of{' '}
          <span className="text-primary italic">Your Health.</span>
        </motion.h1>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex flex-wrap items-center gap-6 mb-8"
        >
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base px-8 h-12 rounded-xl shadow-lg"
            asChild
          >
            <Link href="/signup">Start Free Trial</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Free forever · No credit card required · 14-day Pro trial
          </p>
        </motion.div>

        {/* Full-width dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative overflow-hidden rounded-t-2xl border border-b-0 border-border/30 shadow-2xl -mx-6"
          style={{ maxHeight: 440 }}
        >
          {/* Bottom fade */}
          <div
            className="absolute bottom-0 inset-x-0 h-28 bg-linear-to-t from-background to-transparent z-10 pointer-events-none"
            aria-hidden
          />

          {/* Nav bar */}
          <div className="flex items-center h-14 px-6 border-b border-border/20 bg-background">
            <span className="font-headline font-semibold text-primary italic text-lg mr-8">Vitalis</span>
            <div className="hidden md:flex items-center h-full">
              {NAV_ITEMS.map(({ name, active }) => (
                <span
                  key={name}
                  className={`relative h-full flex items-center px-4 text-sm font-medium ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {name}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" aria-hidden />
                  )}
                </span>
              ))}
            </div>
            <div className="ml-auto">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-xs font-bold text-primary">JD</span>
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="bg-muted/30 px-6 py-5">
            {/* Page header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-headline font-bold text-2xl text-foreground">Today</h2>
              <div className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center">
                Log Food
              </div>
            </div>

            {/* Card grid */}
            <div className="grid grid-cols-12 gap-4">

              {/* Calories — 8/12 */}
              <div className="col-span-12 md:col-span-8 bg-card rounded-xl p-5 border border-border/10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Calories</h3>
                <div className="flex items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="text-6xl font-headline font-black tabular-nums text-primary leading-none"
                      >
                        1,560
                      </motion.span>
                      <span className="text-base text-muted-foreground font-semibold">/ 2,000 kcal</span>
                    </div>
                    <div className="flex gap-8 mt-4 pt-4 border-t border-border/50">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Burned</span>
                        <span className="text-xl font-headline font-black tabular-nums">
                          340<span className="text-sm font-semibold text-muted-foreground ml-0.5">kcal</span>
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Net Balance</span>
                        <span className="text-xl font-headline font-black tabular-nums">
                          +1,220<span className="text-sm font-semibold text-muted-foreground ml-0.5">kcal</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Circular progress */}
                  <div className="relative w-24 h-24 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
                      <circle cx="50" cy="50" r="42" stroke="var(--secondary)" strokeWidth="8" fill="none" />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="var(--primary)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: '0 264' }}
                        animate={{ strokeDasharray: '206 264' }}
                        transition={{ duration: 1.5, delay: 1 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-black font-headline">440</span>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">left</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hydration — 4/12 */}
              <div className="col-span-12 md:col-span-4 bg-background rounded-xl p-5 border border-border/10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Water</h3>
                <div className="flex items-baseline gap-1.5 mb-4">
                  <span className="text-4xl font-headline font-black tabular-nums text-primary leading-none">1,200</span>
                  <span className="text-sm font-bold text-muted-foreground">ml</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={60}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Water intake"
                  className="h-2.5 w-full rounded-full bg-secondary overflow-hidden"
                >
                  <div className="h-full bg-primary rounded-full" style={{ width: '60%' }} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2 text-right">
                  Goal: 2,000 ml
                </p>
              </div>

              {/* Macros — 5/12 */}
              <div className="col-span-12 md:col-span-5 bg-background rounded-xl p-5 border border-border/10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Macronutrients</h3>
                <div className="flex flex-col gap-4">
                  {MACROS.map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-foreground">{m.label}</span>
                        <span className="text-muted-foreground tabular-nums">{m.val} / {m.goal}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
