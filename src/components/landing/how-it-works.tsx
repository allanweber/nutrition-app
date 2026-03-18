'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const individualSteps = [
  {
    title: 'Create Account',
    description:
      'Sign up in 30 seconds with your email or Google account. No credit card required.',
  },
  {
    title: 'Set Your Goals',
    description:
      "Choose weight loss, maintenance, or muscle gain. We'll calculate your ideal targets.",
  },
  {
    title: 'Track Daily',
    description:
      'Log meals with our smart search. Scan barcodes or use natural language input.',
  },
  {
    title: 'See Results',
    description:
      'Watch your progress with beautiful charts. Celebrate milestones and streaks.',
  },
];

const professionalSteps = [
  {
    title: 'Get Verified',
    description:
      'Submit your professional credentials for verification. We recognize RDs, RDNs, CNSs, and equivalent designations.',
  },
  {
    title: 'Add Clients',
    description:
      'Invite clients via email or share your unique link. They can use free tier.',
  },
  {
    title: 'Create Plans',
    description:
      'Design personalized meal plans with our intuitive builder and food database.',
  },
  {
    title: 'Monitor Progress',
    description:
      'Track client adherence in real-time. Adjust plans based on their data.',
  },
];

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState<'individual' | 'professional'>(
    'individual',
  );

  const steps =
    activeTab === 'individual' ? individualSteps : professionalSteps;

  return (
    <section className="py-20 md:py-28 bg-background">
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
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Get started in minutes, not hours. Our streamlined process makes
            nutrition tracking effortless.
          </p>

          {/* Tab Switcher */}
          <div className="inline-flex items-center bg-muted rounded-full p-1">
            <button
              onClick={() => setActiveTab('individual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'individual'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              For Individuals
            </button>
            <button
              onClick={() => setActiveTab('professional')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'professional'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              For Professionals
            </button>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid md:grid-cols-4 gap-8 md:gap-6"
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                {/* Typographic step number */}
                <div className="mb-3" aria-hidden="true">
                  <span className="text-5xl font-bold tabular-nums leading-none text-primary/40 select-none">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
