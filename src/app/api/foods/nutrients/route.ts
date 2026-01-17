import { NextRequest, NextResponse } from 'next/server';
import { nutritionixAPI } from '@/lib/nutritionix';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const isConfigured = await nutritionixAPI.isConfigured();
    if (!isConfigured) {
      return NextResponse.json(
        { error: 'Nutritionix API not configured' },
        { status: 500 }
      );
    }

    const results = await nutritionixAPI.getNaturalNutrients(query);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Natural nutrients error:', error);
    return NextResponse.json(
      { error: 'Failed to get nutrition information' },
      { status: 500 }
    );
  }
}