# Quickstart — Email Verification & Password Reset Codes

## Prereqs

- Local env set (`.env.local`) including:
  - `BETTER_AUTH_URL`
  - `BETTER_AUTH_SECRET`
  - `DATABASE_URL`
  - `RESEND_API_KEY`
  - `EMAIL_FROM` (e.g. `Nutrition App <no-reply@yourdomain>`)

## Run locally

- `npm run dev`
- Visit `http://localhost:3000/signup`

## Manual verification flow test

1. Sign up with email/password.
2. You should be auto-signed-in and redirected to `/verify-email`.
3. Check the inbox for a 6-digit code (sent via Resend).
4. Enter the code.
5. After success, access to authenticated pages should work.

## Manual password reset flow test

1. Visit `/login` → click “Forgot password?”
2. Submit your email.
3. Receive a 6-digit code.
4. Enter code + new password.
5. Existing sessions should be revoked (you’ll be required to re-login elsewhere).

## E2E tests (planned)

- Extend Playwright suite with:
  - email signup → verify code → dashboard access
  - forgot password → reset via code → login
