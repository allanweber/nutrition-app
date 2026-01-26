import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
    createValidationErrorResponse,
    validateRequestBody,
} from '@/lib/api-validation';
import { auth } from '@/lib/auth';
import { hashCode, isExpired, minutesFromNow } from '@/lib/auth-codes';
import { db } from '@/server/db';
import { emailVerificationChallenges, users } from '@/server/db/schema';
import { logSecurityEvent } from '@/server/security-events';

const bodySchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
});

const FAILED_WINDOW_MS = 15 * 60_000;
const MAX_FAILED_PER_WINDOW = 5;

function getRequestIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || null;
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const email = session.user.email;

    const validation = await validateRequestBody(request, bodySchema);
    if (!validation.success) {
      return validation.response;
    }

    const now = new Date();

    const challenge = await db.query.emailVerificationChallenges.findFirst({
      where: eq(emailVerificationChallenges.userId, userId),
    });

    if (!challenge) {
      return createValidationErrorResponse(
        'Invalid or expired code.',
        'code',
        400,
      );
    }

    if (challenge.lockedUntil && challenge.lockedUntil > now) {
      return createValidationErrorResponse(
        'Too many attempts. Try again in 15 minutes.',
        'code',
        400,
      );
    }

    if (isExpired(challenge.expiresAt)) {
      return createValidationErrorResponse(
        'Invalid or expired code.',
        'code',
        400,
      );
    }

    const providedHash = hashCode(validation.data.code);
    if (providedHash !== challenge.codeHash) {
      const windowStart = challenge.failedCountWindowStart;
      const windowExpired =
        now.getTime() - windowStart.getTime() >= FAILED_WINDOW_MS;
      const failedCount = windowExpired ? 0 : challenge.failedCountWindow;
      const newFailedCount = failedCount + 1;

      const lockedUntil =
        newFailedCount >= MAX_FAILED_PER_WINDOW ? minutesFromNow(15) : null;

      await db
        .update(emailVerificationChallenges)
        .set({
          failedCountWindow: newFailedCount,
          failedCountWindowStart: windowExpired ? now : windowStart,
          lockedUntil,
          updatedAt: now,
        })
        .where(
          and(
            eq(emailVerificationChallenges.userId, userId),
            eq(emailVerificationChallenges.id, challenge.id),
          ),
        );

      await logSecurityEvent({
        type: 'email_verification_failed',
        userId,
        email,
        ip: getRequestIp(request),
        userAgent: request.headers.get('user-agent'),
        metadata: {
          reason: 'invalid_code',
          failedCountWindow: newFailedCount,
        },
      });

      return createValidationErrorResponse(
        'Invalid or expired code.',
        'code',
        400,
      );
    }

    await db
      .update(users)
      .set({ emailVerified: true, updatedAt: now })
      .where(eq(users.id, userId));

    await db
      .delete(emailVerificationChallenges)
      .where(eq(emailVerificationChallenges.userId, userId));

    await logSecurityEvent({
      type: 'email_verified',
      userId,
      email,
      ip: getRequestIp(request),
      userAgent: request.headers.get('user-agent'),
      metadata: {
        verifiedAt: now.toISOString(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('verify-email-code error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify code' },
      { status: 500 },
    );
  }
}
