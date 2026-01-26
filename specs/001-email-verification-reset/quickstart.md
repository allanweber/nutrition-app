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

## Useful links

Docs:

- Spec: `specs/001-email-verification-reset/spec.md`
- Plan: `specs/001-email-verification-reset/plan.md`
- OpenAPI contract: `specs/001-email-verification-reset/contracts/auth-code-flows.openapi.yaml`

Pages:

- Signup: `/signup`
- Login: `/login`
- Verify email: `/verify-email`
- Forgot password: `/forgot-password`
- Reset password: `/reset-password`

API endpoints:

- `POST /api/auth/request-email-verification-code`
- `POST /api/auth/verify-email-code`
- `POST /api/auth/request-password-reset-code`
- `POST /api/auth/reset-password-with-code`

## Manual verification flow test

1. Sign up with email/password.
2. You should be auto-signed-in and redirected to `/verify-email`.
3. Check the inbox for a 6-digit code (sent via Resend).
4. Enter the code.
5. After success, access to authenticated pages should work.

### Resend / throttling sanity checks

- On `/verify-email`, click “Resend code” twice quickly.
  - Expect a friendly message like “Please wait Ns…” (cooldown enforced server-side).
- On `/forgot-password`, submit the same email twice quickly.
  - Expect a friendly message like “Please wait Ns…” while still keeping account-existence messaging generic.

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
