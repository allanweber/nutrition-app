import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import {
  foodLogItems,
  foodLogMeals,
  foodPhotos,
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

    // Validate food log ID
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
        servingUnit: foodLogItems.servingUnit,
        mealType: foodLogMeals.mealType,
        consumedAt: foodLogMeals.consumedAt,
        createdAt: foodLogItems.createdAt,
        food: {
          id: foodLogItems.foodId,
          name: foodLogItems.foodName,
          brandName: foodLogItems.brandName,
          calories: foodLogItems.calories,
          protein: foodLogItems.protein,
          carbs: foodLogItems.carbs,
          fat: foodLogItems.fat,
          fiber: foodLogItems.fiber,
          sugar: foodLogItems.sugar,
          sodium: foodLogItems.sodium,
          servingQty: foodLogItems.servingQty,
          servingUnit: foodLogItems.servingUnitSnapshot,
        },
        photoThumb: foodPhotos.thumb,
      })
      .from(foodLogItems)
      .innerJoin(foodLogMeals, eq(foodLogItems.mealId, foodLogMeals.id))
      .leftJoin(foodPhotos, eq(foodLogItems.foodId, foodPhotos.foodId))
      .where(and(eq(foodLogItems.id, logId), eq(foodLogMeals.userId, user.id)));

    if (itemLog) {
      const transformedLog = {
        id: itemLog.id,
        quantity: toNumber(itemLog.quantity),
        servingUnit: itemLog.servingUnit,
        mealType: itemLog.mealType,
        consumedAt: itemLog.consumedAt,
        createdAt: itemLog.createdAt,
        food: {
          ...itemLog.food,
          id: itemLog.food.id ?? null,
          calories: toNumber(itemLog.food.calories),
          protein: toNumber(itemLog.food.protein),
          carbs: toNumber(itemLog.food.carbs),
          fat: toNumber(itemLog.food.fat),
          fiber: toNumber(itemLog.food.fiber),
          sugar: toNumber(itemLog.food.sugar),
          sodium: toNumber(itemLog.food.sodium),
          servingQty: toNumber(itemLog.food.servingQty),
          photoUrl: itemLog.photoThumb,
        },
      };

      return NextResponse.json({ log: transformedLog });
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

    // Validate food log ID
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

    if (existingItemLog.length === 0) {
      return NextResponse.json(
        { error: 'Food log not found or unauthorized' },
        { status: 404 }
      );
    }

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

    // Validate food log ID
    const idValidation = validateApiInput(foodLogIdSchema, id, 'id');
    if (!idValidation.success) {
      return NextResponse.json(
        { error: idValidation.error },
        { status: 400 }
      );
    }

    const logId = idValidation.data;

    // Validate request body
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
        updatedAt?: Date;
      } = {};

      if (updateData.quantity !== undefined) {
        itemUpdateData.quantity = updateData.quantity.toString();
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

    if (existingItemLog.length === 0) {
      return NextResponse.json(
        { error: 'Food log not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Food log updated successfully',
    });

  } catch (error) {
    console.error('Food log update error:', error);
    return NextResponse.json(
      { error: 'Failed to update food log' },
      { status: 500 }
    );
  }
}
