'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, X, Sparkles } from 'lucide-react';

type PlanType = 'individual' | 'professional';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  description: string;
  price: string;
  period: string;
  features: PlanFeature[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
  badge?: string;
}

const individualPlans: Plan[] = [
  {
    name: 'Free',
    description: 'Get started with the basics',
    price: '$0',
    period: 'forever',
    features: [
      { text: 'Unlimited food logging', included: true },
      { text: 'Basic dashboard', included: true },
      { text: '7-day history', included: true },
      { text: '3 nutrition goals', included: true },
      { text: 'Basic charts', included: true },
      { text: 'Community support', included: true },
      { text: 'Advanced analytics', included: false },
      { text: 'Unlimited history', included: false },
      { text: 'Meal planning', included: false },
      { text: 'Data export', included: false },
    ],
    cta: 'Get Started Free',
    ctaLink: '/signup',
  },
  {
    name: 'Complete',
    description: 'Everything for serious trackers',
    price: '$7.99',
    period: 'per month',
    popular: true,
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Unlimited history', included: true },
      { text: 'Unlimited goals', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Detailed insights', included: true },
      { text: 'Meal planning', included: true },
      { text: 'Data export (CSV, PDF)', included: true },
      { text: 'Weekly email reports', included: true },
      { text: 'Priority support', included: true },
      { text: 'No ads', included: true },
    ],
    cta: 'Upgrade to Complete',
    ctaLink: '/signup?plan=complete',
  },
];

const professionalPlans: Plan[] = [
  {
    name: 'Pro',
    description: 'For individual practitioners',
    price: '$19.99',
    period: 'per month',
    features: [
      { text: 'Up to 10 clients', included: true },
      { text: 'Client dashboard', included: true },
      { text: 'Meal plan creation', included: true },
      { text: 'Client progress tracking', included: true },
      { text: 'Professional verification badge', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Email support', included: true },
      { text: 'Unlimited clients', included: false },
      { text: 'White-label options', included: false },
      { text: 'API access', included: false },
    ],
    cta: 'Start 14-Day Trial',
    ctaLink: '/signup?type=professional&plan=pro',
  },
  {
    name: 'Enterprise',
    description: 'For clinics and large practices',
    price: 'Custom',
    period: 'contact sales',
    badge: 'Contact Us',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited clients', included: true },
      { text: 'Team collaboration', included: true },
      { text: 'White-label options', included: true },
      { text: 'API access', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Advanced reporting', included: true },
      { text: 'HIPAA compliance docs', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Priority onboarding', included: true },
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact?type=enterprise',
  },
];

export default function Pricing() {
  const [planType, setPlanType] = useState<PlanType>('individual');
  
  const plans = planType === 'individual' ? individualPlans : professionalPlans;

  return (
    <section id="pricing" className="py-20 md:py-28 bg-background">
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
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that&apos;s right for you. All plans include a free trial.
          </p>

          {/* Plan Type Switcher */}
          <div className="inline-flex items-center bg-muted rounded-full p-1">
            <button
              onClick={() => setPlanType('individual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                planType === 'individual'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              For Individuals
            </button>
            <button
              onClick={() => setPlanType('professional')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                planType === 'professional'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              For Professionals
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          key={planType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-primary-foreground shadow-xl shadow-emerald-200'
                  : 'bg-card border border-border'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="inline-flex items-center px-4 py-1 bg-amber-400 text-amber-900 rounded-full text-sm font-medium shadow-lg">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Enterprise Badge */}
              {plan.badge && !plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="inline-flex items-center px-4 py-1 bg-slate-800 text-white rounded-full text-sm font-medium shadow-lg">
                    {plan.badge}
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.popular ? 'text-emerald-100' : 'text-muted-foreground'}`}>
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <span className={`text-4xl font-bold ${plan.popular ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {plan.price}
                </span>
                <span className={`text-sm ${plan.popular ? 'text-emerald-100' : 'text-muted-foreground'}`}>
                  {' '}/{plan.period}
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-3">
                    {feature.included ? (
                      <Check className={`h-5 w-5 flex-shrink-0 ${plan.popular ? 'text-emerald-200' : 'text-emerald-500'}`} />
                     ) : (
                       <X className={`h-5 w-5 flex-shrink-0 ${plan.popular ? 'text-emerald-300/50' : 'text-muted-foreground/50'}`} />
                     )}
                     <span className={`text-sm ${
                       feature.included 
                         ? plan.popular ? 'text-primary-foreground' : 'text-foreground'
                         : plan.popular ? 'text-emerald-200/50' : 'text-muted-foreground'
                    }`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                size="lg"
                className={`w-full ${
                  plan.popular
                    ? 'bg-white text-emerald-600 hover:bg-gray-100'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
                asChild
              >
                <Link href={plan.ctaLink}>
                  {plan.cta}
                </Link>
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12 text-muted-foreground text-sm"
        >
          <p>All plans include a 14-day free trial. No credit card required to start.</p>
          <p className="mt-2">
            Questions? <a href="/contact" className="text-primary hover:underline">Contact our sales team</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
