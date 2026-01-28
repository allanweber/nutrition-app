import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateApiInput } from '@/lib/api-validation';
import { getFoodImageUrlForFoodUrl } from '@/lib/nutrition-sources/food-image';

export const runtime = 'nodejs';

const foodUrlSchema = z.string().url();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get('food_url') ?? searchParams.get('foodUrl');

    if (!raw) {
      return NextResponse.json(
        { error: 'food_url parameter is required' },
        { status: 400 },
      );
    }

    const validation = validateApiInput(foodUrlSchema, raw, 'food_url');
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const imageUrl = await getFoodImageUrlForFoodUrl(validation.data);

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';

    // Avoid leaking internals but keep the reason when it's a safe validation-type failure.
    if (message === 'Unsupported foodUrl host') {
      return NextResponse.json(
        { error: 'Unsupported food_url host' },
        { status: 400 },
      );
    }

    console.error('Food image scrape error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch food image' },
      { status: 500 },
    );
  }
}
