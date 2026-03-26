import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import {
  foodAltMeasures,
  foodLogItems,
  foodLogMeals,
  foodPhotos,
  foods,
} from '@/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { foodLogIdSchema, updateFoodLogSchema, validateApiInput, validateRequestBody } from '@/lib/api-validation';

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function roundToMealMinute(date: Date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  return d;
}

// GET - Fetch a specific food log entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const idValidation = validateApiInput(foodLogIdSchema, id, 'id');
    if (!idValidation.success) {
      return NextResponse.json(
        { error: idValidation.error },
        { status: 400 }
      );
    }

    const logId = idValidation.data;

    const [itemLog] = await db
      .select({
        id: foodLogItems.id,
        quantity: foodLogItems.quantity,
        mealType: foodLogMeals.mealType,
        consumedAt: foodLogMeals.consumedAt,
        createdAt: foodLogItems.createdAt,
        food: {
          id: foods.id,
          name: foods.name,
          brandName: foods.brandName,
          calories: foods.calories,
          protein: foods.protein,
          carbs: foods.carbs,
          fat: foods.fat,
          fiber: foods.fiber,
          sugar: foods.sugar,
          sodium: foods.sodium,
        },
        photoThumb: foodPhotos.thumb,
        altMeasureId: foodAltMeasures.id,
        altMeasureDescription: foodAltMeasures.measure,
        altMeasureWeightGrams: foodAltMeasures.servingWeight,
        altMeasureQty: foodAltMeasures.qty,
      })
      .from(foodLogItems)
      .innerJoin(foodLogMeals, eq(foodLogItems.mealId, foodLogMeals.id))
      .innerJoin(foods, eq(foodLogItems.foodId, foods.id))
      .leftJoin(foodPhotos, eq(foodLogItems.foodId, foodPhotos.foodId))
      .leftJoin(foodAltMeasures, eq(foodLogItems.altMeasureId, foodAltMeasures.id))
      .where(and(eq(foodLogItems.id, logId), eq(foodLogMeals.userId, user.id)));

    if (itemLog) {
      return NextResponse.json({
        log: {
          id: itemLog.id,
          quantity: toNumber(itemLog.quantity),
          mealType: itemLog.mealType,
          consumedAt: itemLog.consumedAt,
          createdAt: itemLog.createdAt,
          food: {
            id: itemLog.food.id,
            name: itemLog.food.name,
            brandName: itemLog.food.brandName,
            calories: toNumber(itemLog.food.calories),
            protein: toNumber(itemLog.food.protein),
            carbs: toNumber(itemLog.food.carbs),
            fat: toNumber(itemLog.food.fat),
            fiber: toNumber(itemLog.food.fiber),
            sugar: toNumber(itemLog.food.sugar),
            sodium: toNumber(itemLog.food.sodium),
            photoUrl: itemLog.photoThumb ?? null,
          },
          altMeasure: itemLog.altMeasureId
            ? {
                id: itemLog.altMeasureId,
                description: itemLog.altMeasureDescription!,
                weightGrams: toNumber(itemLog.altMeasureWeightGrams),
                qty: toNumber(itemLog.altMeasureQty),
              }
            : null,
        },
      });
    }

    return NextResponse.json(
      { error: 'Food log not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Food log fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch food log' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a food log entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const idValidation = validateApiInput(foodLogIdSchema, id, 'id');
    if (!idValidation.success) {
      return NextResponse.json(
        { error: idValidation.error },
        { status: 400 }
      );
    }

    const logId = idValidation.data;

    const existingItemLog = await db
      .select({
        id: foodLogItems.id,
        mealId: foodLogItems.mealId,
      })
      .from(foodLogItems)
      .innerJoin(foodLogMeals, eq(foodLogItems.mealId, foodLogMeals.id))
      .where(and(eq(foodLogItems.id, logId), eq(foodLogMeals.userId, user.id)));

    if (existingItemLog.length > 0) {
      const mealId = existingItemLog[0].mealId;

      await db.delete(foodLogItems).where(eq(foodLogItems.id, logId));

      const remainingItems = await db.query.foodLogItems.findFirst({
        where: eq(foodLogItems.mealId, mealId),
      });

      if (!remainingItems) {
        await db.delete(foodLogMeals).where(eq(foodLogMeals.id, mealId));
      }

      return NextResponse.json({
        success: true,
        message: 'Food log deleted successfully',
      });
    }

    return NextResponse.json(
      { error: 'Food log not found or unauthorized' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Food log delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete food log' },
      { status: 500 }
    );
  }
}

// PATCH - Update a food log entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const idValidation = validateApiInput(foodLogIdSchema, id, 'id');
    if (!idValidation.success) {
      return NextResponse.json(
        { error: idValidation.error },
        { status: 400 }
      );
    }

    const logId = idValidation.data;

    const validation = await validateRequestBody(request, updateFoodLogSchema);
    if (!validation.success) {
      return validation.response;
    }

    const updateData = validation.data;

    const existingItemLog = await db
      .select({
        id: foodLogItems.id,
        mealId: foodLogItems.mealId,
      })
      .from(foodLogItems)
      .innerJoin(foodLogMeals, eq(foodLogItems.mealId, foodLogMeals.id))
      .where(and(eq(foodLogItems.id, logId), eq(foodLogMeals.userId, user.id)));

    if (existingItemLog.length > 0) {
      const itemUpdateData: {
        quantity?: string;
        altMeasureId?: string | null;
        updatedAt?: Date;
      } = {};

      if (updateData.quantity !== undefined) {
        itemUpdateData.quantity = updateData.quantity.toString();
      }
      if ('altMeasureId' in updateData && updateData.altMeasureId !== undefined) {
        itemUpdateData.altMeasureId = updateData.altMeasureId;
      }

      if (Object.keys(itemUpdateData).length > 0) {
        itemUpdateData.updatedAt = new Date();
        await db
          .update(foodLogItems)
          .set(itemUpdateData)
          .where(eq(foodLogItems.id, logId));
      }

      if (updateData.mealType !== undefined || updateData.consumedAt !== undefined) {
        const currentMealId = existingItemLog[0].mealId;

        // Fetch the current meal to know its existing date/type
        const [currentMeal] = await db
          .select({
            id: foodLogMeals.id,
            mealType: foodLogMeals.mealType,
            consumedAt: foodLogMeals.consumedAt,
          })
          .from(foodLogMeals)
          .where(eq(foodLogMeals.id, currentMealId));

        const newMealType = (updateData.mealType ?? currentMeal.mealType) as typeof foodLogMeals.$inferInsert.mealType;
        const newConsumedAt = updateData.consumedAt ?? currentMeal.consumedAt;

        // Count how many items share the current meal
        const siblingsResult = await db
          .select({ id: foodLogItems.id })
          .from(foodLogItems)
          .where(eq(foodLogItems.mealId, currentMealId));

        if (siblingsResult.length <= 1) {
          // This is the only item — safe to update the meal row directly
          await db
            .update(foodLogMeals)
            .set({ mealType: newMealType, consumedAt: newConsumedAt, updatedAt: new Date() })
            .where(eq(foodLogMeals.id, currentMealId));
        } else {
          // Other items share this meal — find or create the target meal and move just this item
          const normalizedConsumedAt = roundToMealMinute(newConsumedAt);

          const existingTargetMeal = await db.query.foodLogMeals.findFirst({
            where: and(
              eq(foodLogMeals.userId, user.id),
              eq(foodLogMeals.mealType, newMealType),
              eq(foodLogMeals.consumedAt, normalizedConsumedAt),
            ),
          });

          let targetMealId = existingTargetMeal?.id;
          if (!targetMealId) {
            const [newMeal] = await db
              .insert(foodLogMeals)
              .values({ userId: user.id, mealType: newMealType, consumedAt: normalizedConsumedAt })
              .returning();
            targetMealId = newMeal.id;
          }

          await db
            .update(foodLogItems)
            .set({ mealId: targetMealId, updatedAt: new Date() })
            .where(eq(foodLogItems.id, logId));
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Food log updated successfully',
      });
    }

    return NextResponse.json(
      { error: 'Food log not found or unauthorized' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Food log update error:', error);
    return NextResponse.json(
      { error: 'Failed to update food log' },
      { status: 500 }
    );
  }
}
