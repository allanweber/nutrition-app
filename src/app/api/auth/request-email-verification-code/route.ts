import crypto from 'node:crypto';

import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
    createValidationErrorResponse,
    validateApiInput,
} from '@/lib/api-validation';
import { auth } from '@/lib/auth';
import { generate6DigitCode, hashCode, minutesFromNow } from '@/lib/auth-codes';
import { db } from '@/server/db';
import { emailVerificationChallenges } from '@/server/db/schema';
import { sendEmail } from '@/server/email/resend';
import { renderEmailVerificationCodeEmail } from '@/server/email/templates';
import { logSecurityEvent } from '@/server/security-events';

const requestSchema = z
  .object({
    callbackURL: z
      .string()
      .max(2048)
      .regex(/^\/.*/, "callbackURL must start with '/'")
      .nullable()
      .optional(),
  })
  .optional();

const RESEND_COOLDOWN_MS = 60_000;
const RESEND_WINDOW_MS = 60 * 60_000;
const RESEND_MAX_PER_WINDOW = 5;
const CODE_EXPIRES_MINUTES = 10;

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
    if (!email) {
      return createValidationErrorResponse('Email is required', 'email', 400);
    }

    // Body is optional; if missing/invalid JSON, treat as empty.
    let rawBody: unknown = undefined;
    try {
      rawBody = await request.json();
    } catch {
      rawBody = undefined;
    }

    const parsed = validateApiInput(requestSchema, rawBody);
    if (!parsed.success) {
      // Spec allows defaulting on invalid callbackURL, so ignore validation errors
      // and proceed as if no body was provided.
    }

    const now = new Date();

    const existing = await db.query.emailVerificationChallenges.findFirst({
      where: eq(emailVerificationChallenges.userId, userId),
    });

    if (existing?.lockedUntil && existing.lockedUntil > now) {
      return createValidationErrorResponse(
        'Too many attempts. Try again later.',
        undefined,
        400,
      );
    }

    if (existing?.lastSentAt) {
      const msSinceLast = now.getTime() - existing.lastSentAt.getTime();
      if (msSinceLast < RESEND_COOLDOWN_MS) {
        const secondsLeft = Math.ceil(
          (RESEND_COOLDOWN_MS - msSinceLast) / 1000,
        );
        return createValidationErrorResponse(
          `Please wait ${secondsLeft}s before requesting another code.`,
          undefined,
          400,
        );
      }
    }

    const windowStart = existing?.sentCountWindowStart ?? now;
    const windowExpired =
      now.getTime() - windowStart.getTime() >= RESEND_WINDOW_MS;
    const sentCount = windowExpired ? 0 : (existing?.sentCountHour ?? 0);

    if (sentCount >= RESEND_MAX_PER_WINDOW) {
      return createValidationErrorResponse(
        'Too many codes requested. Try again later.',
        undefined,
        400,
      );
    }

    const code = generate6DigitCode();
    const codeHash = hashCode(code);
    const expiresAt = minutesFromNow(CODE_EXPIRES_MINUTES);

    if (!existing) {
      await db.insert(emailVerificationChallenges).values({
        id: crypto.randomUUID(),
        userId,
        email,
        codeHash,
        expiresAt,
        sentCountHour: 1,
        sentCountWindowStart: now,
        lastSentAt: now,
        failedCountWindow: 0,
        failedCountWindowStart: now,
        lockedUntil: null,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await db
        .update(emailVerificationChallenges)
        .set({
          email,
          codeHash,
          expiresAt,
          sentCountHour: sentCount + 1,
          sentCountWindowStart: windowExpired ? now : windowStart,
          lastSentAt: now,
          updatedAt: now,
          lockedUntil: null,
        })
        .where(
          and(
            eq(emailVerificationChallenges.userId, userId),
            eq(emailVerificationChallenges.id, existing.id),
          ),
        );
    }

    const template = renderEmailVerificationCodeEmail({
      code,
      expiresMinutes: CODE_EXPIRES_MINUTES,
    });

    await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    await logSecurityEvent({
      type: 'email_verification_requested',
      userId,
      email,
      ip: getRequestIp(request),
      userAgent: request.headers.get('user-agent'),
      metadata: {
        sentAt: now.toISOString(),
        ...(process.env.NODE_ENV === 'test' ? { code } : {}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('request-email-verification-code error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification code' },
      { status: 500 },
    );
  }
}
