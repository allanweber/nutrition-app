'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/session';
import { addWater } from '@/server/services/dashboard.service';
import { type HydrationLogDTO } from '@/server/services/dashboard.service';

export async function addWaterAction(): Promise<HydrationLogDTO> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthenticated');

  const today = new Date().toISOString().split('T')[0];
  const result = await addWater(user.id, today);

  revalidatePath('/dashboard');
  return result;
}
