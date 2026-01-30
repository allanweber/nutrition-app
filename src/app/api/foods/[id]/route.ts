import { NextRequest, NextResponse } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'

import type { NutritionSourceFood } from '@/lib/nutrition-sources/types'
import { fetchFatSecretFoodDetails, fatSecretSource } from '@/lib/nutrition-sources/fatsecret'
import { getFoodImageUrlForFoodUrl } from '@/lib/nutrition-sources/food-image'
import { db } from '@/server/db'
import { foods } from '@/server/db/schema'

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return 0
}

function normalizeDbSource(source: string): NutritionSourceFood['source'] {
  if (source === 'usda' || source === 'fatsecret' || source === 'database') return source
  return 'database'
}

type FoodPhotoRow = { thumb: string | null; highres: string | null }
type FoodAltMeasureRow = { servingWeight: unknown; measure: string; qty: unknown; seq: number | null }

type FoodRow = {
  id: number
  sourceId: string | null
  source: string
  name: string
  brandName: string | null
  isCustom: boolean | null
  servingQty: unknown
  servingUnit: string | null
  servingWeightGrams: unknown | null
  calories: unknown
  protein: unknown
  carbs: unknown
  fat: unknown
  fiber: unknown | null
  sugar: unknown | null
  sodium: unknown | null
  fullNutrients: unknown | null
  isRaw: boolean | null
  photo: FoodPhotoRow | null
  altMeasures: FoodAltMeasureRow[]
}

function asFullNutrients(value: unknown): Array<{ attr_id: number; value: number }> | undefined {
  if (!Array.isArray(value)) return undefined

  const nutrients: Array<{ attr_id: number; value: number }> = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    const attrId = asNumber(record.attr_id)
    const nutrientValue = asNumber(record.value)
    if (!Number.isFinite(attrId) || attrId <= 0) continue
    if (!Number.isFinite(nutrientValue)) continue
    nutrients.push({ attr_id: Math.round(attrId), value: nutrientValue })
  }

  return nutrients.length > 0 ? nutrients : undefined
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
  }
}

function parseDbId(id: string): number | null {
  const trimmed = id.trim()
  const withPrefix = trimmed.startsWith('db-') ? trimmed.slice(3) : trimmed.startsWith('db:') ? trimmed.slice(3) : null
  const candidate = withPrefix ?? trimmed
  if (candidate.trim() === '') return null
  const num = Number(candidate)
  if (!Number.isFinite(num)) return null
  return Math.floor(num)
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const rawId = (resolvedParams?.id ?? '').trim()
    if (rawId.length === 0) {
      return NextResponse.json({ error: 'Food id is required' }, { status: 400 })
    }

    const usingMockSources = process.env.USE_MOCK_NUTRITION_SOURCES === 'true'

    // If explicitly prefixed, interpret as database id.
    if (rawId.startsWith('db-') || rawId.startsWith('db:')) {
      const dbId = parseDbId(rawId)
      if (dbId == null) {
        return NextResponse.json({ error: 'Invalid food id' }, { status: 400 })
      }

      const row = await db.query.foods.findFirst({
        where: eq(foods.id, dbId),
        with: {
          photo: true,
          altMeasures: {
            orderBy: (altMeasures) => asc(altMeasures.seq),
          },
        },
      })

      if (!row) {
        return NextResponse.json({ error: 'Food not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, food: toNutritionSourceFood(row as unknown as FoodRow) })
    }

    // Otherwise, treat as FatSecret id first (as requested).
    const fatSecretId = rawId

    const rowBySource = await db.query.foods.findFirst({
      where: and(eq(foods.source, 'fatsecret'), eq(foods.sourceId, fatSecretId)),
      with: {
        photo: true,
        altMeasures: {
          orderBy: (altMeasures) => asc(altMeasures.seq),
        },
      },
    })

    if (rowBySource) {
      return NextResponse.json({ success: true, food: toNutritionSourceFood(rowBySource as unknown as FoodRow) })
    }

    if (!usingMockSources && fatSecretSource.isConfigured()) {
      try {
        const details = await fetchFatSecretFoodDetails(fatSecretId)

        const food = details.food
        const foodUrl = (food.foodUrl ?? '').trim()
        let imageUrl: string | null = null
        if (foodUrl) {
          imageUrl = await getFoodImageUrlForFoodUrl(foodUrl).catch(() => null)
        }

        const result: NutritionSourceFood = {
          ...food,
          source: 'fatsecret',
          sourceId: fatSecretId,
          altMeasures: details.altMeasures,
          photo: imageUrl
            ? {
                thumb: imageUrl,
                highres: imageUrl,
              }
            : food.photo ?? null,
        }

        return NextResponse.json({ success: true, food: result })
      } catch (error) {
        console.error('Failed to fetch FatSecret food details:', error)
        // Fall through to DB-id lookup.
      }
    }

    // Back-compat: if the id is numeric, attempt DB id lookup as a fallback.
    const dbIdFallback = parseDbId(rawId)
    if (dbIdFallback != null) {
      const rowById = await db.query.foods.findFirst({
        where: eq(foods.id, dbIdFallback),
        with: {
          photo: true,
          altMeasures: {
            orderBy: (altMeasures) => asc(altMeasures.seq),
          },
        },
      })

      if (rowById) {
        return NextResponse.json({ success: true, food: toNutritionSourceFood(rowById as unknown as FoodRow) })
      }
    }

    return NextResponse.json({ error: 'Food not found' }, { status: 404 })
  } catch (error) {
    console.error('Error fetching food by id:', error)
    return NextResponse.json({ error: 'Failed to fetch food' }, { status: 500 })
  }
}
