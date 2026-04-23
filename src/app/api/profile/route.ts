import { getCurrentUser } from '@/lib/session';
import { db } from '@/server/db';
import { userProfiles, users } from '@/server/db/schema';
import { validateApiInput, createValidationErrorResponse } from '@/lib/api-validation';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  gender: z.enum(['woman', 'man', 'non-binary', 'prefer-not-to-say']).optional().nullable(),
  preferredUnit: z.enum(['metric', 'imperial']).default('metric'),
  heightCm: z.number().min(50).max(300).optional().nullable(),
  weightKg: z.number().min(10).max(500).optional().nullable(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rows = await db
      .select({
        name: users.name,
        email: users.email,
        image: users.image,
        emailVerified: users.emailVerified,
        dateOfBirth: userProfiles.dateOfBirth,
        gender: userProfiles.gender,
        heightCm: userProfiles.heightCm,
        weightKg: userProfiles.weightKg,
        preferredUnit: userProfiles.preferredUnit,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(users.id, user.id))
      .limit(1);

    if (rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ profile: rows[0] });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validation = validateApiInput(updateProfileSchema, body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error, validation.field);
    }

    const { name, dateOfBirth, gender, preferredUnit, heightCm, weightKg } = validation.data;

    await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, user.id));

    await db
      .insert(userProfiles)
      .values({
        userId: user.id,
        dateOfBirth: dateOfBirth ?? null,
        gender: gender ?? null,
        preferredUnit,
        heightCm: heightCm ?? null,
        weightKg: weightKg ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          dateOfBirth: dateOfBirth ?? null,
          gender: gender ?? null,
          preferredUnit,
          heightCm: heightCm ?? null,
          weightKg: weightKg ?? null,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
