'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  ClipboardList,
  LineChart,
  MessageSquare,
  Users,
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Users,
    title: 'Client Management',
    description:
      'Dashboard to view all your clients at a glance with status indicators.',
  },
  {
    icon: ClipboardList,
    title: 'Custom Meal Plans',
    description:
      'Create and assign personalized diet plans to individual clients.',
  },
  {
    icon: LineChart,
    title: 'Track Client Progress',
    description:
      'Monitor adherence, goals, and nutrition data remotely in real-time.',
  },
  {
    icon: BadgeCheck,
    title: 'Professional Verification',
    description:
      'Display verified credentials to build trust with potential clients.',
  },
  {
    icon: MessageSquare,
    title: 'Client Communication',
    description: 'Notes, feedback, and communication tools built right in.',
  },
  {
    icon: BarChart3,
    title: 'Practice Analytics',
    description:
      'Insights on client outcomes, engagement, and your practice growth.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Get Verified',
    description: 'Submit your credentials for a professional badge',
  },
  {
    number: '02',
    title: 'Add Clients',
    description: 'Invite clients via email or shareable link',
  },
  {
    number: '03',
    title: 'Create Plans',
    description: 'Design personalized nutrition plans',
  },
  {
    number: '04',
    title: 'Monitor Progress',
    description: 'Track adherence and adjust as needed',
  },
];

export default function ForProfessionals() {
  return (
    <section
      id="for-professionals"
      className="py-20 md:py-28 bg-background overflow-hidden"
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            {/* Dashboard Card */}
            <div className="bg-card rounded-2xl shadow-2xl overflow-hidden">
              {/* Dashboard Header */}
              <div className="bg-primary p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-primary-foreground font-bold text-lg">
                      Client Dashboard
                    </h3>
                    <p className="text-accent text-sm">8 active clients</p>
                  </div>
                   <div className="flex items-center space-x-2 bg-primary-foreground/20 rounded-full px-3 py-1">
                    <BadgeCheck className="h-4 w-4 text-primary-foreground" />
                    <span className="text-primary-foreground text-sm font-medium">
                      Verified RD
                    </span>
                  </div>
                </div>
              </div>

              {/* Client List */}
              <div className="p-4">
                {[
                  {
                    name: 'Sarah M.',
                    goal: 'Weight Loss',
                    progress: 85,
                    status: 'on-track',
                  },
                  {
                    name: 'Mike T.',
                    goal: 'Muscle Gain',
                    progress: 72,
                    status: 'on-track',
                  },
                  {
                    name: 'Emily R.',
                    goal: 'Maintenance',
                    progress: 45,
                    status: 'needs-attention',
                  },
                  {
                    name: 'James K.',
                    goal: 'Weight Loss',
                    progress: 92,
                    status: 'on-track',
                  },
                ].map((client, index) => (
                  <motion.div
                    key={client.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    viewport={{ once: true }}
                     className="flex items-center justify-between py-3 border-b border-border last:border-0"
                   >
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-medium">
                         {client.name.charAt(0)}
                       </div>
                       <div>
                         <div className="font-medium text-card-foreground">
                           {client.name}
                         </div>
                         <div className="text-xs text-muted-foreground">
                           {client.goal}
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center space-x-3">
                       <div className="text-right">
                         <div className="text-sm font-medium text-card-foreground">
                           {client.progress}%
                         </div>
                         <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                           <motion.div
                             initial={{ width: 0 }}
                             whileInView={{ width: `${client.progress}%` }}
                             transition={{
                               duration: 0.8,
                               delay: 0.5 + index * 0.1,
                             }}
                             viewport={{ once: true }}
                             className={`h-full rounded-full ${
                               client.status === 'on-track'
                                 ? 'bg-primary'
                                 : 'bg-amber-500'
                             }`}
                           />
                         </div>
                       </div>
                       <div
                         className={`w-2 h-2 rounded-full ${
                           client.status === 'on-track'
                             ? 'bg-primary'
                             : 'bg-amber-500'
                         }`}
                       />
                    </div>
                  </motion.div>
                ))}
              </div>

               {/* Quick Actions */}
               <div className="bg-muted p-4 flex gap-3">
                 <button className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
                   + Add Client
                 </button>
                 <button className="flex-1 bg-card border border-border text-card-foreground rounded-lg py-2 text-sm font-medium hover:bg-muted transition-colors">
                   Create Plan
                 </button>
               </div>
            </div>
          </motion.div>

          {/* Right Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center px-3 py-1 bg-primary/20 text-accent rounded-full text-sm font-medium mb-6">
              For Professionals
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Powerful Tools for{' '}
              <span className="text-primary">
                Nutrition Professionals
              </span>
            </h2>

            <p className="text-lg text-muted-foreground mb-8">
              Manage clients, create personalized meal plans, and grow your
              practice with our comprehensive suite of professional tools.
            </p>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-3"
                >
                  <feature.icon className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                   <div>
                     <h3 className="font-medium text-foreground text-sm">
                       {feature.title}
                     </h3>
                     <p className="text-muted-foreground text-xs">
                       {feature.description}
                     </p>
                   </div>
                </motion.div>
              ))}
            </div>

               {/* How It Works for Pros */}
               <div className="bg-card rounded-xl p-5 mb-8">
                 <h3 className="text-foreground font-semibold mb-4">How It Works</h3>
                 <div className="grid grid-cols-2 gap-4">
                   {steps.map((step, index) => (
                     <div key={index} className="flex items-start space-x-3">
                       <div className="text-accent font-bold text-sm">
                         {step.number}
                       </div>
                       <div>
                         <div className="text-foreground text-sm font-medium">
                           {step.title}
                         </div>
                         <div className="text-muted-foreground text-xs">
                           {step.description}
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                asChild
              >
                <Link href="/signup?type=professional">
                  Apply for Professional Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                asChild
              >
                <a href="#pricing">View Pro Pricing</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
