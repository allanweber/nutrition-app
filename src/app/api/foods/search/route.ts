import { NextRequest, NextResponse } from 'next/server';
import { searchAllSources } from '@/lib/nutrition-sources/aggregator';
import { searchQuerySchema, validateApiInput } from '@/lib/api-validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParam = searchParams.get('q');
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');

    if (!queryParam) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Validate search query
    const queryValidation = validateApiInput(searchQuerySchema, queryParam, 'query');
    if (!queryValidation.success) {
      return NextResponse.json(
        { error: queryValidation.error },
        { status: 400 }
      );
    }

    const query = queryValidation.data;

    const page = pageParam ? Number(pageParam) : 0;
    const pageSize = pageSizeParam ? Number(pageSizeParam) : 25;

    const safePage = Number.isFinite(page) && page >= 0 ? Math.floor(page) : 0;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 50) : 25;

    const results = await searchAllSources(query, { page: safePage, pageSize: safePageSize });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Food search error:', error);
    return NextResponse.json(
      { error: 'Failed to search foods' },
      { status: 500 }
    );
  }
}