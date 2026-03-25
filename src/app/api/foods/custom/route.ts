import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { foods, foodPhotos } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { validateRequestBody } from '@/lib/api-validation';

function toNum(v: string | number | null | undefined) {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
}

const createCustomFoodSchema = z.object({
  name: z.string().min(1).max(500).transform((s) => s.trim()),
  brandName: z.string().max(500).nullable().optional(),
  servingQty: z.number().positive().optional(),
  servingUnit: z.string().max(100).optional(),
  servingWeightGrams: z.number().positive().optional(),
  calories: z.number().min(0).max(100000),
  protein: z.number().min(0).max(100000),
  carbs: z.number().min(0).max(100000),
  fat: z.number().min(0).max(100000),
  fiber: z.number().min(0).max(100000).optional(),
  sugar: z.number().min(0).max(100000).optional(),
  sodium: z.number().min(0).max(1000000).optional(),
});

// GET /api/foods/custom — list user's custom foods
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select({
      id: foods.id,
      name: foods.name,
      brandName: foods.brandName,
      servingQty: foods.servingQty,
      servingUnit: foods.servingUnit,
      servingWeightGrams: foods.servingWeightGrams,
      calories: foods.calories,
      protein: foods.protein,
      carbs: foods.carbs,
      fat: foods.fat,
      fiber: foods.fiber,
      sugar: foods.sugar,
      sodium: foods.sodium,
      thumb: foodPhotos.thumb,
      createdAt: foods.createdAt,
    })
    .from(foods)
    .leftJoin(foodPhotos, eq(foodPhotos.foodId, foods.id))
    .where(eq(foods.userId, user.id))
    .orderBy(desc(foods.createdAt));

  const result = rows.map((r) => ({
    id: r.id,
    name: r.name,
    brandName: r.brandName ?? null,
    servingQty: r.servingQty ? toNum(r.servingQty) : null,
    servingUnit: r.servingUnit ?? null,
    servingWeightGrams: r.servingWeightGrams ? toNum(r.servingWeightGrams) : null,
    calories: toNum(r.calories),
    protein: toNum(r.protein),
    carbs: toNum(r.carbs),
    fat: toNum(r.fat),
    fiber: toNum(r.fiber),
    sugar: toNum(r.sugar),
    sodium: toNum(r.sodium),
    thumbnail: r.thumb ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ foods: result });
}

// POST /api/foods/custom — create custom food
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const validation = await validateRequestBody(request, createCustomFoodSchema);
  if (!validation.success) return validation.response;

  const data = validation.data;

  const [food] = await db
    .insert(foods)
    .values({
      userId: user.id,
      source: 'user_custom',
      name: data.name,
      brandName: data.brandName ?? null,
      servingQty: data.servingQty?.toString(),
      servingUnit: data.servingUnit,
      servingWeightGrams: data.servingWeightGrams?.toString(),
      calories: data.calories.toString(),
      protein: data.protein.toString(),
      carbs: data.carbs.toString(),
      fat: data.fat.toString(),
      fiber: data.fiber?.toString(),
      sugar: data.sugar?.toString(),
      sodium: data.sodium?.toString(),
    })
    .returning();

  return NextResponse.json({ success: true, food: { id: food.id, name: food.name } }, { status: 201 });
}
