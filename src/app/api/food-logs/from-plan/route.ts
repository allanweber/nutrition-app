import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gte, inArray, lt } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import {
  dietPlanMealItems,
  dietPlanMeals,
  dietPlans,
  foodAltMeasures,
  foodLogItems,
  foodLogMeals,
} from '@/server/db/schema';
import { logFromPlanSchema, validateRequestBody } from '@/lib/api-validation';

type MergeableMealType = typeof dietPlanMeals.$inferSelect.mealType;

const PLAN_MEAL_HOURS: Record<MergeableMealType, number> = {
  breakfast: 8,
  morning_snack: 10,
  lunch: 12,
  afternoon_snack: 15,
  dinner: 18,
  evening_snack: 20,
  pre_workout: 16,
  post_workout: 19,
  snack: 14,
  other: 13,
};

function toDayWindow(date: string) {
  return {
    start: new Date(`${date}T00:00:00.000Z`),
    end: new Date(`${date}T23:59:59.999Z`),
  };
}

function getDbDayOfWeek(date: string) {
  const jsDay = new Date(`${date}T12:00:00.000Z`).getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
}

function getMealTimestamp(date: string, mealType: MergeableMealType) {
  const hour = PLAN_MEAL_HOURS[mealType] ?? PLAN_MEAL_HOURS.other;
  return new Date(`${date}T${String(hour).padStart(2, '0')}:00:00.000Z`);
}

