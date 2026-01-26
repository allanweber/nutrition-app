import crypto from 'node:crypto';

import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
    createValidationErrorResponse,
    validateRequestBody,
} from '@/lib/api-validation';
import { generate6DigitCode, minutesFromNow } from '@/lib/auth-codes';
import { db } from '@/server/db';
import { securityEvents, users, verifications } from '@/server/db/schema';
import { sendEmail } from '@/server/email/resend';
import { renderPasswordResetCodeEmail } from '@/server/email/templates';
import { logSecurityEvent } from '@/server/security-events';

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const RESEND_COOLDOWN_MS = 60_000;
const RESEND_WINDOW_MS = 60 * 60_000;
const RESEND_MAX_PER_WINDOW = 5;
const CODE_EXPIRES_MINUTES = 10;

function getRequestIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || null;
  return null;
}

async function isIdentifierAvailable(
  identifier: string,
  now: Date,
): Promise<boolean> {
  const existing = await db.query.verifications.findFirst({
    where: eq(verifications.identifier, identifier),
  });

  if (!existing) return true;
  return existing.expiresAt < now;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await validateRequestBody(request, requestSchema);
    if (!parsed.success) return parsed.response;

    const email = parsed.data.email;
    const now = new Date();

    const lastRequested = await db.query.securityEvents.findFirst({
      where: and(
        eq(securityEvents.type, 'password_reset_requested'),
        eq(securityEvents.email, email),
      ),
      orderBy: desc(securityEvents.createdAt),
    });

    if (lastRequested) {
      const msSinceLast = now.getTime() - lastRequested.createdAt.getTime();
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

    const windowStart = new Date(now.getTime() - RESEND_WINDOW_MS);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(securityEvents)
      .where(
        and(
          eq(securityEvents.type, 'password_reset_requested'),
          eq(securityEvents.email, email),
          gte(securityEvents.createdAt, windowStart),
        ),
      );

    if (count >= RESEND_MAX_PER_WINDOW) {
      return createValidationErrorResponse(
        'Too many reset codes requested. Try again later.',
        undefined,
        400,
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    let code: string | null = null;

    if (user) {
      // Generate a 6-digit code with best-effort collision avoidance.
      for (let i = 0; i < 10; i += 1) {
        const candidate = generate6DigitCode();
        const identifier = `reset-password:${candidate}`;
        // Avoid collisions across active reset codes.
        // If the identifier exists but is expired, it's safe to reuse.
        // If it's active, try another code.
        const available = await isIdentifierAvailable(identifier, now);
        if (available) {
          code = candidate;
          break;
        }
      }

      if (!code) {
        console.error('Failed to allocate unique password reset code');
        return NextResponse.json(
          { success: false, error: 'Failed to request password reset' },
          { status: 500 },
        );
      }

      const expiresAt = minutesFromNow(CODE_EXPIRES_MINUTES);
      const identifier = `reset-password:${code}`;

      await db.insert(verifications).values({
        id: crypto.randomUUID(),
        identifier,
        value: user.id,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      });

      const template = renderPasswordResetCodeEmail({
        code,
        expiresMinutes: CODE_EXPIRES_MINUTES,
      });

      await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    }

    await logSecurityEvent({
      type: 'password_reset_requested',
      userId: user?.id ?? null,
      email,
      ip: getRequestIp(request),
      userAgent: request.headers.get('user-agent'),
      metadata: {
        requestedAt: now.toISOString(),
        ...(process.env.NODE_ENV === 'test' && code ? { code } : {}),
      },
    });

    // Generic success response to avoid account enumeration.
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('request-password-reset-code error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to request password reset' },
      { status: 500 },
    );
  }
}
