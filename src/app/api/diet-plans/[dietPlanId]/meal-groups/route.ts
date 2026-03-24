import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import { getCurrentUser } from '@/lib/session';
import { validateRequestBody } from '@/lib/api-validation';
import { db } from '@/server/db';
import {
  dietPlanMealGroups,
  dietPlanMealItems,
  dietPlans,
  foodPhotos,
  foods,
} from '@/server/db/schema';

const createMealGroupSchema = z.object({
  mealType: z.enum([
    'breakfast',
    'lunch',
    'dinner',
    'snack',
    'morning_snack',
    'afternoon_snack',
    'evening_snack',
    'pre_workout',
    'post_workout',
    'other',
  ]),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  scheduledAt: z.string().datetime().optional(),
  items: z
    .array(
      z.object({
        foodId: z.string().uuid(),
        quantity: z.number().positive().max(100000),
        altMeasureId: z.string().uuid().optional().nullable(),
      }),
    )
    .min(1)
    .max(100),
});

function parseDietPlanId(raw: string): string | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(raw.trim()) ? raw.trim() : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ dietPlanId: string }> },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { dietPlanId: dietPlanIdParam } = await params;
    const dietPlanId = parseDietPlanId(dietPlanIdParam);

    if (!dietPlanId) {
      return NextResponse.json({ error: 'Invalid diet plan id' }, { status: 400 });
    }

    const plan = await db.query.dietPlans.findFirst({
      where: and(eq(dietPlans.id, dietPlanId), eq(dietPlans.clientId, user.id)),
    });

    if (!plan) {
      return NextResponse.json({ error: 'Diet plan not found' }, { status: 404 });
    }

    const rows = await db
      .select({
        groupId: dietPlanMealGroups.id,
        mealType: dietPlanMealGroups.mealType,
        dayOfWeek: dietPlanMealGroups.dayOfWeek,
        scheduledAt: dietPlanMealGroups.scheduledAt,
        createdAt: dietPlanMealGroups.createdAt,
        itemId: dietPlanMealItems.id,
        quantity: dietPlanMealItems.quantity,
        foodId: foods.id,
        foodName: foods.name,
        brandName: foods.brandName,
        calories: foods.calories,
        protein: foods.protein,
        carbs: foods.carbs,
        fat: foods.fat,
        fiber: foods.fiber,
        sugar: foods.sugar,
        sodium: foods.sodium,
        photoThumb: foodPhotos.thumb,
      })
      .from(dietPlanMealGroups)
      .leftJoin(dietPlanMealItems, eq(dietPlanMealItems.groupId, dietPlanMealGroups.id))
      .leftJoin(foods, eq(dietPlanMealItems.foodId, foods.id))
      .leftJoin(foodPhotos, eq(dietPlanMealItems.foodId, foodPhotos.foodId))
      .where(eq(dietPlanMealGroups.dietPlanId, dietPlanId));

    const grouped = new Map<string, {
      id: string;
      mealType: string;
      dayOfWeek: number | null;
      scheduledAt: Date | null;
      createdAt: Date;
      items: Array<{
        id: string;
        quantity: number;
        food: {
          id: string | null;
          name: string;
          brandName: string | null;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber: number;
          sugar: number;
          sodium: number;
          photoUrl: string | null;
        };
      }>;
    }>();

    for (const row of rows) {
      if (!grouped.has(row.groupId)) {
        grouped.set(row.groupId, {
          id: row.groupId,
          mealType: row.mealType,
          dayOfWeek: row.dayOfWeek,
          scheduledAt: row.scheduledAt,
          createdAt: row.createdAt,
          items: [],
        });
      }

      if (row.itemId !== null) {
        grouped.get(row.groupId)?.items.push({
          id: row.itemId,
          quantity: Number(row.quantity),
          food: {
            id: row.foodId,
            name: row.foodName || 'Unknown food',
            brandName: row.brandName,
            calories: Number(row.calories || 0),
            protein: Number(row.protein || 0),
            carbs: Number(row.carbs || 0),
            fat: Number(row.fat || 0),
            fiber: Number(row.fiber || 0),
            sugar: Number(row.sugar || 0),
            sodium: Number(row.sodium || 0),
            photoUrl: row.photoThumb || null,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      mealGroups: Array.from(grouped.values()),
    });
  } catch (error) {
    console.error('Failed to fetch diet plan meal groups:', error);
    return NextResponse.json({ error: 'Failed to fetch meal groups' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dietPlanId: string }> },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { dietPlanId: dietPlanIdParam } = await params;
    const dietPlanId = parseDietPlanId(dietPlanIdParam);

    if (!dietPlanId) {
      return NextResponse.json({ error: 'Invalid diet plan id' }, { status: 400 });
    }

    const plan = await db.query.dietPlans.findFirst({
      where: and(eq(dietPlans.id, dietPlanId), eq(dietPlans.clientId, user.id)),
    });

    if (!plan) {
      return NextResponse.json({ error: 'Diet plan not found' }, { status: 404 });
    }

    const validation = await validateRequestBody(request, createMealGroupSchema);
    if (!validation.success) {
      return validation.response;
    }

    const payload = validation.data;

    // Validate all foods exist
    for (const item of payload.items) {
      const existingFood = await db.query.foods.findFirst({
        where: eq(foods.id, item.foodId),
      });

      if (!existingFood) {
        return NextResponse.json(
          {
            success: false,
            error: `Food ${item.foodId} was not found`,
            field: 'items',
          },
          { status: 400 },
        );
      }
    }

    const created = await db.transaction(async (tx) => {
      const [group] = await tx
        .insert(dietPlanMealGroups)
        .values({
          dietPlanId,
          mealType: payload.mealType,
          dayOfWeek: payload.dayOfWeek ?? null,
          scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
        })
        .returning();

      const insertedItems = await tx
        .insert(dietPlanMealItems)
        .values(
          payload.items.map((item) => ({
            groupId: group.id,
            foodId: item.foodId,
            quantity: item.quantity.toString(),
            altMeasureId: item.altMeasureId ?? null,
          })),
        )
        .returning();

      return {
        group,
        items: insertedItems,
      };
    });

    return NextResponse.json({
      success: true,
      mealGroup: created.group,
      itemsCreated: created.items.length,
    });
  } catch (error) {
    console.error('Failed to create diet plan meal group:', error);
    return NextResponse.json({ error: 'Failed to create meal group' }, { status: 500 });
  }
}
