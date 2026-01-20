'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  BarChart3, 
  Flame,
  Beef,
  Wheat,
  TrendingUp,
  Calendar
} from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'foodlog', label: 'Food Log', icon: UtensilsCrossed },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AppPreview() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <section id="demo" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            See It In Action
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A powerful yet simple interface designed to make nutrition tracking effortless.
          </p>
        </motion.div>

        {/* Browser Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-gray-900 rounded-t-xl p-3 flex items-center space-x-2">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-gray-700 rounded-md px-4 py-1.5 text-sm text-gray-300 max-w-md mx-auto">
                app.nutritiontracker.com
              </div>
            </div>
          </div>

          {/* App Content */}
          <div className="bg-gray-50 rounded-b-xl border border-t-0 border-gray-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200 px-4">
              <div className="flex space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? 'text-emerald-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && <DashboardPreview key="dashboard" />}
                {activeTab === 'foodlog' && <FoodLogPreview key="foodlog" />}
                {activeTab === 'analytics' && <AnalyticsPreview key="analytics" />}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="grid md:grid-cols-3 gap-4"
    >
      {/* Calories Card */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Calories</h3>
          <Flame className="h-5 w-5 text-orange-500" />
        </div>
        <div className="flex items-end space-x-2">
          <span className="text-3xl font-bold text-gray-900">1,560</span>
          <span className="text-gray-500 mb-1">/ 2,000</span>
        </div>
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '78%' }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
          />
        </div>
      </div>

      {/* Protein Card */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Protein</h3>
          <Beef className="h-5 w-5 text-red-500" />
        </div>
        <div className="flex items-end space-x-2">
          <span className="text-3xl font-bold text-gray-900">85g</span>
          <span className="text-gray-500 mb-1">/ 120g</span>
        </div>
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '71%' }}
            transition={{ duration: 1, delay: 0.6 }}
            className="h-full bg-red-500 rounded-full"
          />
        </div>
      </div>

      {/* Carbs Card */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Carbs</h3>
          <Wheat className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex items-end space-x-2">
          <span className="text-3xl font-bold text-gray-900">180g</span>
          <span className="text-gray-500 mb-1">/ 250g</span>
        </div>
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '72%' }}
            transition={{ duration: 1, delay: 0.7 }}
            className="h-full bg-amber-500 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}

function FoodLogPreview() {
  const meals = [
    { time: '8:30 AM', meal: 'Breakfast', foods: ['Oatmeal with berries', 'Greek yogurt'], calories: 420 },
    { time: '12:30 PM', meal: 'Lunch', foods: ['Grilled chicken salad', 'Whole grain bread'], calories: 580 },
    { time: '3:00 PM', meal: 'Snack', foods: ['Apple', 'Almonds'], calories: 180 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="font-semibold text-gray-900">Today, January 20</span>
        </div>
        <span className="text-emerald-600 font-medium">1,180 cal logged</span>
      </div>

      <div className="space-y-3">
        {meals.map((meal, index) => (
          <motion.div
            key={meal.meal}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">{meal.time}</span>
                <span className="font-medium text-gray-900">{meal.meal}</span>
              </div>
              <span className="text-sm font-medium text-gray-600">{meal.calories} cal</span>
            </div>
            <div className="text-sm text-gray-500">
              {meal.foods.join(' - ')}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function AnalyticsPreview() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = [85, 92, 78, 95, 88, 70, 82];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          <span className="font-semibold text-gray-900">Weekly Goal Progress</span>
        </div>
        <span className="text-sm text-gray-500">This week</span>
      </div>

      <div className="flex items-end justify-between h-48 px-4">
        {days.map((day, index) => (
          <div key={day} className="flex flex-col items-center space-y-2">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${values[index]}%` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`w-8 md:w-12 rounded-t-md ${
                values[index] >= 80 ? 'bg-emerald-500' : 'bg-emerald-200'
              }`}
            />
            <span className="text-xs text-gray-500">{day}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-gray-600">Goal met (80%+)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-emerald-200" />
          <span className="text-gray-600">Below goal</span>
        </div>
      </div>
    </motion.div>
  );
}
