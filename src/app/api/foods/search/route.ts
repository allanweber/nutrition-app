import { NextRequest, NextResponse } from 'next/server';
import { nutritionixAPI } from '@/lib/nutritionix';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

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