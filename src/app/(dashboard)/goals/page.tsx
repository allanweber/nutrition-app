'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GoalsForm } from '@/components/forms/goals-form';
import { GoalWizardModal } from '@/components/goal-wizard-modal';

interface GoalWizardProfile {
  dateOfBirth: string | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  preferredUnit: 'metric' | 'imperial' | null;
}

export default function GoalsPage() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const { data } = useQuery<{ profile: GoalWizardProfile } | null>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile', { credentials: 'include' });
      if (!res.ok) return null;
      const json = (await res.json().catch(() => null)) as { profile?: GoalWizardProfile } | null;
      if (!json?.profile) return null;
      return { profile: json.profile };
    },
  });

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl px-4">
      <GoalsForm onOpenCalculator={() => setWizardOpen(true)} />

      <GoalWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        initialProfile={data?.profile ?? null}
      />
    </div>
  );
}
