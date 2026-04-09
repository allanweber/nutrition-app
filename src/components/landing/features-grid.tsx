'use client';

import { motion } from 'framer-motion';
import { BarChart3, Lightbulb, Search, Smartphone, Target } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08 },
  }),
};

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Everything you need to succeed
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From smart food search to professional clinical analytics — built for precision.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">

          {/* Large Card 1 — Smart Food Search */}
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="md:col-span-3 bg-background p-8 rounded-[2rem] border border-border/10 shadow-sm overflow-hidden group"
          >
            <div className="flex flex-col h-full justify-between gap-10">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary">
                  <Search className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-headline text-2xl font-bold text-foreground">Smart Food Search</h3>
                <p className="text-muted-foreground leading-relaxed">
                  500,000+ verified foods from the FatSecret database. Search in natural language and log meals in seconds.
                </p>
              </div>
              <div className="relative h-36 bg-muted rounded-xl p-4 transform translate-y-2 transition-transform group-hover:translate-y-0">
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg shadow-sm mb-3">
                  <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center text-primary font-bold text-sm">🥗</div>
                  <div className="flex-1">
                    <div className="h-2 w-24 bg-secondary rounded-full mb-2" />
                    <div className="h-2 w-16 bg-border rounded-full" />
                  </div>
                  <span className="text-primary text-lg font-bold">✓</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Large Card 2 — Visual Progress */}
          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="md:col-span-3 bg-background p-8 rounded-[2rem] border border-border/10 shadow-sm overflow-hidden group"
          >
            <div className="flex flex-col h-full justify-between gap-10">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground">
                  <BarChart3 className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-headline text-2xl font-bold text-foreground">Visual Progress</h3>
                <p className="text-muted-foreground leading-relaxed">
                  See trends over months and years. Data is more than numbers — it&apos;s your story.
                </p>
              </div>
              <div className="relative h-36 bg-muted rounded-xl p-4 flex items-end gap-2 transform translate-y-2 transition-transform group-hover:translate-y-0">
                <div className="flex-1 bg-primary h-10 rounded-t-sm" />
                <div className="flex-1 bg-primary/70 h-14 rounded-t-sm" />
                <div className="flex-1 bg-primary/50 h-20 rounded-t-sm" />
                <div className="flex-1 bg-primary/30 h-16 rounded-t-sm" />
                <div className="flex-1 bg-primary/15 h-24 rounded-t-sm" />
              </div>
            </div>
          </motion.div>

          {/* Small Card — Goal Tracking */}
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="md:col-span-2 bg-muted p-6 rounded-3xl space-y-3"
          >
            <Target className="h-6 w-6 text-primary" aria-hidden="true" />
            <h4 className="font-headline font-bold text-foreground">Goal Tracking</h4>
            <p className="text-sm text-muted-foreground">Set custom macro ratios and weight milestones.</p>
          </motion.div>

          {/* Small Card — Log Anywhere */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="md:col-span-2 bg-muted p-6 rounded-3xl space-y-3"
          >
            <Smartphone className="h-6 w-6 text-secondary-foreground" aria-hidden="true" />
            <h4 className="font-headline font-bold text-foreground">Log Anywhere</h4>
            <p className="text-sm text-muted-foreground">Quick-log on any device. Your data syncs instantly.</p>
          </motion.div>

          {/* Small Card — Smart Insights */}
          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="md:col-span-2 bg-muted p-6 rounded-3xl space-y-3"
          >
            <Lightbulb className="h-6 w-6 text-amber-500" aria-hidden="true" />
            <h4 className="font-headline font-bold text-foreground">Smart Insights</h4>
            <p className="text-sm text-muted-foreground">AI-generated reports on your eating habits.</p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
