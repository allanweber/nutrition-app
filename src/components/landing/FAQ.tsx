'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        question: 'Is my data secure and private?',
        answer: 'Absolutely. We use bank-level encryption (AES-256) to protect your data. We never sell your personal information to third parties. You can export or delete your data at any time.',
      },
      {
        question: 'What food database do you use?',
        answer: 'We use the Nutritionix database, which contains over 1 million foods including restaurant items, grocery products, and generic foods. The database is updated regularly to ensure accuracy.',
      },
      {
        question: 'Is there a mobile app?',
        answer: 'Our web app is fully responsive and works great on all devices. A dedicated iOS and Android app is on our roadmap for later this year.',
      },
    ],
  },
  {
    category: 'For Individuals',
    questions: [
      {
        question: 'Can I import data from MyFitnessPal or other apps?',
        answer: 'Yes! We support importing your food log history from MyFitnessPal, Lose It!, and several other popular tracking apps. Go to Settings > Import Data to get started.',
      },
      {
        question: "What's the difference between Free and Complete?",
        answer: 'Free gives you unlimited food logging with 7-day history and basic features. Complete unlocks unlimited history, advanced analytics, meal planning, data export, and priority support for $7.99/month.',
      },
    ],
  },
  {
    category: 'For Professionals',
    questions: [
      {
        question: 'How does professional verification work?',
        answer: 'Submit your credentials (RD, RDN, CNS, etc.) through our verification portal. Our team reviews applications within 2-3 business days. Once approved, you\'ll receive a verified badge on your profile.',
      },
      {
        question: 'Can my clients use the free tier?',
        answer: 'Yes! Your clients can use NutritionTracker for free. They\'ll have access to all basic features, and you can view their logs and progress from your professional dashboard.',
      },
      {
        question: "What's included in Enterprise?",
        answer: 'Enterprise includes unlimited clients, team collaboration, white-label options, API access, custom integrations, HIPAA compliance documentation, a dedicated account manager, and priority onboarding.',
      },
      {
        question: 'Is the platform HIPAA compliant?',
        answer: 'Our Enterprise plan includes HIPAA compliance documentation and can sign a Business Associate Agreement (BAA). Contact our sales team for more information about healthcare compliance.',
      },
    ],
  },
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="py-20 md:py-28 bg-muted">
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
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about NutritionTracker.
          </p>
        </motion.div>

        {/* FAQ Categories */}
        <div className="max-w-3xl mx-auto space-y-8">
          {faqs.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3" />
                {category.category}
              </h3>
              
              <div className="space-y-3">
                {category.questions.map((faq, faqIndex) => {
                  const itemId = `${categoryIndex}-${faqIndex}`;
                  const isOpen = openItems.includes(itemId);

                  return (
                    <div
                      key={itemId}
                      className="bg-card rounded-xl border border-border overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted transition-colors"
                      >
                        <span className="font-medium text-foreground pr-4">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-6 pb-4 text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground">
            Still have questions?{' '}
            <a href="/contact" className="text-emerald-600 font-medium hover:underline">
              Contact our support team
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
