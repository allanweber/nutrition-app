# Feature Specification: Email Verification & Password Reset Codes

**Feature Branch**: `001-email-verification-reset`  
**Created**: 2026-01-23  
**Status**: Draft  
**Input**: User description: "Implement forgot password and email verification on email signup, both using code verification; email delivery via provider (Resend available)"

## Clarifications

### Session 2026-01-23

- Q: For **FR-004** (prevent full account access until verified), which access rule applies? → A: Block all authenticated app routes until verified; redirect to a dedicated “Verify Email” screen.
- Q: After a successful password reset, what should happen to existing sessions? → A: Invalidate all existing sessions and require re-login.
- Q: After email signup, should the user be auto-signed-in before verifying? → A: Auto-sign-in after email signup, then redirect to “Verify Email” until verified.
- Q: What defaults should we use for resend + wrong-code throttling? → A: Balanced defaults: resend cooldown 60s; max 5 resends/hour; max 5 wrong-code attempts per 15 minutes.
- Q: Should email verification gating apply only to new signups, or also to existing users? → A: Apply gating only to new email signups going forward.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verify email after signup (Priority: P1)

As a new user signing up with an email address, I want to verify that I own the email address using a one-time code so my account is protected and I can safely access the app.

**Why this priority**: Prevents account takeover/typos and ensures users can reliably receive account communications.

**Independent Test**: Create an account via email signup, receive a verification code, submit the code, and confirm the account becomes verified.

**Acceptance Scenarios**:

1. **Given** I sign up with a valid email address, **When** the system sends me a verification code, **Then** I can enter that code to verify my email and proceed to use the app.
2. **Given** I enter an incorrect verification code, **When** I submit it, **Then** I see an error message and my email remains unverified.
3. **Given** my verification code has expired, **When** I submit it, **Then** I see an expiration message and I can request a new code.
4. **Given** I am signed in but my email is unverified, **When** I try to access any authenticated app page, **Then** I am redirected to a dedicated “Verify Email” page until verification is completed.
5. **Given** I complete email signup successfully, **When** the signup flow finishes, **Then** I am automatically signed in and taken to the “Verify Email” page.

---

### User Story 2 - Reset password with a code (Priority: P2)

As a user who forgot my password, I want to request a one-time code and set a new password so I can regain access to my account.

**Why this priority**: Restores account access without requiring support and reduces account lockouts.

**Independent Test**: From the login screen, request a password reset, use the received code to set a new password, and confirm login succeeds with the new password.

**Acceptance Scenarios**:

1. **Given** I’m on the login screen, **When** I request a password reset for an email address, **Then** the system confirms the request without revealing whether the email is registered.
2. **Given** I have a valid reset code, **When** I submit my email address, the code, and a new password that meets the password policy, **Then** my password is updated and I can log in.
3. **Given** I have an invalid or expired reset code, **When** I attempt to reset my password, **Then** the system rejects the attempt and explains how to request a new code.
4. **Given** I successfully reset my password, **When** I try to use an existing signed-in session on any device, **Then** I am required to log in again.

---

### User Story 3 - Resend codes safely (Priority: P3)

As a user who didn’t receive a code or let it expire, I want to request another code with clear guidance so I can complete verification or password reset without getting stuck.

**Why this priority**: Improves completion rates and reduces support burden while preventing abuse.

**Independent Test**: Request a resend for both verification and password reset flows; confirm cooldown/limits are enforced and UX messaging remains clear.

**Acceptance Scenarios**:

1. **Given** I am unverified, **When** I request a new verification code, **Then** a new code is sent and prior unused codes become invalid.
2. **Given** I request codes too frequently, **When** I attempt another resend, **Then** I am throttled with a clear message about when I can try again.

### Edge Cases

