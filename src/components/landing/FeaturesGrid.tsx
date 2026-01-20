'use client';

import { motion } from 'framer-motion';
import { 
  Search, 
  BarChart3, 
  Target, 
  Smartphone, 
  Lightbulb, 
  Users 
} from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Smart Food Search',
    description: 'Search 1M+ foods from Nutritionix. Scan barcodes, use natural language like "2 eggs and toast".',
    color: 'bg-blue-500',
  },
  {
    icon: BarChart3,
    title: 'Visual Progress',
    description: 'Beautiful charts and progress rings show your daily and weekly trends at a glance.',
    color: 'bg-purple-500',
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    description: 'Set calorie, macro, and nutrient goals. Track streaks and celebrate achievements.',
    color: 'bg-emerald-500',
  },
  {
    icon: Smartphone,
    title: 'Log Anywhere',
    description: 'Quick-add meals on any device. Your data syncs instantly across all platforms.',
    color: 'bg-orange-500',
  },
  {
    icon: Lightbulb,
    title: 'Smart Insights',
    description: 'Get personalized recommendations based on your eating patterns and goals.',
    color: 'bg-yellow-500',
  },
  {
    icon: Users,
    title: 'Pro Tools',
    description: 'Dietitian dashboard for managing clients, creating meal plans, and tracking progress.',
    color: 'bg-pink-500',
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
    <section id="features" className="py-20 md:py-28 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              Succeed
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to make nutrition tracking simple, insightful, and effective.
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
              className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-100 transition-all duration-300 group"
            >
              <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
