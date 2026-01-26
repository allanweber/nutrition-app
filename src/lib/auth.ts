import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthMiddleware } from '@better-auth/core/api';
import { APIError } from 'better-call';
import type { HookEndpointContext } from '@better-auth/core';

import {
  PASSWORD_MIN_LENGTH,
  validatePasswordPolicy,
} from '@/lib/password-policy';

const passwordPolicyPlugin = {
  id: 'password-policy',
  hooks: {
    before: [
      {
        matcher(context: HookEndpointContext) {
          return (
            context.path === '/sign-up/email' ||
            context.path === '/reset-password' ||
            context.path === '/change-password'
          );
        },
        handler: createAuthMiddleware(async (ctx) => {
          const body = (ctx as { body?: unknown }).body;
          if (!body || typeof body !== 'object') return;

          const bodyObj = body as Record<string, unknown>;
          const password =
            typeof bodyObj.password === 'string'
              ? bodyObj.password
              : typeof bodyObj.newPassword === 'string'
                ? bodyObj.newPassword
                : undefined;

          if (!password) return;

          const error = validatePasswordPolicy(password);
          if (error) {
            throw new APIError('BAD_REQUEST', { message: error });
          }
        }),
      },
    ],
  },
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'individual',
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    revokeSessionsOnPasswordReset: true,
  },
  plugins: [passwordPolicyPlugin],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL!],
  secret: process.env.BETTER_AUTH_SECRET!,
});

export type Session = typeof auth.$Infer.Session;