function createMergeKey(foodId: string, altMeasureId: string | null, mealType: string) {
  return `${foodId}:${altMeasureId ?? 'null'}:${mealType}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const validation = await validateRequestBody(request, logFromPlanSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { mode, date, planId } = validation.data;
    const requestedMealType = mode === 'add-meal' ? validation.data.mealType : null;
    const dayOfWeek = getDbDayOfWeek(date);
    const { start, end } = toDayWindow(date);

    const plan = await db.query.dietPlans.findFirst({
      where: and(
        eq(dietPlans.id, planId),
        eq(dietPlans.clientId, user.id),
        eq(dietPlans.status, 'active'),
      ),
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Active plan not found' },
        { status: 404 },
      );
    }

    const planMealRows = await db
      .select({
        mealId: dietPlanMeals.id,
        mealType: dietPlanMeals.mealType,
        itemId: dietPlanMealItems.id,
        foodId: dietPlanMealItems.foodId,
        altMeasureId: dietPlanMealItems.altMeasureId,
        quantity: dietPlanMealItems.quantity,
        altMeasureServingWeight: foodAltMeasures.servingWeight,
        dishGroupId: dietPlanMealItems.dishGroupId,
        dishNameSnapshot: dietPlanMealItems.dishNameSnapshot,
      })
      .from(dietPlanMeals)
      .leftJoin(dietPlanMealItems, eq(dietPlanMealItems.groupId, dietPlanMeals.id))
      .leftJoin(foodAltMeasures, eq(dietPlanMealItems.altMeasureId, foodAltMeasures.id))
      .where(
        and(
          eq(dietPlanMeals.dietPlanId, planId),
          eq(dietPlanMeals.dayOfWeek, dayOfWeek),
          requestedMealType ? eq(dietPlanMeals.mealType, requestedMealType) : undefined,
        ),
      );

    const coveredMealTypes = Array.from(
      new Set(planMealRows.map((row) => row.mealType)),
    );

    if (coveredMealTypes.length === 0) {
      return NextResponse.json({
        success: true,
        insertedCount: 0,
        mergedCount: 0,
        deletedCount: 0,
      });
    }

    if (requestedMealType && !coveredMealTypes.includes(requestedMealType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Selected meal type is not planned for this date',
          field: 'mealType',
        },
        { status: 400 },
      );
    }

    const planItems = planMealRows.filter((row) => row.itemId !== null);

    const result = await db.transaction(async (tx) => {
      let insertedCount = 0;
      let mergedCount = 0;
      let deletedCount = 0;

      if (mode === 'replace-all') {
        const mealsToDelete = await tx
          .select({ id: foodLogMeals.id })
          .from(foodLogMeals)
          .where(
            and(
              eq(foodLogMeals.userId, user.id),
              gte(foodLogMeals.consumedAt, start),
              lt(foodLogMeals.consumedAt, end),
              inArray(foodLogMeals.mealType, coveredMealTypes),
            ),
          );

        if (mealsToDelete.length > 0) {
          const mealIds = mealsToDelete.map((meal) => meal.id);
          const itemsToDelete = await tx
            .select({ id: foodLogItems.id })
            .from(foodLogItems)
            .where(inArray(foodLogItems.mealId, mealIds));

          deletedCount = itemsToDelete.length;

          await tx.delete(foodLogMeals).where(inArray(foodLogMeals.id, mealIds));
        }
      }

      const existingItems = mode === 'replace-all'
        ? []
        : await tx
            .select({
              id: foodLogItems.id,
              mealId: foodLogItems.mealId,
              foodId: foodLogItems.foodId,
              altMeasureId: foodLogItems.altMeasureId,
              quantity: foodLogItems.quantity,
              mealType: foodLogMeals.mealType,
            })
            .from(foodLogItems)
            .innerJoin(foodLogMeals, eq(foodLogItems.mealId, foodLogMeals.id))
            .where(
              and(
                eq(foodLogMeals.userId, user.id),
                gte(foodLogMeals.consumedAt, start),
                lt(foodLogMeals.consumedAt, end),
                inArray(foodLogMeals.mealType, coveredMealTypes),
              ),
            );

      const existingByKey = new Map(
        existingItems.map((item) => [
          createMergeKey(item.foodId, item.altMeasureId, item.mealType),
          item,
        ]),
      );

      const mealGroupByType = new Map<string, string>();
      /** Plan `dish_group_id` → new `dish_log_group_id` for this log session */
      const planDishGroupToLogGroupId = new Map<string, string>();

      if (mode !== 'replace-all') {
        const existingMeals = await tx
          .select({
            id: foodLogMeals.id,
            mealType: foodLogMeals.mealType,
            sourceDietPlanMealGroupId: foodLogMeals.sourceDietPlanMealGroupId,
          })
          .from(foodLogMeals)
          .where(
            and(
              eq(foodLogMeals.userId, user.id),
              gte(foodLogMeals.consumedAt, start),
              lt(foodLogMeals.consumedAt, end),
              inArray(foodLogMeals.mealType, coveredMealTypes),
            ),
          );

        for (const meal of existingMeals) {
          if (!mealGroupByType.has(meal.mealType)) {
            mealGroupByType.set(meal.mealType, meal.id);
          }
        }
      }

      for (const row of planMealRows) {
        if (!mealGroupByType.has(row.mealType)) {
          const [newMeal] = await tx
            .insert(foodLogMeals)
            .values({
              userId: user.id,
              mealType: row.mealType,
              consumedAt: getMealTimestamp(date, row.mealType),
              sourceDietPlanMealGroupId: row.mealId,
            })
            .returning({ id: foodLogMeals.id });

          mealGroupByType.set(row.mealType, newMeal.id);
        }
      }

      for (const row of planItems) {
        const mergeKey = createMergeKey(row.foodId!, row.altMeasureId, row.mealType);
        const existing = existingByKey.get(mergeKey);
        const quantityInGrams = row.altMeasureId
          ? Number(row.quantity!) * Number(row.altMeasureServingWeight ?? 0)
          : Number(row.quantity!);

        if (existing) {
          await tx
            .update(foodLogItems)
            .set({
              quantity: (Number(existing.quantity) + quantityInGrams).toFixed(2),
              updatedAt: new Date(),
            })
            .where(eq(foodLogItems.id, existing.id));
          mergedCount += 1;
          continue;
        }

        let dishLogGroupId: string | null = null;
        let dishNameSnapshot: string | null = null;
        if (row.dishGroupId) {
          let logGroupId = planDishGroupToLogGroupId.get(row.dishGroupId);
          if (!logGroupId) {
            logGroupId = uuidv7();
            planDishGroupToLogGroupId.set(row.dishGroupId, logGroupId);
          }
          dishLogGroupId = logGroupId;
          dishNameSnapshot = row.dishNameSnapshot ?? null;
        }

        await tx.insert(foodLogItems).values({
          mealId: mealGroupByType.get(row.mealType)!,
          foodId: row.foodId!,
          altMeasureId: row.altMeasureId,
          quantity: quantityInGrams.toFixed(2),
          dishLogGroupId,
          dishNameSnapshot,
        });
        insertedCount += 1;
      }

      return { insertedCount, mergedCount, deletedCount };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error logging plan meals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log plan meals' },
      { status: 500 },
    );
  }
}