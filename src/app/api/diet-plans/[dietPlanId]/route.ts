import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { dietPlans } from '@/server/db/schema';
import { updateDietPlanSchema, validateRequestBody } from '@/lib/api-validation';
import { archiveActivePlans, toNumber } from '@/server/services/diet-plan.service';

type Params = { params: Promise<{ dietPlanId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { dietPlanId } = await params;

    const validation = await validateRequestBody(request, updateDietPlanSchema);
    if (!validation.success) return validation.response;

    const existing = await db.query.dietPlans.findFirst({
      where: and(eq(dietPlans.id, dietPlanId), eq(dietPlans.clientId, user.id)),
    });
    if (!existing) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const { name, description, targetCalories, targetProtein, targetCarbs, targetFat, startDate, endDate, status } =
      validation.data;

    if (status === 'active' && existing.status !== 'active') {
      await archiveActivePlans(user.id);
    }

    const updates: Partial<typeof dietPlans.$inferInsert> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (targetCalories !== undefined) updates.targetCalories = targetCalories.toString();
    if (targetProtein !== undefined) updates.targetProtein = targetProtein.toString();
    if (targetCarbs !== undefined) updates.targetCarbs = targetCarbs.toString();
    if (targetFat !== undefined) updates.targetFat = targetFat.toString();
    if (startDate !== undefined) updates.startDate = new Date(startDate);
    if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
    if (status !== undefined) updates.status = status;

    const [updated] = await db
      .update(dietPlans)
      .set(updates)
      .where(and(eq(dietPlans.id, dietPlanId), eq(dietPlans.clientId, user.id)))
      .returning();

    return NextResponse.json({
      plan: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        status: updated.status,
        targetCalories: toNumber(updated.targetCalories),
        targetProtein: toNumber(updated.targetProtein),
        targetCarbs: toNumber(updated.targetCarbs),
        targetFat: toNumber(updated.targetFat),
        startDate: updated.startDate.toISOString(),
        endDate: updated.endDate ? updated.endDate.toISOString() : null,
      },
    });
  } catch (error) {
    console.error('Error updating diet plan:', error);
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json({ error: 'An active plan already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update diet plan' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { dietPlanId } = await params;

    const existing = await db.query.dietPlans.findFirst({
      where: and(eq(dietPlans.id, dietPlanId), eq(dietPlans.clientId, user.id)),
    });
    if (!existing) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    await db
      .delete(dietPlans)
      .where(and(eq(dietPlans.id, dietPlanId), eq(dietPlans.clientId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting diet plan:', error);
    return NextResponse.json({ error: 'Failed to delete diet plan' }, { status: 500 });
  }
}
