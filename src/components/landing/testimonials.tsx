'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Lost 25 lbs in 4 months',
    type: 'individual',
    image: null,
    content: "I've tried every calorie counter out there. NutritionTracker finally made it stick - the visual progress kept me motivated and I hit my goal weight faster than I expected!",
    rating: 5,
  },
  {
    name: 'Dr. Amanda Chen, RD',
    role: 'Registered Dietitian',
    type: 'professional',
    image: null,
    content: "Managing 30+ clients used to be a nightmare of spreadsheets. Now I can see everyone's progress in one dashboard and my clients actually love using the app.",
    rating: 5,
  },
  {
    name: 'Mike Thompson',
    role: 'Fitness Enthusiast',
    type: 'individual',
    image: null,
    content: "The barcode scanner is a game-changer. What used to take me 5 minutes now takes 5 seconds. I've been able to stay consistent with my macros for the first time ever.",
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'Sports Nutritionist',
    type: 'professional',
    image: null,
    content: "The meal plan feature saves me hours each week. I create a template once and customize it for each athlete in minutes. My clients see real results.",
    rating: 5,
  },
  {
    name: 'Emily Roberts',
    role: 'New Mom',
    type: 'individual',
    image: null,
    content: "As a busy mom, I needed something quick and easy. The natural language input is amazing - I just type 'yogurt and granola' and it logs everything perfectly.",
    rating: 5,
  },
  {
    name: 'Dr. James Kim, RDN',
    role: 'Clinical Nutritionist',
    type: 'professional',
    image: null,
    content: "The professional verification badge has helped me stand out. Clients trust the platform, which makes onboarding and compliance so much easier.",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 md:py-28 bg-muted overflow-hidden">
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
            Loved by Thousands
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what individuals and professionals are saying about NutritionTracker.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
            >
              {/* Quote Icon */}
              <Quote className="h-8 w-8 text-emerald-200 mb-4" />

              {/* Content */}
              <p className="text-foreground mb-6 leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground font-medium ${
                  testimonial.type === 'professional' 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                }`}>
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    {testimonial.role}
                    {testimonial.type === 'professional' && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Pro
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
