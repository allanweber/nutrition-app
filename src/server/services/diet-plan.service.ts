import { and, eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { db } from '@/server/db';
import {
  dietPlanMealItems,
  dietPlanMeals,
  dietPlans,
  foodAltMeasures,
  foodPhotos,
  foods,
  nutritionGoals,
} from '@/server/db/schema';

// ============================================
// TYPES
// ============================================

export interface DietPlanDTO {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'draft' | 'archived';
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
  startDate: string;
  endDate: string | null;
  avgDailyCalories: number;
  completeness: number;
}

export interface FoodMeasureDTO {
  id: string;
  label: string;
  weightGrams: number;
  defaultQty: number;
}

export interface MealItemDTO {
  id: string;
  foodId: string;
  foodName: string;
  brandName: string | null;
  thumbnail: string | null;
  altMeasureId: string | null;
  altMeasureLabel: string | null;
  /** Stored display quantity (measure units, not grams) */
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Per-100g values from the food record */
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  /** All available measures for this food */
  foodMeasures: FoodMeasureDTO[];
  /** Groups items that came from the same dish addition */
  dishGroupId: string | null;
  dishNameSnapshot: string | null;
  /** Original dish FK — set when the group was added from a custom dish */
  dishSourceId: string | null;
}

export interface DietPlanMealDTO {
  id: string;
  dietPlanId: string;
  mealType: string;
  dayOfWeek: number;
  items: MealItemDTO[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface NutritionGoalDefaults {
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
}

// ============================================
// HELPERS
// ============================================

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function calculateItemMacros(
  food: { calories: string | number | null; protein: string | number | null; carbs: string | number | null; fat: string | number | null },
  quantityGrams: number,
) {
  return {
    calories: Math.round((toNumber(food.calories) / 100) * quantityGrams * 10) / 10,
    protein: Math.round((toNumber(food.protein) / 100) * quantityGrams * 10) / 10,
    carbs: Math.round((toNumber(food.carbs) / 100) * quantityGrams * 10) / 10,
    fat: Math.round((toNumber(food.fat) / 100) * quantityGrams * 10) / 10,
  };
}

// ============================================
// QUERIES
// ============================================

export async function getDietPlansForUser(userId: string): Promise<DietPlanDTO[]> {
  const plans = await db
    .select()
    .from(dietPlans)
    .where(eq(dietPlans.clientId, userId))
    .orderBy(dietPlans.createdAt);

  if (plans.length === 0) return [];

  const planIds = plans.map((p) => p.id);

  // Load all meals + items for all plans in one query
  const mealsWithItems = await db
    .select({
      mealId: dietPlanMeals.id,
      dietPlanId: dietPlanMeals.dietPlanId,
      mealType: dietPlanMeals.mealType,
      dayOfWeek: dietPlanMeals.dayOfWeek,
      itemId: dietPlanMealItems.id,
      quantity: dietPlanMealItems.quantity,
      altMeasureServingWeight: foodAltMeasures.servingWeight,
      foodCalories: foods.calories,
      foodProtein: foods.protein,
      foodCarbs: foods.carbs,
      foodFat: foods.fat,
    })
    .from(dietPlanMeals)
    .leftJoin(dietPlanMealItems, eq(dietPlanMealItems.groupId, dietPlanMeals.id))
    .leftJoin(foods, eq(dietPlanMealItems.foodId, foods.id))
    .leftJoin(foodAltMeasures, eq(dietPlanMealItems.altMeasureId, foodAltMeasures.id))
    .where(inArray(dietPlanMeals.dietPlanId, planIds));

  // Group by planId
  const planCalories: Record<string, number> = {};
  // For completeness: track distinct (dayOfWeek, mealType) combos that have ≥1 item
  const planSlots: Record<string, Set<string>> = {};

  for (const row of mealsWithItems) {
    const pid = row.dietPlanId;
    if (!planCalories[pid]) planCalories[pid] = 0;
    if (!planSlots[pid]) planSlots[pid] = new Set();

    if (row.itemId && row.quantity) {
      const qGrams = row.altMeasureServingWeight
        ? toNumber(row.quantity) * toNumber(row.altMeasureServingWeight)
        : toNumber(row.quantity);
      planCalories[pid] += (toNumber(row.foodCalories) / 100) * qGrams;
      planSlots[pid].add(`${row.dayOfWeek}-${row.mealType}`);
    }
  }

  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    status: plan.status as 'active' | 'draft' | 'archived',
    targetCalories: plan.targetCalories ? toNumber(plan.targetCalories) : null,
    targetProtein: plan.targetProtein ? toNumber(plan.targetProtein) : null,
    targetCarbs: plan.targetCarbs ? toNumber(plan.targetCarbs) : null,
    targetFat: plan.targetFat ? toNumber(plan.targetFat) : null,
    startDate: plan.startDate.toISOString(),
    endDate: plan.endDate ? plan.endDate.toISOString() : null,
    avgDailyCalories: Math.round((planCalories[plan.id] ?? 0) / 7),
    completeness: planSlots[plan.id]
      ? Math.min(100, Math.round((planSlots[plan.id].size / 28) * 100))
      : 0,
  }));
}

