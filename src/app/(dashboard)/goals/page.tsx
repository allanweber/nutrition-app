'use client';

import { useState } from 'react';
import { GoalsForm } from '@/components/forms/goals-form';
import { GoalWizardModal } from '@/components/goal-wizard-modal';

export default function GoalsPage() {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl px-4">
      <GoalsForm onOpenCalculator={() => setWizardOpen(true)} />

      <GoalWizardModal open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
