'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

type BillingCycle = 'monthly' | 'yearly';

interface Plan {
  name: string;
  price: { monthly: string; yearly: string };
  period: string;
  features: string[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Essential',
    price: { monthly: '$0', yearly: '$0' },
    period: '/forever',
    features: [
      'Basic Macro Tracking',
      'Standard Food Library',
      'Daily Progress View',
      '7-day History',
      'Community Support',
    ],
    cta: 'Get Started',
    ctaLink: '/signup',
  },
  {
    name: 'Vitality Pro',
    price: { monthly: '$7.99', yearly: '$6.39' },
    period: '/mo',
    popular: true,
    features: [
      'Everything in Essential',
      'AI Photo Logging',
      'Advanced Micronutrients',
      'Custom Goal Cycles',
      'Export to PDF/CSV',
      'Unlimited History',
      'Priority Support',
      'No Ads',
    ],
    cta: 'Start 14-Day Free Trial',
    ctaLink: '/signup?plan=pro',
  },
  {
    name: 'Clinician',
    price: { monthly: '$19.99', yearly: '$15.99' },
    period: '/mo',
    features: [
      'Everything in Vitality Pro',
      'Client Dashboard',
      'Real-time Monitoring',
      'Custom Meal Plans',
      'Direct Message Suite',
      'Custom Branding',
      'HIPAA Compliance Docs',
      'Practice Analytics',
    ],
    cta: 'Join Professional Network',
    ctaLink: '/signup?type=professional',
  },
];

export default function Pricing() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');

  return (
    <section id="pricing" className="py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-12 space-y-6"
        >
          <h2 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[0.95]">
            Investment in Vitality
          </h2>

          {/* Billing Toggle */}
          <div role="tablist" aria-label="Billing cycle" className="inline-flex p-1 bg-secondary rounded-xl">
            <button
              type="button"
              role="tab"
              aria-selected={billing === 'monthly'}
              onClick={() => setBilling('monthly')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                billing === 'monthly'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={billing === 'yearly'}
              onClick={() => setBilling('yearly')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                billing === 'yearly'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly <span className="text-primary">(Save 20%)</span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative flex flex-col p-8 rounded-[2rem] border ${
                plan.popular
                  ? 'bg-background border-4 border-primary shadow-xl z-10'
                  : 'bg-background border border-border/10 shadow-sm'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                  Most Popular
                </div>
              )}

              <h3 className="font-headline font-bold text-xl mb-2 text-foreground">{plan.name}</h3>

              <div className="flex items-baseline gap-2 mb-10">
                <span className={`font-headline text-7xl font-black leading-none ${plan.popular ? 'text-primary' : 'text-foreground'}`}>
                  {plan.price[billing]}
                </span>
                <span className="text-muted-foreground text-base">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                variant={plan.popular ? 'default' : 'outline'}
                className={`w-full rounded-xl font-bold ${
                  plan.popular
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg'
                    : 'border-2 border-primary text-primary hover:bg-secondary'
                }`}
                asChild
              >
                <Link href={plan.ctaLink}>{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12 text-sm text-muted-foreground"
        >
          All plans include a 14-day free trial. No credit card required to start.{' '}
          <a href="/contact" className="text-primary hover:underline">Questions? Contact us.</a>
        </motion.p>

      </div>
    </section>
  );
}