export async function getMealsForPlan(dietPlanId: string, userId: string): Promise<DietPlanMealDTO[]> {
  // Verify ownership
  const plan = await db.query.dietPlans.findFirst({
    where: and(eq(dietPlans.id, dietPlanId), eq(dietPlans.clientId, userId)),
  });
  if (!plan) return [];

  const selectedMeasure = alias(foodAltMeasures, 'selected_measure');
  const allMeasures = alias(foodAltMeasures, 'all_measures');

  const rows = await db
    .select({
      mealId: dietPlanMeals.id,
      dietPlanId: dietPlanMeals.dietPlanId,
      mealType: dietPlanMeals.mealType,
      dayOfWeek: dietPlanMeals.dayOfWeek,
      itemId: dietPlanMealItems.id,
      quantity: dietPlanMealItems.quantity,
      dishGroupId: dietPlanMealItems.dishGroupId,
      dishNameSnapshot: dietPlanMealItems.dishNameSnapshot,
      dishSourceId: dietPlanMealItems.dishSourceId,
      foodId: foods.id,
      foodName: foods.name,
      brandName: foods.brandName,
      foodCalories: foods.calories,
      foodProtein: foods.protein,
      foodCarbs: foods.carbs,
      foodFat: foods.fat,
      thumbnail: foodPhotos.thumb,
      altMeasureId: selectedMeasure.id,
      altMeasureMeasure: selectedMeasure.measure,
      altMeasureServingWeight: selectedMeasure.servingWeight,
      altMeasureQty: selectedMeasure.qty,
      measureId: allMeasures.id,
      measureFoodId: allMeasures.foodId,
      measureLabel: allMeasures.measure,
      measureQty: allMeasures.qty,
      measureServingWeight: allMeasures.servingWeight,
    })
    .from(dietPlanMeals)
    .leftJoin(dietPlanMealItems, eq(dietPlanMealItems.groupId, dietPlanMeals.id))
    .leftJoin(foods, eq(dietPlanMealItems.foodId, foods.id))
    .leftJoin(foodPhotos, eq(dietPlanMealItems.foodId, foodPhotos.foodId))
    .leftJoin(selectedMeasure, eq(dietPlanMealItems.altMeasureId, selectedMeasure.id))
    .leftJoin(allMeasures, eq(foods.id, allMeasures.foodId))
    .where(eq(dietPlanMeals.dietPlanId, dietPlanId));

  // Build measures map from joined rows
  const measuresByFoodId = new Map<string, FoodMeasureDTO[]>();
  for (const row of rows) {
    if (!row.measureId || !row.measureFoodId) continue;
    if (!measuresByFoodId.has(row.measureFoodId)) measuresByFoodId.set(row.measureFoodId, []);
    const existing = measuresByFoodId.get(row.measureFoodId)!;
    if (!existing.some((m) => m.id === row.measureId)) {
      existing.push({
        id: row.measureId,
        label: row.measureLabel!,
        weightGrams: toNumber(row.measureServingWeight),
        defaultQty: toNumber(row.measureQty),
      });
    }
  }

  // Group rows into meal DTOs — track seen itemIds to avoid duplicates from the allMeasures join
  const mealsMap = new Map<string, DietPlanMealDTO>();
  const seenItemIds = new Set<string>();

  for (const row of rows) {
    if (!mealsMap.has(row.mealId)) {
      mealsMap.set(row.mealId, {
        id: row.mealId,
        dietPlanId: row.dietPlanId,
        mealType: row.mealType,
        dayOfWeek: row.dayOfWeek,
        items: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      });
    }

    if (row.itemId && row.foodId && !seenItemIds.has(row.itemId)) {
      seenItemIds.add(row.itemId);

      const qGrams = row.altMeasureServingWeight
        ? toNumber(row.quantity) * toNumber(row.altMeasureServingWeight)
        : toNumber(row.quantity);

      const macros = calculateItemMacros(
        { calories: row.foodCalories, protein: row.foodProtein, carbs: row.foodCarbs, fat: row.foodFat },
        qGrams,
      );

      const altMeasureLabel = row.altMeasureId
        ? `${toNumber(row.altMeasureQty)} ${row.altMeasureMeasure} (${Math.round(toNumber(row.altMeasureServingWeight))}g)`
        : null;

      const meal = mealsMap.get(row.mealId)!;
      meal.items.push({
        id: row.itemId,
        foodId: row.foodId,
        foodName: row.foodName!,
        brandName: row.brandName,
        thumbnail: row.thumbnail ?? null,
        altMeasureId: row.altMeasureId ?? null,
        altMeasureLabel,
        quantity: toNumber(row.quantity),
        ...macros,
        caloriesPer100g: toNumber(row.foodCalories),
        proteinPer100g: toNumber(row.foodProtein),
        carbsPer100g: toNumber(row.foodCarbs),
        fatPer100g: toNumber(row.foodFat),
        foodMeasures: measuresByFoodId.get(row.foodId) ?? [],
        dishGroupId: row.dishGroupId ?? null,
        dishNameSnapshot: row.dishNameSnapshot ?? null,
        dishSourceId: row.dishSourceId ?? null,
      });

      meal.totalCalories = Math.round((meal.totalCalories + macros.calories) * 10) / 10;
      meal.totalProtein = Math.round((meal.totalProtein + macros.protein) * 10) / 10;
      meal.totalCarbs = Math.round((meal.totalCarbs + macros.carbs) * 10) / 10;
      meal.totalFat = Math.round((meal.totalFat + macros.fat) * 10) / 10;
    }
  }

  return Array.from(mealsMap.values()).sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.mealType.localeCompare(b.mealType);
  });
}

