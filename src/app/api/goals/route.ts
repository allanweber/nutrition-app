import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/session';

// Get user's nutrition goals
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Default goals if not set
    const defaultGoals = {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65,
      fiber: 25,
      sodium: 2300,
    };

    const userData = await db
      .select({
        nutritionGoals: users.nutritionGoals,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    // JSONB columns are automatically parsed by Drizzle, no need to JSON.parse
    const storedGoals = userData[0]?.nutritionGoals;
    const goals = storedGoals && typeof storedGoals === 'object' 
      ? { ...defaultGoals, ...storedGoals }
      : defaultGoals;

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Goals GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// Update user's nutrition goals
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goals } = await request.json();

    if (!goals || typeof goals !== 'object') {
      return NextResponse.json(
        { error: 'Goals object is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sodium'];
    const missingFields = requiredFields.filter(field => 
      goals[field] === undefined || goals[field] === null || goals[field] < 0
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing or invalid fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Update user goals - store as JSONB object directly (Drizzle handles serialization)
    await db
      .update(users)
      .set({ nutritionGoals: goals })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true, goals });
  } catch (error) {
    console.error('Goals PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update goals' },
      { status: 500 }
    );
  }
}