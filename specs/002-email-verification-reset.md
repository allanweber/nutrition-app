# Email Verification & Password Reset Codes — Implementation Plan

## Context

Implement forgot password and email verification on email signup, both using code verification. Email delivery via Resend. Auto-sign-in after email signup, then redirect/gate authenticated routes behind a "Verify Email" page until the user enters a valid code. After password reset, all sessions are revoked.

---

## Design Decisions

### Email Provider
- **Resend REST API** from server-side code
- Simple, reliable, avoids shipping secrets to client; supports idempotency keys

### Session Management
- **Better Auth** as the source of truth for sessions + password hashing
- Use `auth.api.*` server-side for session access
- Avoid duplicating auth internals

### Password Reset Flow
- Code-based UX using Better Auth's `verification` table
- Store reset codes with identifier format `reset-password:${code}`
- Use Better Auth's `auth.api.resetPassword` for actual reset and session revocation

### Email Verification Flow
- Custom code-based flow (not Better Auth's `/verify-email`)
- Sets `user.emailVerified = true` in the `user` table
- Better Auth's built-in `/verify-email` uses JWT token, not user-entered code

### Gating Strategy ("New Signups Only")
- Track gating via explicit "verification required" marker: `email_verification_challenge` table
- Do NOT gate purely on `emailVerified === false`
- Only new email signups after this feature is released get gated
- Legacy unverified users are not impacted

### Rate Limiting
- DB-based rate limiting (no new infra dependency)
- Postgres/Drizzle state with counters + timestamps
- Default limits: resend cooldown 60s; max 5 resends/hour; max 5 wrong-code attempts/15min

### Security
- Password reset responses must be generic to avoid account enumeration
- All sensitive events logged to `security_event` table

---

## Schema Changes Required

### New Tables

#### `email_verification_challenge`
Tracks "new signups must verify" gating + the current active email verification code.

| Field | Type | Description |
|-------|------|-------------|
| `id` | text PK | Primary key |
| `userId` | text FK | References user.id, unique |
| `email` | varchar(255) | Denormalized for convenience |
| `codeHash` | text | Hash of code (e.g., SHA-256) |
| `expiresAt` | timestamp | Code expiration |
| `sentCountHour` | integer | For max 5/hour |
| `sentCountWindowStart` | timestamp | Hour window start |
| `lastSentAt` | timestamp | For 60s cooldown |
| `failedCountWindow` | integer | For max 5/15min |
| `failedCountWindowStart` | timestamp | 15min window start |
| `lockedUntil` | timestamp | Optional lockout |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

#### `security_event`
Audit/security logging for all auth-related events.

| Field | Type | Description |
|-------|------|-------------|
| `id` | text PK | |
| `userId` | text null | FK to user.id |
| `email` | varchar(255) null | |
| `type` | varchar(64) | Event type (e.g., email_verification_requested, password_reset_completed) |
| `ip` | varchar(64) null | |
| `userAgent` | text null | |
| `metadata` | jsonb null | Additional context |
| `createdAt` | timestamp | |

### Existing Tables Used

- `user` - id, email, emailVerified (update on verification)
- `verification` - for password reset codes (identifier: `reset-password:${code}`)

---

## Files to Create

### API Routes (under `src/app/api/auth/`)

| File | Purpose |
|------|---------|
| `request-email-verification-code/route.ts` | POST - send verification code to new signup |
| `verify-email-code/route.ts` | POST - verify code, mark email as verified |
| `request-password-reset-code/route.ts` | POST - public endpoint, generic success |
| `reset-password-with-code/route.ts` | POST - submit code + new password, revoke sessions |

### Pages (under `src/app/`)

| File | Purpose |
|------|---------|
| `verify-email/page.tsx` | Code entry UI with TanStack Form + resend UX |
| `forgot-password/page.tsx` | Request reset code form |
| `reset-password/page.tsx` | Submit code + new password form |

### Server Utilities

| File | Purpose |
|------|---------|
| `src/server/email/resend.ts` | Resend email utility |
| `src/server/email/templates.ts` | Email templates for verification/reset |
| `src/server/security-events.ts` | Security event logging helpers |
| `src/lib/auth-codes.ts` | Generate code, hash, expiry calculations |
| `src/lib/auth.ts` | Update Better Auth config for session revocation |

### Query Hooks

| File | Purpose |
|------|---------|
| `src/queries/auth-codes.ts` | TanStack Query mutations for all auth-code endpoints |

---

## Files to Modify

| File | Change |
|-------|--------|
| `src/server/db/schema.ts` | Add `email_verification_challenge` and `security_event` tables |
| `src/app/(dashboard)/layout.tsx` | Add server-side gating check for unverified users |
| `src/components/logout-button.tsx` | Allow gated users to log out |
| `src/app/signup/page.tsx` | Call request-verification-code after signup, route to `/verify-email` |
| `src/app/login/page.tsx` | Add "Forgot password?" link |
| `.env.example` | Add RESEND_API_KEY, EMAIL_FROM |

---

## Key Data Shapes

### POST /api/auth/request-email-verification-code
```typescript
// Request
{ email?: string, callbackUrl?: string }
// Response (always 200)
{ success: true }
// Rate limit: 60s cooldown, max 5/hour
```

### POST /api/auth/verify-email-code
```typescript
// Request
{ code: string }
// Response
{ success: true } | { success: false, error: "Invalid or expired code" }
// Security events: requested, failed, verified
```

### POST /api/auth/request-password-reset-code
```typescript
// Request
{ email: string }
// Response (always 200, no enumeration)
{ success: true }
// Generic success even for unknown email
```

### POST /api/auth/reset-password-with-code
```typescript
// Request
{ email: string, code: string, newPassword: string }
// Response
{ success: true } | { success: false, error: string }
// On success: all sessions revoked
```

---

## Implementation Order

1. **Setup**: Document env vars, add cross-links
2. **Foundational** (blocks all stories):
   - Add Resend email utility + templates
   - Add DB tables for challenge + security events
   - Add security event logging helpers
   - Add auth code utilities
   - Update Better Auth config for session revocation
3. **User Story 1** (P1 - MVP): Email verification after signup
   - E2E tests for gating
   - API routes for request/verify
   - UI: verify-email page with resend UX
   - Signup flow update
   - Server-side gating in layout
4. **User Story 2** (P2): Password reset with code
   - E2E tests for reset flow
   - API routes for request/reset
   - UI: forgot-password + reset-password pages
5. **User Story 3** (P3): Safe resend codes
   - Rate limiting enforcement
   - UX messaging for throttles/expiry
6. **Polish**: Doc notes, normalize error shapes, quickstart validation

---

## Verification Checklist

- [ ] Signup redirects to `/verify-email` and blocks `/dashboard`
- [ ] Enter wrong code shows error and stays gated
- [ ] Enter correct code verifies and allows dashboard access
- [ ] Request reset returns generic success for unknown email
- [ ] Reset with invalid/expired code fails with friendly error
- [ ] Reset with valid code changes password and allows login
- [ ] Prior sessions invalid after password reset
- [ ] Verification resend cooldown blocks rapid resends
- [ ] Reset-code request rate limits enforced
- [ ] npm run lint passes
