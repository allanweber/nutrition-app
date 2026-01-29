import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';

import { getCurrentUser } from '@/lib/session';
import { validateRequestBody, persistFoodSchema } from '@/lib/api-validation';
import { persistFood } from '@/lib/nutrition-sources/aggregator';
import type { NutritionSourceFood } from '@/lib/nutrition-sources/types';
import { db } from '@/server/db';
import { foods } from '@/server/db/schema';

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return 0;
}

function normalizeDbSource(source: string): NutritionSourceFood['source'] {
  if (source === 'usda' || source === 'fatsecret' || source === 'database') return source;
  return 'database';
}

type FoodPhotoRow = { thumb: string | null; highres: string | null };
type FoodAltMeasureRow = { servingWeight: unknown; measure: string; qty: unknown; seq: number | null };
type FoodRow = {
  id: number;
  sourceId: string | null;
  source: string;
  name: string;
  brandName: string | null;
  isCustom: boolean | null;
  servingQty: unknown;
  servingUnit: string | null;
  servingWeightGrams: unknown | null;
  calories: unknown;
  protein: unknown;
  carbs: unknown;
  fat: unknown;
  fiber: unknown | null;
  sugar: unknown | null;
  sodium: unknown | null;
  fullNutrients: unknown | null;
  isRaw: boolean | null;
  photo: FoodPhotoRow | null;
  altMeasures: FoodAltMeasureRow[];
};

function asFullNutrients(value: unknown): Array<{ attr_id: number; value: number }> | undefined {
  if (!Array.isArray(value)) return undefined;

  const nutrients: Array<{ attr_id: number; value: number }> = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    const attrId = asNumber(record.attr_id);
    const nutrientValue = asNumber(record.value);
    if (!Number.isFinite(attrId) || attrId <= 0) continue;
    if (!Number.isFinite(nutrientValue)) continue;
    nutrients.push({ attr_id: Math.round(attrId), value: nutrientValue });
  }

  return nutrients.length > 0 ? nutrients : undefined;
}

function toNutritionSourceFood(row: FoodRow): NutritionSourceFood {
  return {
    id: row.id,
    sourceId: row.sourceId ?? String(row.id),
    source: normalizeDbSource(row.source),
    name: row.name,
    brandName: row.brandName ?? null,
    isCustom: row.isCustom ?? false,
    servingQty: asNumber(row.servingQty),
    servingUnit: row.servingUnit ?? 'serving',
    servingWeightGrams: row.servingWeightGrams != null ? asNumber(row.servingWeightGrams) : undefined,
    calories: asNumber(row.calories),
    protein: asNumber(row.protein),
    carbs: asNumber(row.carbs),
    fat: asNumber(row.fat),
    fiber: row.fiber != null ? asNumber(row.fiber) : undefined,
    sugar: row.sugar != null ? asNumber(row.sugar) : undefined,
    sodium: row.sodium != null ? asNumber(row.sodium) : undefined,
    fullNutrients: row.fullNutrients != null ? asFullNutrients(row.fullNutrients) : undefined,
    isRaw: row.isRaw ?? false,
    photo: row.photo
      ? {
          thumb: row.photo.thumb ?? undefined,
          highres: row.photo.highres ?? undefined,
        }
      : null,
    altMeasures: Array.isArray(row.altMeasures)
      ? row.altMeasures
          .map((m) => ({
            servingWeight: asNumber(m.servingWeight),
            measure: m.measure,
            qty: asNumber(m.qty),
            seq: m.seq ?? undefined,
          }))
          .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
      : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const validation = await validateRequestBody(request, persistFoodSchema);
    if (!validation.success) {
      return validation.response;
    }

    const inputFood = validation.data.food;

    const persisted = await persistFood(inputFood);
    if (!persisted.id) {
      return NextResponse.json({ error: 'Failed to persist food' }, { status: 500 });
    }

    const row = await db.query.foods.findFirst({
      where: eq(foods.id, persisted.id),
      with: {
        photo: true,
        altMeasures: {
          orderBy: (altMeasures) => asc(altMeasures.seq),
        },
      },
    });

    if (!row) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      food: toNutritionSourceFood(row),
    });
  } catch (error) {
    console.error('Error persisting selected food:', error);
    return NextResponse.json({ error: 'Failed to persist food' }, { status: 500 });
  }
}
