import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { foods, foodPhotos, foodAltMeasures } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { validateRequestBody } from '@/lib/api-validation';

function toNum(v: string | null | undefined): number | null {
  if (v == null) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// GET /api/foods/custom/[foodId] — get custom food detail for edit form
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ foodId: string }> }
) {
  const { foodId } = await params;
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
    })
    .from(foods)
    .leftJoin(foodPhotos, eq(foodPhotos.foodId, foods.id))
    .where(and(eq(foods.id, foodId), eq(foods.userId, user.id)));

  if (rows.length === 0) return NextResponse.json({ error: 'Food not found' }, { status: 404 });

  const r = rows[0];
  return NextResponse.json({
    food: {
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
      fiber: r.fiber ? toNum(r.fiber) : null,
      sugar: r.sugar ? toNum(r.sugar) : null,
      sodium: r.sodium ? toNum(r.sodium) : null,
      images: r.thumb ? { thumb: r.thumb } : null,
    },
  });
}

const updateCustomFoodSchema = z.object({
  name: z.string().min(1).max(500).transform((s) => s.trim()).optional(),
  brandName: z.string().max(500).nullable().optional(),
  servingQty: z.number().positive().optional(),
  servingUnit: z.string().max(100).optional(),
  servingWeightGrams: z.number().positive().optional(),
  calories: z.number().min(0).max(100000).optional(),
  protein: z.number().min(0).max(100000).optional(),
  carbs: z.number().min(0).max(100000).optional(),
  fat: z.number().min(0).max(100000).optional(),
  fiber: z.number().min(0).max(100000).optional(),
  sugar: z.number().min(0).max(100000).optional(),
  sodium: z.number().min(0).max(1000000).optional(),
});

// PATCH /api/foods/custom/[foodId] — update custom food (ownership check)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ foodId: string }> }
) {
  const { foodId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const food = await db.query.foods.findFirst({
    where: and(eq(foods.id, foodId), eq(foods.userId, user.id)),
  });
  if (!food) return NextResponse.json({ error: 'Food not found' }, { status: 404 });

  const validation = await validateRequestBody(request, updateCustomFoodSchema);
  if (!validation.success) return validation.response;

  const data = validation.data;
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (data.name !== undefined) updates.name = data.name;
  if (data.brandName !== undefined) updates.brandName = data.brandName;
  if (data.servingQty !== undefined) updates.servingQty = data.servingQty.toString();
  if (data.servingUnit !== undefined) updates.servingUnit = data.servingUnit;
  if (data.servingWeightGrams !== undefined) updates.servingWeightGrams = data.servingWeightGrams.toString();
  if (data.calories !== undefined) updates.calories = data.calories.toString();
  if (data.protein !== undefined) updates.protein = data.protein.toString();
  if (data.carbs !== undefined) updates.carbs = data.carbs.toString();
  if (data.fat !== undefined) updates.fat = data.fat.toString();
  if (data.fiber !== undefined) updates.fiber = data.fiber.toString();
  if (data.sugar !== undefined) updates.sugar = data.sugar.toString();
  if (data.sodium !== undefined) updates.sodium = data.sodium.toString();

  await db.update(foods).set(updates).where(eq(foods.id, foodId));

  // Re-sync alt measure if any serving field changed
  const servingChanged =
    data.servingWeightGrams !== undefined ||
    data.servingUnit !== undefined ||
    data.servingQty !== undefined;
  if (servingChanged) {
    // Fetch latest food record to get current serving values
    const updated = await db.query.foods.findFirst({ where: eq(foods.id, foodId) });
    await db.delete(foodAltMeasures).where(eq(foodAltMeasures.foodId, foodId));
    if (updated?.servingWeightGrams && updated?.servingUnit) {
      const qty = updated.servingQty ? parseFloat(updated.servingQty) : 1;
      const label = qty !== 1 ? `${qty} ${updated.servingUnit}` : updated.servingUnit;
      await db.insert(foodAltMeasures).values({
        foodId,
        measure: label,
        servingWeight: updated.servingWeightGrams,
        qty: qty.toString(),
        seq: 1,
      });
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/foods/custom/[foodId] — delete custom food (ownership check)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ foodId: string }> }
) {
  const { foodId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const food = await db.query.foods.findFirst({
    where: and(eq(foods.id, foodId), eq(foods.userId, user.id)),
  });
  if (!food) return NextResponse.json({ error: 'Food not found' }, { status: 404 });

  await db.delete(foods).where(eq(foods.id, foodId));

  return NextResponse.json({ success: true });
}
