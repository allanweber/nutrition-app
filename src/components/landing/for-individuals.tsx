'use client';

import { motion } from 'framer-motion';
import { Users, UtensilsCrossed } from 'lucide-react';
import { useLandingMotion } from '@/lib/landing-motion';

export default function ForIndividuals() {
  const { whileInView } = useLandingMotion();
  return (
    <section id="for-individuals" className="py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">

        <motion.div {...whileInView()} className="mb-16 max-w-3xl space-y-4">
          <h2 className="font-headline text-5xl md:text-6xl font-extrabold text-foreground leading-[0.95]">
            Personalized Vitality
          </h2>
          <p className="text-muted-foreground text-lg">
            Your health isn&apos;t a series of data points. It&apos;s an unfolding narrative supported by clinical-grade architecture.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Daily Archive — Wide Card */}
          <motion.div
            {...whileInView()}
            className="md:col-span-8 bg-secondary rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between group border border-border/10 min-h-70"
          >
            <div className="relative z-10">
              <h3 className="font-headline text-3xl font-bold mb-3 text-foreground">Daily Archive</h3>
              <p className="text-muted-foreground max-w-sm">
                A sophisticated dashboard that curates your metabolic markers into an intuitive journal of your body&apos;s performance.
              </p>
            </div>
            <div className="mt-8 relative z-10 flex gap-8 overflow-x-auto pb-2" aria-hidden="true">
              <div className="shrink-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Sleep</p>
                <p className="text-4xl font-black text-foreground font-headline leading-none">8h 12m</p>
              </div>
              <div className="w-px bg-border/40 self-stretch shrink-0" />
              <div className="shrink-0">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Calories</p>
                <p className="text-4xl font-black text-primary font-headline leading-none">1,560</p>
              </div>
              <div className="w-px bg-border/40 self-stretch shrink-0" />
              <div className="shrink-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Protein</p>
                <p className="text-4xl font-black text-foreground font-headline leading-none">85g</p>
              </div>
            </div>
          </motion.div>

          {/* Nutrition Architecture Card */}
          <motion.div
            {...whileInView(0.08)}
            className="md:col-span-4 bg-secondary rounded-[2rem] p-8 flex flex-col justify-between border border-border/10 min-h-70"
          >
            <div>
              <UtensilsCrossed className="h-8 w-8 text-primary mb-4" aria-hidden />
              <h3 className="font-headline text-2xl font-bold mb-3 text-foreground">Nutrition Architecture</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Design meal protocols that align with your metabolic needs and personal goals.
              </p>
            </div>
            <div className="mt-6 p-4 bg-background rounded-xl border border-border/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Today&apos;s Protocol</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">92% Match</span>
              </div>
              <p className="text-sm font-semibold text-foreground">Mediterranean · High Protein</p>
            </div>
          </motion.div>

          {/* Goal Tracking Card */}
          <motion.div
            {...whileInView(0.12)}
            className="md:col-span-4 bg-secondary rounded-[2rem] p-8 border border-border/10"
          >
            <h3 className="font-headline text-2xl font-bold mb-3 text-foreground">Goal Tracking</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Set weight, macro, and calorie targets. Streak tracking and milestone celebrations keep you going.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border/10">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground">Morning Mobility Flow</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border/10">
                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-xs font-semibold text-foreground">Calorie Goal — 87% complete</span>
              </div>
            </div>
          </motion.div>

          {/* Professional Network Preview */}
          <motion.div
            {...whileInView(0.16)}
            className="md:col-span-8 bg-secondary rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8 border border-border/10"
          >
            <div className="w-full md:w-1/2">
              <h3 className="font-headline text-3xl font-bold mb-3 text-foreground">Built for Precision</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Connect with your own practitioner or browse our vetted network of nutrition specialists who use the same platform.
              </p>
              <a href="#for-professionals" className="inline-flex items-center gap-2 text-primary font-bold hover:translate-x-1 transition-transform">
                View Professional Network <Users className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <div className="w-full md:w-1/2 grid grid-cols-2 gap-3">
              <div className="bg-background rounded-2xl p-4 border border-border/10">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-3">RD</div>
                <p className="text-xs font-bold text-foreground">Registered Dietitian</p>
                <p className="text-xs text-muted-foreground mt-1">Sarah Jenkins, MS</p>
              </div>
              <div className="bg-background rounded-2xl p-4 border border-border/10 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Protocols</p>
                  <p className="text-5xl font-headline font-black text-primary leading-none">42</p>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground font-medium">Certified Network</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
