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

const features = [
  {
    icon: Search,
    title: 'Smart Food Search',
    description:
      'Search foods across multiple nutrition data sources and find what you need fast.',
    color: 'bg-primary',
  },
  {
    icon: BarChart3,
    title: 'Visual Progress',
    description:
      'Beautiful charts and progress rings show your daily and weekly trends at a glance.',
    color: 'bg-primary',
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    description:
      'Set calorie, macro, and nutrient goals. Track streaks and celebrate achievements.',
    color: 'bg-primary',
  },
  {
    icon: Smartphone,
    title: 'Log Anywhere',
    description:
      'Quick-add meals on any device. Your data syncs instantly across all platforms.',
    color: 'bg-primary',
  },
  {
    icon: Lightbulb,
    title: 'Smart Insights',
    description:
      'Get personalized recommendations based on your eating patterns and goals.',
    color: 'bg-primary',
  },
  {
    icon: Users,
    title: 'Pro Tools',
    description:
      'Dietitian dashboard for managing clients, creating meal plans, and tracking progress.',
    color: 'bg-primary',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
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
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to <span className="text-primary">Succeed</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to make nutrition tracking simple,
            insightful, and effective.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
            >
              <div
                className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
