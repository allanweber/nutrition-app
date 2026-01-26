import crypto from 'node:crypto';

import { db } from '@/server/db';
import { securityEvents } from '@/server/db/schema';

export type SecurityEventType =
  | 'email_verification_requested'
  | 'email_verification_failed'
  | 'email_verified'
  | 'password_reset_requested'
  | 'password_reset_failed'
  | 'password_reset_completed';

export async function logSecurityEvent(params: {
  type: SecurityEventType;
  userId?: string | null;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  await db.insert(securityEvents).values({
    id: crypto.randomUUID(),
    type: params.type,
    userId: params.userId ?? null,
    email: params.email ?? null,
    ip: params.ip ?? null,
    userAgent: params.userAgent ?? null,
    metadata: params.metadata ?? null,
    createdAt: new Date(),
  });
}
