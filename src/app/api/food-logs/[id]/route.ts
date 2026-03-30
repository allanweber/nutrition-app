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
          source: foods.source,
          servingWeightGrams: foods.servingWeightGrams,
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
      const normFactor =
        itemLog.food.source === 'user_custom' && itemLog.food.servingWeightGrams
          ? 100 / toNumber(itemLog.food.servingWeightGrams)
          : 1;
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
            calories: toNumber(itemLog.food.calories) * normFactor,
            protein: toNumber(itemLog.food.protein) * normFactor,
            carbs: toNumber(itemLog.food.carbs) * normFactor,
            fat: toNumber(itemLog.food.fat) * normFactor,
            fiber: toNumber(itemLog.food.fiber) * normFactor,
            sugar: toNumber(itemLog.food.sugar) * normFactor,
            sodium: toNumber(itemLog.food.sodium) * normFactor,
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
        const mealUpdateData: {
          mealType?: typeof foodLogMeals.$inferInsert.mealType;
          consumedAt?: Date;
          updatedAt?: Date;
        } = {};

        if (updateData.mealType !== undefined) {
          mealUpdateData.mealType = updateData.mealType;
        }
        if (updateData.consumedAt !== undefined) {
          mealUpdateData.consumedAt = updateData.consumedAt;
        }

        if (Object.keys(mealUpdateData).length > 0) {
          mealUpdateData.updatedAt = new Date();
          await db
            .update(foodLogMeals)
            .set(mealUpdateData)
            .where(eq(foodLogMeals.id, existingItemLog[0].mealId));
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
