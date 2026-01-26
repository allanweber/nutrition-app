# Data Model — Email Verification & Password Reset Codes

## Existing Tables (already in schema)

### `user`

- `id: string`
- `email: string`
- `emailVerified: boolean | null` (in schema as `email_verified`, default `false`)
- `createdAt`, `updatedAt`

### `verification`

Used by Better Auth for various verification tokens.

- `id: string`
- `identifier: string`
- `value: string`
- `expiresAt: Date`
- `createdAt`, `updatedAt`

Planned usage for this feature:

- Password reset codes stored as:
  - `identifier = reset-password:${code}`
  - `value = userId`
  - `expiresAt = now + 10 minutes`

## New Tables (proposed)

### `email_verification_challenge`

Tracks “new signups must verify” gating + the current active email verification code.

Fields:

- `id: text` (PK)
- `userId: text` (FK → `user.id`, unique)
- `email: varchar(255)` (denormalized for convenience)
- `codeHash: text` (hash of code, e.g., SHA-256)
- `expiresAt: timestamp`
- `sentCountHour: integer` (for max 5/hour)
- `sentCountWindowStart: timestamp`
- `lastSentAt: timestamp` (for 60s cooldown)
- `failedCountWindow: integer` (for max 5/15min)
- `failedCountWindowStart: timestamp`
- `lockedUntil: timestamp` (optional)
- `createdAt: timestamp`
- `updatedAt: timestamp`

Behavior:

- Exactly one active row per user while unverified + gating applies.
- Resend regenerates `codeHash` and resets `expiresAt`, increments send counters.
- Successful verification deletes the row (or marks completed) and sets `user.emailVerified = true`.

Indexes:

- `userId` unique index
- `email` index (optional)

### `security_event`

Audit/security logging for FR-013.

Fields:

- `id: text` (PK)
- `userId: text | null` (FK → `user.id`)
- `email: varchar(255) | null`
- `type: varchar(64)` (e.g., `email_verification_requested`, `email_verification_failed`, `email_verified`, `password_reset_requested`, `password_reset_failed`, `password_reset_completed`)
- `ip: varchar(64) | null`
- `userAgent: text | null`
- `metadata: jsonb | null`
- `createdAt: timestamp`

Indexes:

- `(userId, createdAt)`
- `(type, createdAt)`

## Validation Rules

- Code format: 6-digit numeric.
- Code expiry: 10 minutes.
- Abuse protections (defaults):
  - resend cooldown: 60 seconds
  - max resends: 5 per hour
  - max wrong attempts: 5 per 15 minutes

## State Transitions

### Email verification (new email signups)

1. Signup succeeds (Better Auth) → user is signed in, `emailVerified=false`.
2. System creates `email_verification_challenge` row + sends code.
3. User submits code:
   - If valid and not expired/locked → set `user.emailVerified=true`, delete challenge row.
   - Else → increment failed attempts / potentially lock.

### Password reset

1. User requests reset code:
   - If user exists → create `verification` row (`reset-password:${code}`) + send email.
   - Always return success.
2. User submits code + new password:
   - Calls `auth.api.resetPassword` using the code as token; configured to revoke sessions.
