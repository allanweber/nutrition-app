import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { foodLogItems, foodLogMeals } from '@/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// DELETE /api/food-logs/dish-group/[dishLogGroupId] — delete all items in a dish log group
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ dishLogGroupId: string }> }
) {
  const { dishLogGroupId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find all items for this group, verify ownership via meal join
  const items = await db
    .select({ id: foodLogItems.id, mealId: foodLogItems.mealId })
    .from(foodLogItems)
    .innerJoin(foodLogMeals, eq(foodLogItems.mealId, foodLogMeals.id))
    .where(
      and(
        eq(foodLogItems.dishLogGroupId, dishLogGroupId),
        eq(foodLogMeals.userId, user.id),
      )
    );

  if (items.length === 0) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const itemIds = items.map((i) => i.id);
  const affectedMealIds = [...new Set(items.map((i) => i.mealId))];

  await db.transaction(async (tx) => {
    await tx.delete(foodLogItems).where(inArray(foodLogItems.id, itemIds));

    // Clean up meals with no remaining items
    for (const mealId of affectedMealIds) {
      const remaining = await tx.query.foodLogItems.findFirst({
        where: eq(foodLogItems.mealId, mealId),
      });
      if (!remaining) {
        await tx.delete(foodLogMeals).where(eq(foodLogMeals.id, mealId));
      }
    }
  });

  return NextResponse.json({ success: true, deletedCount: itemIds.length });
}
