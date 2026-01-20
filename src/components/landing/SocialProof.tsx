'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, Utensils, Star, Award } from 'lucide-react';

interface StatProps {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  delay: number;
}

function AnimatedStat({ icon: Icon, value, suffix, label, delay }: StatProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const stepValue = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="flex flex-col items-center"
    >
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
        <Icon className="h-6 w-6 text-primary" />
      </div>
        <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
          {count.toLocaleString()}{suffix}
        </div>
        <div className="text-muted-foreground text-sm">{label}</div>
    </motion.div>
  );
}

export default function SocialProof() {
  const stats = [
    { icon: Utensils, value: 500, suffix: 'K+', label: 'Meals Logged', delay: 0 },
    { icon: Users, value: 50, suffix: 'K+', label: 'Active Users', delay: 0.1 },
    { icon: Award, value: 2, suffix: 'K+', label: 'Professionals', delay: 0.2 },
    { icon: Star, value: 4.9, suffix: '', label: 'App Rating', delay: 0.3 },
  ];

  return (
    <section className="bg-muted py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <AnimatedStat key={index} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
