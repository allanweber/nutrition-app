'use client';

import { motion } from 'framer-motion';
import { Flame, Target, Users } from 'lucide-react';

export default function ForIndividuals() {
  return (
    <section id="for-individuals" className="py-24 px-6 bg-surface-container-lowest">
      <div className="max-w-7xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16 max-w-3xl mx-auto space-y-4"
        >
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-foreground">
            Personalized Vitality
          </h2>
          <p className="text-on-surface-variant text-lg">
            Your health isn&apos;t a series of data points. It&apos;s an unfolding narrative supported by clinical-grade architecture.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Daily Archive — Wide Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="md:col-span-8 bg-surface-container rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between group border border-outline-variant/10 min-h-[280px]"
          >
            <div className="relative z-10">
              <Flame className="h-9 w-9 text-primary mb-4" aria-hidden="true" />
              <h3 className="font-headline text-3xl font-bold mb-3 text-foreground">Daily Archive</h3>
              <p className="text-on-surface-variant max-w-sm">
                A sophisticated dashboard that curates your metabolic markers into an intuitive journal of your body&apos;s performance.
              </p>
            </div>
            <div className="mt-8 relative z-10 flex gap-4 overflow-x-auto pb-2">
              <div className="min-w-[140px] p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10 flex-shrink-0">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Sleep</p>
                <p className="text-lg font-bold text-foreground font-headline">8h 12m</p>
              </div>
              <div className="min-w-[140px] p-4 bg-primary/10 border border-primary/20 rounded-xl flex-shrink-0">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Calories</p>
                <p className="text-lg font-bold text-primary font-headline">1,560 kcal</p>
              </div>
              <div className="min-w-[140px] p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10 flex-shrink-0">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Protein</p>
                <p className="text-lg font-bold text-foreground font-headline">85g</p>
              </div>
            </div>
          </motion.div>

          {/* Nutrition Architecture — Gradient Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            viewport={{ once: true }}
            className="md:col-span-4 bg-gradient-to-br from-primary to-primary/80 rounded-[2rem] p-8 text-primary-foreground flex flex-col justify-between shadow-lg min-h-[280px]"
          >
            <div>
              <div className="text-3xl mb-4">🥗</div>
              <h3 className="font-headline text-2xl font-bold mb-3">Nutrition Architecture</h3>
              <p className="opacity-90 text-sm leading-relaxed">
                Design meal protocols that align with your metabolic needs and personal goals.
              </p>
            </div>
            <div className="mt-6 p-4 bg-black/20 backdrop-blur-md rounded-xl border border-white/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wide">Today&apos;s Protocol</span>
                <span className="text-xs bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full font-bold">92% Match</span>
              </div>
              <p className="text-sm font-medium">Mediterranean · High Protein</p>
            </div>
          </motion.div>

          {/* Goal Tracking Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            viewport={{ once: true }}
            className="md:col-span-4 bg-surface-container rounded-[2rem] p-8 border border-outline-variant/10"
          >
            <Target className="h-9 w-9 text-amber-500 mb-4" aria-hidden="true" />
            <h3 className="font-headline text-2xl font-bold mb-3 text-foreground">Goal Tracking</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
              Set weight, macro, and calorie targets. Streak tracking and milestone celebrations keep you going.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <span className="text-xs font-semibold text-foreground">Morning Mobility Flow</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-foreground">Calorie Goal — 87% complete</span>
              </div>
            </div>
          </motion.div>

          {/* Professional Network Preview */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            viewport={{ once: true }}
            className="md:col-span-8 bg-surface-container-high rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8 border border-outline-variant/10"
          >
            <div className="w-full md:w-1/2">
              <h3 className="font-headline text-3xl font-bold mb-3 text-foreground">Built for Precision</h3>
              <p className="text-on-surface-variant leading-relaxed mb-6">
                Connect with your own practitioner or browse our vetted network of nutrition specialists who use the same platform.
              </p>
              <a href="#for-professionals" className="inline-flex items-center gap-2 text-primary font-bold hover:translate-x-1 transition-transform">
                View Professional Network <Users className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <div className="w-full md:w-1/2 grid grid-cols-2 gap-3">
              <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/10">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mb-3">RD</div>
                <p className="text-xs font-bold text-foreground">Registered Dietitian</p>
                <p className="text-xs text-on-surface-variant mt-1">Sarah Jenkins, MS</p>
              </div>
              <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/10 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Active Protocols</p>
                  <p className="text-2xl font-headline font-extrabold text-primary">42</p>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs text-on-surface-variant font-medium">Certified Network</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
