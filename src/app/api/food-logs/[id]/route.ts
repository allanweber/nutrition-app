import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { foodLogs, foods, foodPhotos } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { foodLogIdSchema, updateFoodLogSchema, validateApiInput, validateRequestBody } from '@/lib/api-validation';

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

    const [log] = await db
      .select({
        id: foodLogs.id,
        quantity: foodLogs.quantity,
        servingUnit: foodLogs.servingUnit,
        mealType: foodLogs.mealType,
        consumedAt: foodLogs.consumedAt,
        createdAt: foodLogs.createdAt,
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
          servingQty: foods.servingQty,
          servingUnit: foods.servingUnit,
        },
        photoThumb: foodPhotos.thumb,
      })
      .from(foodLogs)
      .innerJoin(foods, eq(foodLogs.foodId, foods.id))
      .leftJoin(foodPhotos, eq(foods.id, foodPhotos.foodId))
      .where(
        and(
          eq(foodLogs.id, logId),
          eq(foodLogs.userId, user.id)
        )
      );

    if (!log) {
      return NextResponse.json(
        { error: 'Food log not found' },
        { status: 404 }
      );
    }

    // Transform to include photoUrl in food object
    const transformedLog = {
      id: log.id,
      quantity: log.quantity,
      servingUnit: log.servingUnit,
      mealType: log.mealType,
      consumedAt: log.consumedAt,
      createdAt: log.createdAt,
      food: {
        ...log.food,
        photoUrl: log.photoThumb,
      },
    };

    return NextResponse.json({ log: transformedLog });

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

    // Check if the log exists and belongs to the user
    const existingLog = await db.query.foodLogs.findFirst({
      where: and(
        eq(foodLogs.id, logId),
        eq(foodLogs.userId, user.id)
      ),
    });

    if (!existingLog) {
      return NextResponse.json(
        { error: 'Food log not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the log
    await db.delete(foodLogs).where(
      and(
        eq(foodLogs.id, logId),
        eq(foodLogs.userId, user.id)
      )
    );

    return NextResponse.json({ 
      success: true,
      message: 'Food log deleted successfully',
    });

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

    // Check if the log exists and belongs to the user
    const existingLog = await db.query.foodLogs.findFirst({
      where: and(
        eq(foodLogs.id, logId),
        eq(foodLogs.userId, user.id)
      ),
    });

    if (!existingLog) {
      return NextResponse.json(
        { error: 'Food log not found or unauthorized' },
        { status: 404 }
      );
    }

    // Build update object with proper typing
    const dbUpdateData: {
      quantity?: string
      mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
      consumedAt?: Date
    } = {};

    if (updateData.quantity !== undefined) {
      dbUpdateData.quantity = updateData.quantity.toString();
    }
    if (updateData.mealType !== undefined) {
      dbUpdateData.mealType = updateData.mealType;
    }
    if (updateData.consumedAt !== undefined) {
      dbUpdateData.consumedAt = updateData.consumedAt;
    }

    if (Object.keys(dbUpdateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid update fields provided' },
        { status: 400 }
      );
    }

    // Update the log
    const [updatedLog] = await db
      .update(foodLogs)
      .set(dbUpdateData)
      .where(
        and(
          eq(foodLogs.id, logId),
          eq(foodLogs.userId, user.id)
        )
      )
      .returning();

    return NextResponse.json({ 
      success: true,
      log: updatedLog,
    });

  } catch (error) {
    console.error('Food log update error:', error);
    return NextResponse.json(
      { error: 'Failed to update food log' },
      { status: 500 }
    );
  }
}
