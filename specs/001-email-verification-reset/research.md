# Research — Email Verification & Password Reset Codes

## Decisions

### Decision: Use Resend for transactional email
- **Chosen**: Resend REST API from server-side code.
- **Rationale**: Simple, reliable, avoids shipping secrets to client; supports idempotency keys.
- **Alternatives considered**: SMTP provider, client-side email (rejected: secrets + deliverability).

### Decision: Keep Better Auth as the source of truth for sessions + password hashing
- **Chosen**: Use `auth.api.*` server-side for session access; use Better Auth password reset behavior (hashing + optional session revocation) via `auth.api.resetPassword`.
- **Rationale**: Ensures password hashing stays consistent with Better Auth configuration and avoids duplicating auth internals.
- **Alternatives considered**: Manual password hashing and DB updates (rejected: high risk of incompatibility with Better Auth’s hash/verify expectations).

### Decision: Implement code-based password reset by storing reset codes in the existing `verification` table
- **Chosen**: Create records in `verification` (Drizzle table `verifications`) using the same identifier convention Better Auth expects: `reset-password:${code}`.
- **Rationale**: Lets us keep a code-based UX while delegating the actual reset and session revocation logic to Better Auth.
- **Alternatives considered**:
  - Use Better Auth’s built-in reset flow (rejected: sends a link/token flow by default, not code-first UX).
  - Store reset codes in a new custom table (rejected: would require reimplementing reset logic + hashing).

### Decision: Implement code-based email verification with a custom code store (not Better Auth’s `/verify-email`)
- **Chosen**: Create a custom code flow that sets `user.emailVerified = true` in the `user` table.
- **Rationale**: Better Auth’s `/verify-email` uses a signed JWT token in a URL query string, not a user-entered code.
- **Alternatives considered**: Wrapping Better Auth `/verify-email` behind a code mapping layer (rejected: still ultimately a link-token, plus extra complexity).

### Decision: Enforce “new signups only” gating using an explicit “verification required” marker
- **Chosen**: Track whether a user must be gated via a DB-backed marker created at email-signup time (e.g., an `email_verification_challenge` row), rather than gating purely on `emailVerified === false`.
- **Rationale**: Matches FR-017 (do not block existing legacy unverified users).
- **Alternatives considered**: Add `requiresEmailVerification` boolean column on `user` (viable, but requires careful migration/backfill and Better Auth integration).

### Decision: Rate limiting via DB (no new infra dependency)
- **Chosen**: Implement resend + wrong-code throttles using Postgres/Drizzle state (counters + timestamps).
- **Rationale**: Avoids introducing Redis/Upstash/etc. without approval; satisfies FR-016.
- **Alternatives considered**: External rate limit service or in-memory limits (rejected: infra/dep change; in-memory breaks across server instances).

## Confirmed Better Auth Capabilities (installed `better-auth@^1.4.13`)

- Built-in endpoints include:
  - `POST /request-password-reset`
  - `POST /reset-password`
  - `GET /reset-password/:token` (callback redirect)
  - `POST /send-verification-email`
  - `GET /verify-email` (JWT token verification)
- Password reset uses the `verification` table with identifier format `reset-password:${token}`, and supports revoking sessions on reset when configured.
- Email verification is implemented as a JWT token flow, not a short code.

## Notes / Security

- Password reset codes are short; mitigate brute force with:
  - max 5 wrong attempts / 15 minutes (per email + purpose)
  - optional lockout window after limit hit
  - short expiry (e.g., 10 minutes)
- Reset request responses must be generic to avoid account enumeration.