- Verification requested for an email address that is already verified.
- Password reset requested for an email address that is not registered (response must still be generic).
- Existing users created before this feature may be unverified; they are not blocked by verification gating (gating applies only to new email signups going forward).
- Multiple code emails requested in quick succession; only the latest code should remain valid.
- Brute force attempts: repeated incorrect codes should be throttled and/or temporarily blocked.
- User attempts to verify/reset with a code that was already used.
- Email address has a typo; user needs a clear path to re-send and/or correct their email (if supported).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require email verification for accounts created via email signup.
- **FR-002**: System MUST send a one-time verification code to the user’s email address after email signup.
- **FR-003**: System MUST allow a user to submit a verification code to mark their email address as verified.
- **FR-004**: System MUST block access to all authenticated app routes until the user’s email address is verified, redirecting the user to a dedicated “Verify Email” screen.
  - Clarification: When gating is active, the user MUST still be able to access the “Verify Email” page and log out. Authenticated dashboard routes MUST redirect to `/verify-email` until verification is completed.
- **FR-005**: System MUST allow users to request a new verification code (resend) with abuse protections (cooldown and rate limits).
  - Email verification redirect: `POST /api/auth/request-email-verification-code` MAY accept an optional `callbackURL` indicating where to navigate after successful verification. It MUST be validated as an internal, same-origin path (starts with `/`) and MUST NOT allow external URLs. If absent/invalid, default to a safe route (e.g., `/dashboard`).
- **FR-006**: System MUST allow users to request a password reset by providing an email address.
- **FR-007**: System MUST respond to password reset requests without revealing whether the email address is registered.
- **FR-008**: System MUST send a one-time password reset code to the email address when a password reset is requested.
- **FR-009**: System MUST allow a user to set a new password after submitting their email address, a valid reset code, and a new password that meets the password policy.
- **FR-010**: System MUST invalidate codes after successful use, expiration, or replacement by a newer code.
- **FR-011**: System MUST throttle code entry attempts to mitigate brute force attacks.
- **FR-012**: System MUST provide clear, user-friendly error messages for invalid/expired codes and next-step actions.
- **FR-013**: System MUST record security-relevant events related to verification and password reset flows (e.g., code requested, code verified, repeated failed attempts, password reset completed).
- **FR-014**: System MUST invalidate all existing user sessions after a successful password reset.
- **FR-015**: System MUST automatically sign in users after successful email signup and route them to the dedicated “Verify Email” screen until verification is completed.
- **FR-016**: System MUST enforce default abuse protections of: resend cooldown of 60 seconds; max 5 resends per hour; and max 5 incorrect code submissions per 15 minutes.
  - Rate limit keys:
    - For authenticated verification endpoints: per-user (userId).
    - For public reset-code request endpoint: per-email and per-IP (generic success still required).
    - For `POST /api/auth/reset-password-with-code`, wrong-code attempts MUST be throttled per email + IP (15-minute window) and MAY additionally throttle per code token when available; on throttle, return the same generic invalid/expired error shape (no additional account linkage signals).
- **FR-017**: System MUST apply email verification gating (route blocking + redirect to “Verify Email”) only for accounts created via email signup after this feature is released.

### Key Entities *(include if feature involves data)*

- **User**: Represents an account with an email address and an email verification status.
- **One-time Code**: Represents a short-lived code used for either email verification or password reset, with an expiry time and a single-use guarantee.
- **Security Event**: Represents an auditable record of sensitive events (e.g., verification attempts, password reset completion).

### Assumptions

- Verification and reset codes are short and user-friendly (assume a 6-digit numeric code).
- Codes expire after a short window (assume 10 minutes).
- Resends and submission attempts are rate-limited with reasonable defaults to balance usability and abuse prevention.
- Default limits: resend cooldown 60 seconds; max 5 resends per hour; max 5 wrong-code attempts per 15 minutes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of users who sign up with email complete email verification within 15 minutes of account creation.
- **SC-002**: At least 95% of users who initiate password reset successfully set a new password within 5 minutes.
- **SC-003**: Support tickets related to “can’t verify email” and “forgot password” decrease by at least 30% compared to baseline.
- **SC-004**: Users are able to complete verification and password reset flows with a first-attempt completion rate of at least 85% (excluding invalid/expired-code cases).
