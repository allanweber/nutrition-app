import { MealPlannerClient } from '@/components/meal-planner/meal-planner-client';

export default async function MealPlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string; day?: string }>
}) {
  const { planId, day } = await searchParams;
  const initialDay = day ? parseInt(day, 10) : 1;

  return (
    <MealPlannerClient
      initialPlanId={planId ?? null}
      initialDay={isNaN(initialDay) || initialDay < 1 || initialDay > 7 ? 1 : initialDay}
    />
  );
}
