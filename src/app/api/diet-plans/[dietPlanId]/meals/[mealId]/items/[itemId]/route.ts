import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { dietPlanMealItems, dietPlanMeals, dietPlans, foodAltMeasures } from '@/server/db/schema';
import { updateMealItemSchema, validateRequestBody } from '@/lib/api-validation';

type Params = { params: Promise<{ dietPlanId: string; mealId: string; itemId: string }> };

async function verifyItemOwnership(dietPlanId: string, mealId: string, itemId: string, userId: string) {
  const plan = await db.query.dietPlans.findFirst({
    where: and(eq(dietPlans.id, dietPlanId), eq(dietPlans.clientId, userId)),
  });
  if (!plan) return null;

  const meal = await db.query.dietPlanMeals.findFirst({
    where: and(eq(dietPlanMeals.id, mealId), eq(dietPlanMeals.dietPlanId, dietPlanId)),
  });
  if (!meal) return null;

  const item = await db.query.dietPlanMealItems.findFirst({
    where: and(eq(dietPlanMealItems.id, itemId), eq(dietPlanMealItems.groupId, mealId)),
  });
  return item ?? null;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { dietPlanId, mealId, itemId } = await params;

    const item = await verifyItemOwnership(dietPlanId, mealId, itemId, user.id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const validation = await validateRequestBody(request, updateMealItemSchema);
    if (!validation.success) return validation.response;

    // Validate altMeasureId if provided
    if (validation.data.altMeasureId) {
      const measure = await db.query.foodAltMeasures.findFirst({
        where: eq(foodAltMeasures.id, validation.data.altMeasureId),
      });
      if (!measure) {
        return NextResponse.json({ error: 'Measure not found' }, { status: 404 });
      }
    }

    const updates: Partial<typeof dietPlanMealItems.$inferInsert> = { updatedAt: new Date() };
    if (validation.data.quantity !== undefined) updates.quantity = validation.data.quantity.toString();
    if (validation.data.altMeasureId !== undefined) updates.altMeasureId = validation.data.altMeasureId;

    const [updated] = await db
      .update(dietPlanMealItems)
      .set(updates)
      .where(eq(dietPlanMealItems.id, itemId))
      .returning();

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('Error updating meal item:', error);
    return NextResponse.json({ error: 'Failed to update meal item' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { dietPlanId, mealId, itemId } = await params;

    const item = await verifyItemOwnership(dietPlanId, mealId, itemId, user.id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await db.delete(dietPlanMealItems).where(eq(dietPlanMealItems.id, itemId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal item:', error);
    return NextResponse.json({ error: 'Failed to delete meal item' }, { status: 500 });
  }
}
