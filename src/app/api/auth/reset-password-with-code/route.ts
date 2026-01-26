import { and, eq, gte, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
    createValidationErrorResponse,
    validateRequestBody,
} from '@/lib/api-validation';
import { auth } from '@/lib/auth';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_POLICY_MESSAGE,
  PASSWORD_POLICY_REGEX,
} from '@/lib/password-policy';
import { db } from '@/server/db';
import { securityEvents, users, verifications } from '@/server/db/schema';
import { logSecurityEvent } from '@/server/security-events';

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
  newPassword: z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    )
    .regex(PASSWORD_POLICY_REGEX, PASSWORD_POLICY_MESSAGE),
});

const FAILED_WINDOW_MS = 15 * 60_000;
const FAILED_MAX_PER_WINDOW = 5;

function getRequestIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || null;
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await validateRequestBody(request, requestSchema);
    if (!parsed.success) return parsed.response;

    const { email, code, newPassword } = parsed.data;
    const now = new Date();

    const failedWindowStart = new Date(now.getTime() - FAILED_WINDOW_MS);
    const [{ count: failedCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(securityEvents)
      .where(
        and(
          eq(securityEvents.type, 'password_reset_failed'),
          eq(securityEvents.email, email),
          gte(securityEvents.createdAt, failedWindowStart),
        ),
      );

    if (failedCount >= FAILED_MAX_PER_WINDOW) {
      return createValidationErrorResponse(
        'Too many attempts. Try again later.',
        undefined,
        400,
      );
    }

    const identifier = `reset-password:${code}`;
    const verification = await db.query.verifications.findFirst({
      where: eq(verifications.identifier, identifier),
    });

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    const isVerificationValid =
      Boolean(verification) &&
      verification!.expiresAt > now &&
      Boolean(user) &&
      user!.id === verification!.value;

    if (!isVerificationValid) {
      await logSecurityEvent({
        type: 'password_reset_failed',
        userId: user?.id ?? null,
        email,
        ip: getRequestIp(request),
        userAgent: request.headers.get('user-agent'),
        metadata: {
          reason: 'invalid_or_expired',
        },
      });

      return createValidationErrorResponse(
        'Invalid or expired code.',
        'code',
        400,
      );
    }

    // Delegate the actual reset + session revocation to Better Auth.
    await auth.api.resetPassword({
      headers: request.headers,
      body: {
        token: code,
        newPassword,
      },
    });

    // Best-effort: remove the code so it's single-use even if the auth layer changes.
    await db
      .delete(verifications)
      .where(eq(verifications.identifier, identifier));

    await logSecurityEvent({
      type: 'password_reset_completed',
      userId: user!.id,
      email,
      ip: getRequestIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('reset-password-with-code error:', error);

    // Prefer not to leak details; treat as invalid/expired by default.
    return NextResponse.json(
      { success: false, error: 'Invalid or expired code.', field: 'code' },
      { status: 400 },
    );
  }
}
