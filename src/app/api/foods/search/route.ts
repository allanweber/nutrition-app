import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateApiInput } from '@/lib/api-validation';
import { getSession } from '@/lib/session';
import { foodSearchService } from '@/server/services/food-search.service';

const searchQuerySchema = z
  .string()
  .min(3, 'Search query must be at least 3 characters long')
  .max(100, 'Search query must be at most 100 characters long')
  .transform((s) => s.trim());

const pageSchema = z
  .string()
  .optional()
  .transform((val) => {
    const n = val ? parseInt(val, 10) : 1;
    return Number.isFinite(n) && n >= 1 ? n : 1;
  });

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.', field: null },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const pageParam = searchParams.get('page') ?? undefined;

  if (!q) {
    return NextResponse.json(
      { success: false, error: 'Query parameter q is required.', field: 'q' },
      { status: 400 },
    );
  }

  const queryValidation = validateApiInput(searchQuerySchema, q, 'q');
  if (!queryValidation.success) {
    return NextResponse.json(
      {
        success: false,
        error: queryValidation.error,
        field: queryValidation.field ?? null,
      },
      { status: 400 },
    );
  }

  const page = pageSchema.parse(pageParam);

  try {
    const { results, pagination } = await foodSearchService.search(
      queryValidation.data,
      page,
    );
    return NextResponse.json({ results, pagination });
  } catch (error) {
    console.error('Food search error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          'Food search is temporarily unavailable. Please try again shortly.',
        field: null,
      },
      { status: 500 },
    );
  }
}
