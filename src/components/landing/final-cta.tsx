'use client';

import { Button } from '@/components/ui/button';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';

export default function FinalCTA() {
  const prefersReducedMotion = useReducedMotion();

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

      {/* Decorative blobs — motion disabled for prefers-reduced-motion */}
      <motion.div
        animate={prefersReducedMotion ? undefined : { scale: [1, 1.2, 1], x: [0, 20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <motion.div
        animate={prefersReducedMotion ? undefined : { scale: [1, 1.1, 1], x: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto"
        >
          <h2 className="font-headline text-5xl md:text-7xl font-black text-primary-foreground mb-6 leading-[0.92]">
            Ready to Take Control of Your Nutrition?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-12">
            Join <span className="font-black text-primary-foreground">50,000+</span> others archiving their journey to better health.
          </p>

          {/* Dual CTA Cards */}
          <div className="flex flex-col md:flex-row justify-center gap-6 pt-2">
            {/* Individuals Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 p-8 rounded-3xl text-left border border-white/20 flex-1"
            >
              <h3 className="font-headline font-bold text-2xl text-primary-foreground mb-3">
                Individuals
              </h3>
              <p className="text-primary-foreground/70 text-sm mb-6">
                Start logging your meals for free today.
              </p>
              <Button
                size="lg"
                className="w-full bg-white text-primary hover:bg-white/90 font-black rounded-xl"
                asChild
              >
                <Link href="/signup">Start Free</Link>
              </Button>
            </motion.div>

            {/* Professionals Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white/10 p-8 rounded-3xl text-left border border-white/20 flex-1"
            >
              <h3 className="font-headline font-bold text-2xl text-primary-foreground mb-3">
                Professionals
              </h3>
              <p className="text-primary-foreground/70 text-sm mb-6">
                Transform your practice with data.
              </p>
              <Button
                size="lg"
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-black rounded-xl"
                asChild
              >
                <Link href="/signup?type=professional">Start 14-Day Trial</Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
