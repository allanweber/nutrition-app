'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  Lightbulb,
  Search,
  Smartphone,
  Target,
  Users,
} from 'lucide-react';

const primaryFeatures = [
  {
    icon: Search,
    title: 'Smart Food Search',
    description:
      'Search 500,000+ foods from the FatSecret database. Use natural language like "2 eggs and toast" and log meals in seconds.',
    textColor: 'text-primary',
  },
  {
    icon: BarChart3,
    title: 'Visual Progress',
    description:
      'Beautiful charts and progress rings show your daily and weekly trends at a glance. Understand your patterns, not just your numbers.',
    textColor: 'text-violet-500',
  },
];

const supportingFeatures = [
  {
    icon: Target,
    title: 'Goal Tracking',
    description: 'Set calorie, macro, and nutrient goals. Track streaks and celebrate milestones.',
    textColor: 'text-rose-500',
  },
  {
    icon: Smartphone,
    title: 'Log Anywhere',
    description: 'Quick-add meals on any device. Your data syncs instantly across all platforms.',
    textColor: 'text-amber-500',
  },
  {
    icon: Lightbulb,
    title: 'Smart Insights',
    description: 'Get personalized recommendations based on your eating patterns and goals.',
    textColor: 'text-sky-500',
  },
  {
    icon: Users,
    title: 'Pro Tools',
    description: 'Dietitian dashboard for managing clients, creating meal plans, and tracking progress.',
    textColor: 'text-primary',
  },
];

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
    <section id="features" className="py-20 md:py-28 bg-muted">
      <div className="container mx-auto px-4">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Everything you need to{' '}
            <span className="text-primary">succeed</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            Powerful features designed to make nutrition tracking simple,
            insightful, and effective.
          </p>
        </motion.div>

        {/* Primary features — 2 wide cards, icon inline with title */}
        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {primaryFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="bg-card rounded-2xl p-8 border border-border hover:border-primary/20 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <feature.icon className={`h-5 w-5 ${feature.textColor} flex-shrink-0`} aria-hidden="true" />
                <h3 className="text-xl font-semibold text-card-foreground">
                  {feature.title}
                </h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Supporting features — 4 items, no card wrappers */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16 }}
          viewport={{ once: true, margin: '-80px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 px-1"
        >
          {supportingFeatures.map((feature) => (
            <div key={feature.title} className="flex gap-3">
              <feature.icon
                className={`h-4 w-4 mt-0.5 ${feature.textColor} flex-shrink-0`}
                aria-hidden="true"
              />
              <div>
                <h3 className="text-sm font-semibold text-card-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
