'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Users, Utensils, Star, Award } from 'lucide-react';

interface StatProps {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  delay: number;
}

const isDecimal = (n: number) => n % 1 !== 0;

function formatCount(n: number, target: number): string {
  if (isDecimal(target)) {
    return n.toFixed(1);
  }
  return Math.floor(n).toLocaleString();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AnimatedStat({ icon: _icon, value, suffix, label, delay }: StatProps) {
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = useState(prefersReducedMotion ? value : 0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (prefersReducedMotion || !isInView) return;

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
        setCount(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value, prefersReducedMotion]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="flex flex-col items-center text-center"
    >
      <div className="text-4xl md:text-5xl font-headline font-black text-primary mb-2" aria-label={`${value}${suffix} ${label}`}>
        {formatCount(count, value)}{suffix}
      </div>
      <div className="text-sm font-bold text-on-surface-variant uppercase tracking-widest" aria-hidden="true">{label}</div>
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
    <section className="bg-surface-container-low py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <AnimatedStat key={index} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
