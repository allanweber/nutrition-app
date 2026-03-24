import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import db from '@/server/db';
import { foodPhotos, foods } from '@/server/db/schema';
import { and, eq, ilike, asc } from 'drizzle-orm';

const searchSchema = z.object({
  q: z.string().min(3, 'Query must be at least 3 characters').max(200).transform((s) => s.trim()),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const parsed = searchSchema.safeParse({
    q: searchParams.get('q'),
    offset: searchParams.get('offset') ?? '0',
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid query';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  const { q, offset } = parsed.data;

  try {
    const rows = await db
      .select({
        id: foods.id,
        name: foods.name,
        brandName: foods.brandName,
        calories: foods.calories,
        thumb: foodPhotos.thumb,
      })
      .from(foods)
      .leftJoin(foodPhotos, eq(foodPhotos.foodId, foods.id))
      .where(
        and(
          eq(foods.userId, session.user.id),
          ilike(foods.name, `%${q}%`),
        ),
      )
      .orderBy(asc(foods.name))
      .limit(10)
      .offset(offset);

    const results = rows.map((r) => ({
      id: r.id,
      name: r.name,
      brandName: r.brandName ?? null,
      thumbnail: r.thumb ?? null,
      calories: r.calories ? parseFloat(r.calories) : null,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
