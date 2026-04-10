'use client';

import { useState } from 'react';
import { GoalsForm } from '@/components/forms/goals-form';
import { GoalWizardModal } from '@/components/goal-wizard-modal';

export default function GoalsPage() {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto w-full px-4">
      <GoalsForm onOpenCalculator={() => setWizardOpen(true)} />

      <GoalWizardModal open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
