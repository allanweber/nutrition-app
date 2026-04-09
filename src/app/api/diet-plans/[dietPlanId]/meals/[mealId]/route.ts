import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { dietPlanMeals, dietPlans } from '@/server/db/schema';
import { updateDietPlanMealSchema, validateRequestBody } from '@/lib/api-validation';

type Params = { params: Promise<{ dietPlanId: string; mealId: string }> };

async function verifyOwnership(dietPlanId: string, mealId: string, userId: string) {
  const plan = await db.query.dietPlans.findFirst({
    where: and(eq(dietPlans.id, dietPlanId), eq(dietPlans.clientId, userId)),
  });
  if (!plan) return null;

  const meal = await db.query.dietPlanMeals.findFirst({
    where: and(eq(dietPlanMeals.id, mealId), eq(dietPlanMeals.dietPlanId, dietPlanId)),
  });
  return meal ?? null;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { dietPlanId, mealId } = await params;

    const meal = await verifyOwnership(dietPlanId, mealId, user.id);
    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    const validation = await validateRequestBody(request, updateDietPlanMealSchema);
    if (!validation.success) return validation.response;

    const updates: Partial<typeof dietPlanMeals.$inferInsert> = { updatedAt: new Date() };
    if (validation.data.mealType !== undefined) updates.mealType = validation.data.mealType;
    if (validation.data.dayOfWeek !== undefined) updates.dayOfWeek = validation.data.dayOfWeek;

    const [updated] = await db
      .update(dietPlanMeals)
      .set(updates)
      .where(eq(dietPlanMeals.id, mealId))
      .returning();

    return NextResponse.json({ meal: updated });
  } catch (error) {
    console.error('Error updating meal:', error);
    return NextResponse.json({ error: 'Failed to update meal' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { dietPlanId, mealId } = await params;

    const meal = await verifyOwnership(dietPlanId, mealId, user.id);
    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    await db.delete(dietPlanMeals).where(eq(dietPlanMeals.id, mealId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal:', error);
    return NextResponse.json({ error: 'Failed to delete meal' }, { status: 500 });
  }
}
