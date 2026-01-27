import { NextRequest, NextResponse } from 'next/server';
import { searchByBarcode } from '@/lib/nutrition-sources/aggregator';
import { validateApiInput } from '@/lib/api-validation';
import { z } from 'zod';

const upcSchema = z
  .string()
  .min(6, 'UPC is too short')
  .max(32, 'UPC is too long')
  .regex(/^[0-9]+$/, 'UPC must be numeric');

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

    const upcValidation = validateApiInput(upcSchema, upc, 'upc');
    if (!upcValidation.success) {
      return NextResponse.json({ error: upcValidation.error }, { status: 400 });
    }

    const results = await searchByBarcode(upcValidation.data);

    if (!results.foods.length) {
      return NextResponse.json(
        { error: 'Product not found', results },
        { status: 404 },
      );
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('UPC lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup food by UPC' },
      { status: 500 }
    );
  }
}