export async function getUserNutritionGoalDefaults(userId: string): Promise<NutritionGoalDefaults> {
  const goal = await db.query.nutritionGoals.findFirst({
    where: and(eq(nutritionGoals.userId, userId), eq(nutritionGoals.isActive, true)),
    orderBy: (t, { desc }) => [desc(t.startDate)],
  });

  return {
    targetCalories: goal?.targetCalories ? toNumber(goal.targetCalories) : null,
    targetProtein: goal?.targetProtein ? toNumber(goal.targetProtein) : null,
    targetCarbs: goal?.targetCarbs ? toNumber(goal.targetCarbs) : null,
    targetFat: goal?.targetFat ? toNumber(goal.targetFat) : null,
  };
}

export async function archiveActivePlans(userId: string, dbInstance = db): Promise<void> {
  await dbInstance
    .update(dietPlans)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(and(eq(dietPlans.clientId, userId), eq(dietPlans.status, 'active')));
}

export async function copyDay(
  dietPlanId: string,
  fromDay: number,
  toDay: number,
  userId: string,
  dbInstance = db,
): Promise<DietPlanMealDTO[]> {
  // Verify ownership
  const plan = await dbInstance.query.dietPlans.findFirst({
    where: and(eq(dietPlans.id, dietPlanId), eq(dietPlans.clientId, userId)),
  });
  if (!plan) throw new Error('Plan not found');

  // Load source meals (fromDay)
  const sourceMeals = await dbInstance
    .select({ id: dietPlanMeals.id, mealType: dietPlanMeals.mealType })
    .from(dietPlanMeals)
    .where(and(eq(dietPlanMeals.dietPlanId, dietPlanId), eq(dietPlanMeals.dayOfWeek, fromDay)));

  if (sourceMeals.length === 0) return [];

  const sourceMealIds = sourceMeals.map((m) => m.id);

  // Load source items
  const sourceItems = await dbInstance
    .select()
    .from(dietPlanMealItems)
    .where(inArray(dietPlanMealItems.groupId, sourceMealIds));

  // Delete existing meals on toDay
  const existingToMeals = await dbInstance
    .select({ id: dietPlanMeals.id })
    .from(dietPlanMeals)
    .where(and(eq(dietPlanMeals.dietPlanId, dietPlanId), eq(dietPlanMeals.dayOfWeek, toDay)));

  if (existingToMeals.length > 0) {
    await dbInstance
      .delete(dietPlanMeals)
      .where(inArray(dietPlanMeals.id, existingToMeals.map((m) => m.id)));
  }

  // Create new meals on toDay
  const newMeals = await dbInstance
    .insert(dietPlanMeals)
    .values(
      sourceMeals.map((m) => ({
        dietPlanId,
        mealType: m.mealType,
        dayOfWeek: toDay,
      })),
    )
    .returning();

  // Map old meal id → new meal id
  const mealIdMap: Record<string, string> = {};
  sourceMeals.forEach((src, i) => {
    mealIdMap[src.id] = newMeals[i].id;
  });

  // Create new items — re-map dish group IDs so each day has independent groups
  if (sourceItems.length > 0) {
    const dishGroupIdMap = new Map<string, string>();
    await dbInstance
      .insert(dietPlanMealItems)
      .values(
        sourceItems.map((item) => {
          let newDishGroupId: string | null = null;
          if (item.dishGroupId) {
            if (!dishGroupIdMap.has(item.dishGroupId)) {
              dishGroupIdMap.set(item.dishGroupId, uuidv7());
            }
            newDishGroupId = dishGroupIdMap.get(item.dishGroupId)!;
          }
          return {
            groupId: mealIdMap[item.groupId],
            foodId: item.foodId,
            altMeasureId: item.altMeasureId,
            quantity: item.quantity,
            dishGroupId: newDishGroupId,
            dishNameSnapshot: item.dishNameSnapshot,
            dishSourceId: item.dishSourceId,
          };
        }),
      );
  }

  return getMealsForPlan(dietPlanId, userId);
}
