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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'foodlog', label: 'Food Log', icon: UtensilsCrossed },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AppPreview() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <section id="demo" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            See It In Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
            <div className="bg-muted rounded-b-xl border border-t-0 border-border overflow-hidden">
             {/* Tab Navigation */}
             <div className="bg-card border-b border-border px-4">
              <div className="flex space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                     className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                       activeTab === tab.id
                         ? 'text-emerald-600'
                         : 'text-muted-foreground hover:text-foreground'
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
      <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
         <div className="flex items-center justify-between mb-4">
           <h3 className="font-semibold text-foreground">Calories</h3>
           <Flame className="h-5 w-5 text-orange-500" />
         </div>
         <div className="flex items-end space-x-2">
           <span className="text-3xl font-bold text-foreground">1,560</span>
           <span className="text-muted-foreground mb-1">/ 2,000</span>
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
       <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
         <div className="flex items-center justify-between mb-4">
           <h3 className="font-semibold text-foreground">Protein</h3>
           <Beef className="h-5 w-5 text-red-500" />
         </div>
         <div className="flex items-end space-x-2">
           <span className="text-3xl font-bold text-foreground">85g</span>
           <span className="text-muted-foreground mb-1">/ 120g</span>
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
       <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
         <div className="flex items-center justify-between mb-4">
           <h3 className="font-semibold text-foreground">Carbs</h3>
           <Wheat className="h-5 w-5 text-amber-500" />
         </div>
         <div className="flex items-end space-x-2">
           <span className="text-3xl font-bold text-foreground">180g</span>
           <span className="text-muted-foreground mb-1">/ 250g</span>
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
           <Calendar className="h-5 w-5 text-muted-foreground" />
           <span className="font-semibold text-foreground">Today, January 20</span>
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
             className="bg-card rounded-lg p-4 shadow-sm border border-border"
           >
             <div className="flex items-center justify-between mb-2">
               <div className="flex items-center space-x-3">
                 <span className="text-sm text-muted-foreground">{meal.time}</span>
                 <span className="font-medium text-foreground">{meal.meal}</span>
               </div>
               <span className="text-sm font-medium text-muted-foreground">{meal.calories} cal</span>
             </div>
             <div className="text-sm text-muted-foreground">
               {meal.foods.join(' - ')}
             </div>
           </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function AnalyticsPreview() {
  const chartData = [
    { day: 'Mon', calories: 1850, protein: 95, carbs: 220 },
    { day: 'Tue', calories: 2100, protein: 110, carbs: 245 },
    { day: 'Wed', calories: 1780, protein: 88, carbs: 195 },
    { day: 'Thu', calories: 1950, protein: 102, carbs: 230 },
    { day: 'Fri', calories: 2050, protein: 115, carbs: 240 },
    { day: 'Sat', calories: 1650, protein: 78, carbs: 180 },
    { day: 'Sun', calories: 1920, protein: 98, carbs: 215 },
  ];

  const weeklyStats = [
    { label: 'Avg Calories', value: '1,900', change: '+3%', positive: true },
    { label: 'Protein Goal', value: '92%', change: '+8%', positive: true },
    { label: 'Streak', value: '7 days', change: '', positive: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {weeklyStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-card rounded-lg p-4 border border-border"
          >
            <div className="text-sm text-muted-foreground">{stat.label}</div>
            <div className="flex items-end space-x-2 mt-1">
              <span className="text-xl font-bold text-foreground">{stat.value}</span>
              {stat.change && (
                <span className={`text-xs ${stat.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stat.change}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <span className="font-semibold text-foreground">Calorie Intake</span>
          </div>
          <span className="text-sm text-muted-foreground">This week</span>
        </div>

        {/* Area Chart */}
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                domain={[1400, 2400]}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value} cal`, 'Calories']}
              />
              <Area
                type="monotone"
                dataKey="calories"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#calorieGradient)"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#10b981' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Daily Calories</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 border-t-2 border-dashed border-gray-400" />
            <span className="text-muted-foreground">Goal: 2,000</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
