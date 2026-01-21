'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, User, Users } from 'lucide-react';
import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="py-20 md:py-28 bg-primary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Animated Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          x: [0, -20, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl"
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Take Control of Your Nutrition?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join thousands of individuals and professionals who&apos;ve
            transformed their health with NutritionTracker.
          </p>

          {/* Dual CTA Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Individuals Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-primary/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <User className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-primary-foreground mb-2">
                For Individuals
              </h3>
              <p className="text-white/80 text-sm mb-6">
                Start tracking your nutrition today. Free forever, upgrade
                anytime.
              </p>
              <Button
                size="lg"
                className="w-full bg-background text-brand-primary hover:bg-muted"
                asChild
              >
                <Link href="/signup">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            {/* Professionals Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-primary/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20"
            >
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-primary-foreground mb-2">
                For Professionals
              </h3>
              <p className="text-white/80 text-sm mb-6">
                Manage clients and grow your practice with powerful tools.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="w-full hover:bg-primary/90"
                asChild
              >
                <Link href="/signup?type=professional">
                  Start 14-Day Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Trust Text */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-8 text-white/70 text-sm"
          >
            No credit card required. Cancel anytime.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
