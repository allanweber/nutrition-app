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
  Flame
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
    description: 'Search 1M+ foods, scan barcodes, or simply type "chicken salad for lunch".',
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
    <section id="for-individuals" className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
              For Individuals
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Your Personal{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                Nutrition Companion
              </span>
            </h2>
            
            <p className="text-lg text-gray-600 mb-8">
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
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700"
              asChild
            >
              <Link href="/signup">
                Start Tracking Free
                <ArrowRight className="ml-2 h-4 w-4" />
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
              <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-white rounded-[2.5rem] overflow-hidden">
                  {/* Phone Screen Content */}
                  <div className="p-6">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center mb-6 text-xs text-gray-500">
                      <span>9:41</span>
                      <div className="flex space-x-1">
                        <div className="w-4 h-2 bg-gray-300 rounded-sm" />
                        <div className="w-4 h-2 bg-gray-300 rounded-sm" />
                        <div className="w-6 h-3 bg-emerald-500 rounded-sm" />
                      </div>
                    </div>

                    {/* Header */}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900">Good morning, Sarah!</h3>
                      <p className="text-sm text-gray-500">Let&apos;s crush your goals today</p>
                    </div>

                    {/* Calorie Ring */}
                    <div className="flex justify-center mb-6">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="#e5e7eb"
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
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#14b8a6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <Flame className="h-5 w-5 text-orange-500 mb-1" />
                          <span className="text-2xl font-bold text-gray-900">1,560</span>
                          <span className="text-xs text-gray-500">/ 2,000 cal</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-red-600">85g</div>
                        <div className="text-xs text-gray-500">Protein</div>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-amber-600">180g</div>
                        <div className="text-xs text-gray-500">Carbs</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-blue-600">52g</div>
                        <div className="text-xs text-gray-500">Fat</div>
                      </div>
                    </div>

                    {/* Streak */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm opacity-90">Current Streak</div>
                          <div className="text-2xl font-bold">7 Days</div>
                        </div>
                        <div className="text-4xl">🔥</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Notification */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 1, duration: 0.4 }}
                viewport={{ once: true }}
                className="absolute -right-8 top-20 bg-white rounded-xl shadow-lg p-3 border border-gray-100"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-xs">
                    <div className="font-medium text-gray-900">Goal reached!</div>
                    <div className="text-gray-500">Protein target hit</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
