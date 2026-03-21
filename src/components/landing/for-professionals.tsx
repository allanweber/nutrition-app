'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { BadgeCheck, Users } from 'lucide-react';
import Link from 'next/link';

const clients = [
  { name: 'Marcus Aurelius', avatar: 'MA', color: 'bg-blue-200', status: 'Over Calorie Limit', statusClass: 'bg-destructive/10 text-destructive' },
  { name: 'Elena Fisher', avatar: 'EF', color: 'bg-purple-200', status: 'Macro Perfect', statusClass: 'bg-primary-fixed text-on-primary-fixed' },
  { name: 'Arthur Morgan', avatar: 'AM', color: 'bg-orange-200', status: 'Logged 2h ago', statusClass: 'bg-muted text-muted-foreground' },
];

const features = [
  { icon: Users, title: 'Client Management', description: 'Dashboard to view all clients at a glance with status indicators.' },
  { icon: BadgeCheck, title: 'Professional Verification', description: 'Display verified credentials to build trust with potential clients.' },
];

export default function ForProfessionals() {
  return (
    <section id="for-professionals" className="py-24 px-6 bg-surface-container-low">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">

        {/* Left — Text Content */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex-1 space-y-8"
        >
          <div className="w-fit px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground font-bold text-xs uppercase tracking-widest">
            For Professionals
          </div>

          <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground">
            Powerful Tools for Nutrition Professionals
          </h2>

          <p className="text-on-surface-variant text-lg leading-relaxed max-w-lg">
            Manage hundreds of clients with clinical precision. HIPAA-compliant dashboards, real-time logging alerts, and direct messaging built for RDs and Health Coaches.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <feature.icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-bold block text-foreground">{feature.title}</span>
                  <span className="text-sm text-on-surface-variant">{feature.description}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-8"
              asChild
            >
              <Link href="/signup?type=professional">
                Apply for Professional Account
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-primary font-bold px-8 rounded-xl"
              asChild
            >
              <a href="#pricing">View Pro Pricing →</a>
            </Button>
          </div>
        </motion.div>

        {/* Right — Client Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex-1 w-full max-w-md"
        >
          <div className="bg-card rounded-3xl shadow-2xl p-6 border border-outline-variant/10">
            {/* Dashboard Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">RD</div>
                <div>
                  <h4 className="font-headline font-bold text-foreground">Sarah Jenkins, RD</h4>
                  <span className="text-xs px-2 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-full font-bold">8 Active Clients</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full">
                <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span className="text-xs font-semibold text-foreground">Verified RD</span>
              </div>
            </div>

            {/* Client Rows */}
            <div className="space-y-3">
              {clients.map((client) => (
                <motion.div
                  key={client.name}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  viewport={{ once: true }}
                  className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${client.color} flex items-center justify-center text-xs font-bold text-gray-700`}>
                      {client.avatar}
                    </div>
                    <span className="font-medium text-sm text-foreground">{client.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-md font-bold ${client.statusClass}`}>
                    {client.status}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 mt-4">
              <button className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors">
                + Add Client
              </button>
              <button className="flex-1 bg-surface-container-low border border-border text-foreground rounded-xl py-2.5 text-sm font-bold hover:bg-surface-container transition-colors">
                Create Plan
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
