'use client'

import { useState } from 'react'
import type { DietPlanDTO } from '@/server/services/diet-plan.service'
import { useUpdateDietPlanMutation } from '@/queries/diet-plans'

interface ActivatePlanOptions {
  plans: DietPlanDTO[]
  onProceed: () => void | Promise<void>
}

export interface ActivatePlanConflict {
  conflictPlan: DietPlanDTO
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function useActivatePlan() {
  const [conflict, setConflict] = useState<ActivatePlanConflict | null>(null)
  const updateMutation = useUpdateDietPlanMutation()

  async function activate({ plans, onProceed }: ActivatePlanOptions) {
    const activePlan = plans.find((p) => p.status === 'active')

    if (activePlan) {
      setConflict({
        conflictPlan: activePlan,
        onConfirm: async () => {
          setConflict(null)
          await updateMutation.mutateAsync({ planId: activePlan.id, status: 'archived' })
          await onProceed()
        },
        onCancel: () => setConflict(null),
      })
    } else {
      await onProceed()
    }
  }

  return { activate, conflict }
}
