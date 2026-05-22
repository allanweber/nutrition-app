import { cache } from 'react';
import { and, asc, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { HYDRATION_LOG_INCREMENT_ML } from '@/lib/nutrition-constants';
import {
  resolveWeeklySummaryRange,
  type WeeklySummaryPeriod,
} from '@/lib/weekly-summary-range';
import {
  foodLogItems,
  foodLogMeals,
  foods,
  hydrationLogs,
  nutritionGoals,
} from '@/server/db/schema';

// ─── DTO Types ────────────────────────────────────────────────────────────────

export interface DailySummaryDTO {
  date: string;
  caloriesConsumed: number;
  calorieGoal: number;
  caloriesBurned: number;
  netBalance: number;
  percentConsumed: number;
  remaining: number;
  protein: { consumed: number; goal: number };
  carbs: { consumed: number; goal: number };
  fat: { consumed: number; goal: number };
  hasGoal: boolean;
}

export interface HydrationLogDTO {
  date: string;
  totalMl: number;
  totalLiters: number;
  goalMl: number;
  percentConsumed: number;
  hasGoal: boolean;
}

export interface WeeklyDay {
  date: string;
  dayLabel: string;
  caloriesConsumed: number;
  calorieGoal: number;
  adherenceRatio: number;
  isCurrentDay: boolean;
  hasData: boolean;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WeeklySnapshotDTO {
  weekStart: string;
  days: WeeklyDay[];
}

export interface ScheduleEntry {
  id: string;
  name: string;
  time: string;
  timeGroup: 'morning' | 'midday' | 'evening';
  calories: number;
  iconType: 'meal' | 'snack';
  mealType: string;
}

export interface DailyScheduleDTO {
  morning: ScheduleEntry[];
  midday: ScheduleEntry[];
  evening: ScheduleEntry[];
}

export type { WeeklySummaryPeriod } from '@/lib/weekly-summary-range';
export { resolveWeeklySummaryRange } from '@/lib/weekly-summary-range';

export interface WeeklySummaryDTO {
  period: WeeklySummaryPeriod;
  periodStart: string;
  periodEnd: string;
  /** @deprecated Use periodStart — kept for compatibility */
  weekStart: string;
  calories: { consumed: number; goal: number };
  protein: { consumed: number; goal: number };
  carbs: { consumed: number; goal: number };
  fat: { consumed: number; goal: number };
  hasGoal: boolean;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_CALORIE_GOAL = 2000;
const DEFAULT_PROTEIN_GOAL = 150;
const DEFAULT_CARBS_GOAL = 250;
const DEFAULT_FAT_GOAL = 65;
const DEFAULT_HYDRATION_GOAL_ML = 2500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDayRange(date: string) {
  return {
    start: new Date(date + 'T00:00:00.000Z'),
    end: new Date(date + 'T23:59:59.999Z'),
  };
}

function toNum(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getTimeGroup(consumedAt: Date): 'morning' | 'midday' | 'evening' {
  const hour = consumedAt.getUTCHours();
  if (hour < 11) return 'morning';
  if (hour < 17) return 'midday';
  return 'evening';
}

function formatTime12h(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });
}

function getDayLabel(date: Date): string {
  const labels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return labels[date.getUTCDay()];
}

function getMealTypeLabel(mealType: string): string {
  const labels: Record<string, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
    morning_snack: 'Morning Snack',
    afternoon_snack: 'Afternoon Snack',
    evening_snack: 'Evening Snack',
    pre_workout: 'Pre-Workout',
    post_workout: 'Post-Workout',
    other: 'Other',
  };
  return labels[mealType] ?? mealType;
}

function getIconType(mealType: string): 'meal' | 'snack' {
  if (mealType.includes('snack')) return 'snack';
  return 'meal';
}

function toHydrationLogDTO(
  row: { date: string; totalMl: number },
  goalMl: number,
  hasGoal: boolean,
): HydrationLogDTO {
  const pct = goalMl > 0 ? (row.totalMl / goalMl) * 100 : 0;
  return {
    date: row.date,
    totalMl: row.totalMl,
    totalLiters: Math.round((row.totalMl / 1000) * 10) / 10,
    goalMl,
    percentConsumed: Math.min(Math.round(pct), 100),
    hasGoal,
  };
}

// ─── Service Functions ────────────────────────────────────────────────────────

export const getDailySummary = cache(async function getDailySummary(
  userId: string,
  date: string,
): Promise<DailySummaryDTO> {
  const { start, end } = getDayRange(date);

  // Fetch all food log items for the day (join foods for nutrition data)
  const items = await db
    .select({
      calories: foods.calories,
      protein: foods.protein,
      carbs: foods.carbs,
      fat: foods.fat,
      quantity: foodLogItems.quantity,
    })
    .from(foodLogItems)
    .innerJoin(foodLogMeals, eq(foodLogItems.mealId, foodLogMeals.id))
    .innerJoin(foods, eq(foodLogItems.foodId, foods.id))
    .where(
      and(
        eq(foodLogMeals.userId, userId),
        gte(foodLogMeals.consumedAt, start),
        lt(foodLogMeals.consumedAt, end),
      ),
    );

  // Aggregate totals — nutrients are per 100g, quantity is in grams
  const totals = items.reduce(
    (acc, item) => {
      const q = toNum(item.quantity);
      return {
        calories: acc.calories + (toNum(item.calories) / 100) * q,
        protein: acc.protein + (toNum(item.protein) / 100) * q,
        carbs: acc.carbs + (toNum(item.carbs) / 100) * q,
        fat: acc.fat + (toNum(item.fat) / 100) * q,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  // Fetch active nutrition goal
  const [goal] = await db
    .select({
      targetCalories: nutritionGoals.targetCalories,
      targetProtein: nutritionGoals.targetProtein,
      targetCarbs: nutritionGoals.targetCarbs,
      targetFat: nutritionGoals.targetFat,
    })
    .from(nutritionGoals)
    .where(
      and(eq(nutritionGoals.userId, userId), eq(nutritionGoals.isActive, true)),
    )
    .orderBy(desc(nutritionGoals.createdAt))
    .limit(1);

  const hasGoal = Boolean(goal);
  const calorieGoal = hasGoal
    ? Math.max(toNum(goal.targetCalories), DEFAULT_CALORIE_GOAL)
    : DEFAULT_CALORIE_GOAL;
  const proteinGoal = hasGoal
    ? toNum(goal.targetProtein) || DEFAULT_PROTEIN_GOAL
    : DEFAULT_PROTEIN_GOAL;
  const carbsGoal = hasGoal
    ? toNum(goal.targetCarbs) || DEFAULT_CARBS_GOAL
    : DEFAULT_CARBS_GOAL;
  const fatGoal = hasGoal
    ? toNum(goal.targetFat) || DEFAULT_FAT_GOAL
    : DEFAULT_FAT_GOAL;

  const caloriesConsumed = Math.round(totals.calories);
  const caloriesBurned = 0;
  const netBalance = caloriesConsumed - caloriesBurned;
  const percentConsumed =
    calorieGoal > 0 ? Math.round((caloriesConsumed / calorieGoal) * 100) : 0;

  return {
    date,
    caloriesConsumed,
    calorieGoal,
    caloriesBurned,
    netBalance,
    percentConsumed,
    remaining: calorieGoal - caloriesConsumed,
    protein: {
      consumed: Math.round(totals.protein * 10) / 10,
      goal: proteinGoal,
    },
    carbs: { consumed: Math.round(totals.carbs * 10) / 10, goal: carbsGoal },
    fat: { consumed: Math.round(totals.fat * 10) / 10, goal: fatGoal },
    hasGoal,
  };
});

export async function getHydrationLog(
  userId: string,
  date: string,
): Promise<HydrationLogDTO> {
  // Upsert: insert zero-row if none exists
  await db
    .insert(hydrationLogs)
    .values({ userId, date, totalMl: 0 })
    .onConflictDoNothing();

  const [row] = await db
    .select({
      date: hydrationLogs.date,
      totalMl: hydrationLogs.totalMl,
    })
    .from(hydrationLogs)
    .where(and(eq(hydrationLogs.userId, userId), eq(hydrationLogs.date, date)))
    .limit(1);

  const [goal] = await db
    .select({ targetHydrationMl: nutritionGoals.targetHydrationMl })
    .from(nutritionGoals)
    .where(
      and(eq(nutritionGoals.userId, userId), eq(nutritionGoals.isActive, true)),
    )
    .orderBy(desc(nutritionGoals.createdAt))
    .limit(1);

  const goalMl = goal?.targetHydrationMl ?? DEFAULT_HYDRATION_GOAL_ML;

  return toHydrationLogDTO(row, goalMl, Boolean(goal));
}

export async function addWater(
  userId: string,
  date: string,
): Promise<HydrationLogDTO> {
  const [updated] = await db
    .insert(hydrationLogs)
    .values({
      userId,
      date,
      totalMl: HYDRATION_LOG_INCREMENT_ML,
    })
    .onConflictDoUpdate({
      target: [hydrationLogs.userId, hydrationLogs.date],
      set: {
        totalMl: sql`${hydrationLogs.totalMl} + ${HYDRATION_LOG_INCREMENT_ML}`,
        updatedAt: sql`now()`,
      },
    })
    .returning({
      date: hydrationLogs.date,
      totalMl: hydrationLogs.totalMl,
    });

  const [goal] = await db
    .select({ targetHydrationMl: nutritionGoals.targetHydrationMl })
    .from(nutritionGoals)
    .where(
      and(eq(nutritionGoals.userId, userId), eq(nutritionGoals.isActive, true)),
    )
    .orderBy(desc(nutritionGoals.createdAt))
    .limit(1);

  const goalMl = goal?.targetHydrationMl ?? DEFAULT_HYDRATION_GOAL_ML;

  return toHydrationLogDTO(updated, goalMl, Boolean(goal));
}

export async function getWeeklySnapshot(
  userId: string,
): Promise<WeeklySnapshotDTO> {
  const today = new Date();
  const todayStr = formatISODate(today);

  // Monday of current week (UTC)
  const utcDay = today.getUTCDay(); // 0=Sun, 1=Mon…6=Sat
  const daysFromMonday = utcDay === 0 ? 6 : utcDay - 1;
  const mondayMs = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate() - daysFromMonday,
  );
  const mondayDate = new Date(mondayMs);
  const sundayDate = new Date(mondayMs + 6 * 24 * 60 * 60 * 1000);
  const weekStart = formatISODate(mondayDate);
  const weekEnd = new Date(sundayDate.getTime() + 24 * 60 * 60 * 1000); // exclusive upper bound (Monday of next week)

  // Get active calorie goal
  const [goal] = await db
    .select({ targetCalories: nutritionGoals.targetCalories })
    .from(nutritionGoals)
    .where(
      and(eq(nutritionGoals.userId, userId), eq(nutritionGoals.isActive, true)),
    )
    .orderBy(desc(nutritionGoals.createdAt))
    .limit(1);

  const calorieGoal = goal
    ? Math.max(toNum(goal.targetCalories), DEFAULT_CALORIE_GOAL)
    : DEFAULT_CALORIE_GOAL;

  // Get all calories and macros for the week (join foods for nutrition data)
  const weekItems = await db
    .select({
      consumedAt: foodLogMeals.consumedAt,
      calories: foods.calories,
      protein: foods.protein,
      carbs: foods.carbs,
      fat: foods.fat,
      quantity: foodLogItems.quantity,
    })
    .from(foodLogItems)
    .innerJoin(foodLogMeals, eq(foodLogItems.mealId, foodLogMeals.id))
    .innerJoin(foods, eq(foodLogItems.foodId, foods.id))
    .where(
      and(
        eq(foodLogMeals.userId, userId),
        gte(foodLogMeals.consumedAt, mondayDate),
        lt(foodLogMeals.consumedAt, weekEnd),
      ),
    );

  // Aggregate by date string — nutrients are per 100g, quantity is in grams
  type DayTotals = {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  const totalsByDate: Record<string, DayTotals> = {};
  for (const item of weekItems) {
    const dayStr = formatISODate(item.consumedAt);
    const q = toNum(item.quantity);
    const existing = totalsByDate[dayStr] ?? {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };
    totalsByDate[dayStr] = {
      calories: existing.calories + (toNum(item.calories) / 100) * q,
      protein: existing.protein + (toNum(item.protein) / 100) * q,
      carbs: existing.carbs + (toNum(item.carbs) / 100) * q,
      fat: existing.fat + (toNum(item.fat) / 100) * q,
    };
  }

  // Build 7-day array
  const days: WeeklyDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(mondayMs + i * 24 * 60 * 60 * 1000);
    const dayStr = formatISODate(dayDate);
    const totals = totalsByDate[dayStr];
    const caloriesConsumed = Math.round(totals?.calories ?? 0);
    const adherenceRatio = calorieGoal > 0 ? caloriesConsumed / calorieGoal : 0;

    days.push({
      date: dayStr,
      dayLabel: getDayLabel(dayDate),
      caloriesConsumed,
      calorieGoal,
      adherenceRatio: Math.round(adherenceRatio * 1000) / 1000,
      isCurrentDay: dayStr === todayStr,
      hasData: caloriesConsumed > 0,
      protein: Math.round((totals?.protein ?? 0) * 10) / 10,
      carbs: Math.round((totals?.carbs ?? 0) * 10) / 10,
      fat: Math.round((totals?.fat ?? 0) * 10) / 10,
    });
  }

  return { weekStart, days };
}

export async function getDailySchedule(
  userId: string,
  date: string,
): Promise<DailyScheduleDTO> {
  const { start, end } = getDayRange(date);

  // Get all meals for the day with their food items (join foods for name + nutrition)
  const rows = await db
    .select({
      mealId: foodLogMeals.id,
      mealType: foodLogMeals.mealType,
      consumedAt: foodLogMeals.consumedAt,
      foodName: foods.name,
      calories: foods.calories,
      quantity: foodLogItems.quantity,
      itemId: foodLogItems.id,
    })
    .from(foodLogMeals)
    .leftJoin(foodLogItems, eq(foodLogItems.mealId, foodLogMeals.id))
    .leftJoin(foods, eq(foodLogItems.foodId, foods.id))
    .where(
      and(
        eq(foodLogMeals.userId, userId),
        gte(foodLogMeals.consumedAt, start),
        lt(foodLogMeals.consumedAt, end),
      ),
    )
    .orderBy(asc(foodLogMeals.consumedAt), asc(foodLogItems.id));

  // Group rows by meal
  const mealsMap = new Map<
    string,
    {
      mealId: string;
      mealType: string;
      consumedAt: Date;
      firstName: string | null;
      calories: number;
    }
  >();

  for (const row of rows) {
    if (!mealsMap.has(row.mealId)) {
      mealsMap.set(row.mealId, {
        mealId: row.mealId,
        mealType: row.mealType,
        consumedAt: row.consumedAt,
        firstName: row.foodName ?? null,
        calories: 0,
      });
    }
    const meal = mealsMap.get(row.mealId)!;
    // nutrients are per 100g, quantity is in grams
    if (row.calories !== null && row.quantity !== null) {
      meal.calories += (toNum(row.calories) / 100) * toNum(row.quantity);
    }
    // Keep the first food name (already set on first insert)
  }

  const schedule: DailyScheduleDTO = { morning: [], midday: [], evening: [] };

  for (const meal of mealsMap.values()) {
    const timeGroup = getTimeGroup(meal.consumedAt);
    const entry: ScheduleEntry = {
      id: meal.mealId,
      name: meal.firstName ?? getMealTypeLabel(meal.mealType),
      time: formatTime12h(meal.consumedAt),
      timeGroup,
      calories: Math.round(meal.calories),
      iconType: getIconType(meal.mealType),
      mealType: meal.mealType,
    };
    schedule[timeGroup].push(entry);
  }

  return schedule;
}

export const getWeeklySummary = cache(async function getWeeklySummary(
  userId: string,
  period: WeeklySummaryPeriod = 'calendar_week',
): Promise<WeeklySummaryDTO> {
  const range = resolveWeeklySummaryRange(period);
  const { start: rangeStart, end: rangeEnd, periodStart, periodEnd } = range;

  // Fetch active nutrition goal
  const [goal] = await db
    .select({
      targetCalories: nutritionGoals.targetCalories,
      targetProtein: nutritionGoals.targetProtein,
      targetCarbs: nutritionGoals.targetCarbs,
      targetFat: nutritionGoals.targetFat,
    })
    .from(nutritionGoals)
    .where(
      and(eq(nutritionGoals.userId, userId), eq(nutritionGoals.isActive, true)),
    )
    .orderBy(desc(nutritionGoals.createdAt))
    .limit(1);

  const hasGoal = Boolean(goal);
  const dailyCalorieGoal = hasGoal
    ? Math.max(toNum(goal.targetCalories), DEFAULT_CALORIE_GOAL)
    : DEFAULT_CALORIE_GOAL;
  const dailyProteinGoal = hasGoal
    ? toNum(goal.targetProtein) || DEFAULT_PROTEIN_GOAL
    : DEFAULT_PROTEIN_GOAL;
  const dailyCarbsGoal = hasGoal
    ? toNum(goal.targetCarbs) || DEFAULT_CARBS_GOAL
    : DEFAULT_CARBS_GOAL;
  const dailyFatGoal = hasGoal
    ? toNum(goal.targetFat) || DEFAULT_FAT_GOAL
    : DEFAULT_FAT_GOAL;

  // Fetch all food log items for the period
  const items = await db
    .select({
      calories: foods.calories,
      protein: foods.protein,
      carbs: foods.carbs,
      fat: foods.fat,
      quantity: foodLogItems.quantity,
    })
    .from(foodLogItems)
    .innerJoin(foodLogMeals, eq(foodLogItems.mealId, foodLogMeals.id))
    .innerJoin(foods, eq(foodLogItems.foodId, foods.id))
    .where(
      and(
        eq(foodLogMeals.userId, userId),
        gte(foodLogMeals.consumedAt, rangeStart),
        lt(foodLogMeals.consumedAt, rangeEnd),
      ),
    );

  // Aggregate totals — nutrients are per 100g, quantity is in grams
  const totals = items.reduce(
    (acc, item) => {
      const q = toNum(item.quantity);
      return {
        calories: acc.calories + (toNum(item.calories) / 100) * q,
        protein: acc.protein + (toNum(item.protein) / 100) * q,
        carbs: acc.carbs + (toNum(item.carbs) / 100) * q,
        fat: acc.fat + (toNum(item.fat) / 100) * q,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return {
    period,
    periodStart,
    periodEnd,
    weekStart: periodStart,
    calories: {
      consumed: Math.round(totals.calories),
      goal: dailyCalorieGoal * 7,
    },
    protein: {
      consumed: Math.round(totals.protein * 10) / 10,
      goal: dailyProteinGoal * 7,
    },
    carbs: {
      consumed: Math.round(totals.carbs * 10) / 10,
      goal: dailyCarbsGoal * 7,
    },
    fat: {
      consumed: Math.round(totals.fat * 10) / 10,
      goal: dailyFatGoal * 7,
    },
    hasGoal,
  };
});
