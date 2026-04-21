'use client';

import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
        answer: 'We use the FatSecret database, which contains over 500,000 foods including restaurant items, grocery products, and generic foods. It is updated continuously to ensure accuracy.',
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
        answer: 'Submit your professional credentials through our verification portal. We recognize RDs (Registered Dietitians), RDNs (Registered Dietitian Nutritionists), CNSs, and equivalent designations. Our team reviews applications within 2–3 business days. Once approved, you receive a verified badge on your profile.',
      },
      {
        question: 'Can my clients use the free tier?',
        answer: 'Yes! Your clients can use Vitalis for free. They\'ll have access to all basic features, and you can view their logs and progress from your professional dashboard.',
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
            Everything you need to know about Vitalis.
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
                <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                {category.category}
              </h3>

              <Accordion type="single" collapsible className="space-y-3">
                {category.questions.map((faq, faqIndex) => {
                  const itemId = `${categoryIndex}-${faqIndex}`;
                  return (
                    <AccordionItem
                      key={itemId}
                      value={itemId}
                      className="bg-card rounded-xl border border-border overflow-hidden px-6"
                    >
                      <AccordionTrigger className="hover:no-underline font-medium text-foreground text-sm">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
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
            <a href="/contact" className="text-primary font-medium hover:underline">
              Contact our support team
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
