import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { dietPlanMealItems, dietPlanMeals } from '@/server/db/schema';

type Params = { params: Promise<{ dietPlanId: string; mealId: string; dishGroupId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dietPlanId, mealId, dishGroupId } = await params;

    const meal = await db.query.dietPlanMeals.findFirst({
      where: and(eq(dietPlanMeals.id, mealId), eq(dietPlanMeals.dietPlanId, dietPlanId)),
      with: { dietPlan: true },
    });
    if (!meal || meal.dietPlan?.clientId !== user.id) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    await db
      .delete(dietPlanMealItems)
      .where(
        and(
          eq(dietPlanMealItems.groupId, mealId),
          eq(dietPlanMealItems.dishGroupId, dishGroupId),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dish group from meal:', error);
    return NextResponse.json({ error: 'Failed to delete dish group' }, { status: 500 });
  }
}
