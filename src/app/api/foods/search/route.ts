import { NextRequest, NextResponse } from 'next/server';
import { nutritionixAPI } from '@/lib/nutritionix';
import { searchQuerySchema, validateApiInput } from '@/lib/api-validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParam = searchParams.get('q');

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

    const isConfigured = await nutritionixAPI.isConfigured();
    if (!isConfigured) {
      return NextResponse.json(
        { error: 'Nutritionix API not configured' },
        { status: 500 }
      );
    }

    const results = await nutritionixAPI.searchFoods(query);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Food search error:', error);
    return NextResponse.json(
      { error: 'Failed to search foods' },
      { status: 500 }
    );
  }
}