'use client';

import { useMutation } from '@tanstack/react-query';

type StandardOk = { success: true };
type StandardError = { success: false; error: string; field?: string | null };

async function parseJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function toThrownError(payload: unknown): Error {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    return new Error(JSON.stringify(payload));
  }
  return new Error('Request failed');
}

export function useRequestEmailVerificationCodeMutation() {
  return useMutation({
    mutationFn: async (params?: {
      callbackURL?: string | null;
    }): Promise<StandardOk> => {
      const response = await fetch(
        '/api/auth/request-email-verification-code',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: params ? JSON.stringify(params) : undefined,
        },
      );

      const payload = (await parseJsonSafely(response)) as
        | StandardOk
        | StandardError
        | null;

      if (!response.ok) {
        throw toThrownError(payload ?? { error: 'Failed to send code' });
      }

      if (!payload || payload.success !== true) {
        throw toThrownError(payload ?? { error: 'Failed to send code' });
      }

      return payload;
    },
  });
}

export function useVerifyEmailCodeMutation() {
  return useMutation({
    mutationFn: async (params: { code: string }): Promise<StandardOk> => {
      const response = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const payload = (await parseJsonSafely(response)) as
        | StandardOk
        | StandardError
        | null;

      if (!response.ok) {
        throw toThrownError(
          payload ?? { error: 'Failed to verify code', field: 'code' },
        );
      }

      if (!payload || payload.success !== true) {
        throw toThrownError(
          payload ?? { error: 'Failed to verify code', field: 'code' },
        );
      }

      return payload;
    },
  });
}

export function useRequestPasswordResetCodeMutation() {
  return useMutation({
    mutationFn: async (params: { email: string }): Promise<StandardOk> => {
      const response = await fetch('/api/auth/request-password-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const payload = (await parseJsonSafely(response)) as
        | StandardOk
        | StandardError
        | null;

      if (!response.ok) {
        throw toThrownError(
          payload ?? { error: 'Failed to request reset code' },
        );
      }

      if (!payload || payload.success !== true) {
        throw toThrownError(
          payload ?? { error: 'Failed to request reset code' },
        );
      }

      return payload;
    },
  });
}

export function useResetPasswordWithCodeMutation() {
  return useMutation({
    mutationFn: async (params: {
      email: string;
      code: string;
      newPassword: string;
    }): Promise<StandardOk> => {
      const response = await fetch('/api/auth/reset-password-with-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const payload = (await parseJsonSafely(response)) as
        | StandardOk
        | StandardError
        | null;

      if (!response.ok) {
        throw toThrownError(
          payload ?? { error: 'Failed to reset password', field: 'code' },
        );
      }

      if (!payload || payload.success !== true) {
        throw toThrownError(
          payload ?? { error: 'Failed to reset password', field: 'code' },
        );
      }

      return payload;
    },
  });
}
