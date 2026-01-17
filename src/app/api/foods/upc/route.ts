import { NextRequest, NextResponse } from 'next/server';
import { nutritionixAPI } from '@/lib/nutritionix';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const upc = searchParams.get('upc');

    if (!upc) {
      return NextResponse.json(
        { error: 'UPC parameter is required' },
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

    const results = await nutritionixAPI.getFoodByUPC(upc);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('UPC lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup food by UPC' },
      { status: 500 }
    );
  }
}