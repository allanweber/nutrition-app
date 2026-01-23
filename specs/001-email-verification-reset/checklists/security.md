# Security Checklist: Email Verification & Password Reset Codes

**Purpose**: Unit tests for the *requirements quality* (completeness, clarity, consistency, measurability) of the security-sensitive auth code flows.
**Created**: 2026-01-23
**Feature**: `/specs/001-email-verification-reset/spec.md`

**Assumed audience/timing**: PR reviewer using this as a requirements-quality gate.
**Depth**: Standard.
**Focus areas**: Security/resilience + UX gating/rate-limit requirements.

## Requirement Completeness

- [X] CHK001 Are all required flows explicitly enumerated (email verification, password reset, resend) with clear in-scope/out-of-scope boundaries? [Completeness, Spec §User Stories]
- [X] CHK002 Are preconditions for email verification code sending defined (e.g., only signed-in + unverified users)? [Completeness, Spec §FR-002]
- [X] CHK003 Are preconditions for email verification *submission* defined (e.g., must be signed in)? [Gap]
- [X] CHK004 Are preconditions for password reset code request defined (public route, requires only email input)? [Completeness, Spec §FR-006]
- [X] CHK005 Are preconditions for password reset completion defined (required inputs and where they are sourced)? [Completeness, Spec §FR-009]
- [X] CHK006 Are requirements defined for what happens when a verification/reset code is requested for an already-verified email? [Completeness, Spec §Edge Cases]
- [X] CHK007 Are requirements defined for how many active codes may exist per user/purpose and which one is considered valid (“latest only”)? [Completeness, Spec §FR-010]
- [X] CHK008 Are requirements defined for code format (length/character set) and whether it differs by purpose (verification vs reset)? [Completeness, Spec §Assumptions]
- [X] CHK009 Are requirements defined for code expiry duration and whether it differs by purpose? [Completeness, Spec §Assumptions]
- [X] CHK010 Are security event logging requirements defined with a minimal required event set (types, fields, retention)? [Completeness, Spec §FR-013]

## Requirement Clarity

- [X] CHK011 Is “block access to all authenticated app routes” precisely defined (which route groups are included/excluded, e.g., legal pages, logout, profile setup)? [Clarity, Spec §FR-004]
- [X] CHK012 Is the redirect destination for gated users specified unambiguously (single canonical “Verify Email” screen)? [Clarity, Spec §FR-004]
- [X] CHK013 Is the “new signups only” rule operationally defined (how the system distinguishes new signups from legacy unverified users)? [Ambiguity, Spec §FR-017]
- [X] CHK014 Is “invalidate all existing user sessions” quantified (which session types/devices are included, timing of revocation, expected post-condition)? [Clarity, Spec §FR-014]
- [X] CHK015 Are the throttle limits expressed with precise windows and reset behavior (rolling vs fixed windows, when counters reset)? [Clarity, Spec §FR-016]
- [X] CHK016 Is the scope of brute-force throttling specified (per userId, per email, per IP, per device fingerprint, or combinations)? [Ambiguity, Spec §FR-011]
- [X] CHK017 Are “clear, user-friendly error messages” constrained to avoid information leaks (no account enumeration, no leak of lockout thresholds)? [Clarity, Spec §FR-012]

## Requirement Consistency

- [X] CHK018 Do resend requirements align across verification and reset flows (cooldown/limits consistent or explicitly different)? [Consistency, Spec §FR-005, Spec §FR-016]
- [X] CHK019 Do “latest code only” requirements align between user stories and functional requirements (replacement invalidates prior codes)? [Consistency, Spec §User Story 3, Spec §FR-010]
- [X] CHK020 Do success criteria timings align with assumed expiry windows (e.g., SC-001 15 minutes vs code expiry 10 minutes)? [Consistency, Spec §SC-001, Spec §Assumptions]
- [X] CHK021 Is the OpenAPI contract aligned with the written requirements (no extra required inputs/fields that are absent from requirements, e.g., optional callbackURL)? [Consistency, Spec §Requirements, Gap]

## Acceptance Criteria Quality

- [X] CHK022 Do the acceptance scenarios define measurable pass/fail conditions without relying on unspecified external state (e.g., “receive code” without deliverability constraints)? [Measurability, Spec §User Story 1]
- [X] CHK023 Are success criteria SC-001–SC-004 measurable with defined instrumentation sources (what events/data drive the metrics)? [Measurability, Spec §Success Criteria]
- [X] CHK024 Are requirements for password policy explicitly linked to a concrete policy definition (min length/complexity rules) rather than “meets policy” as a placeholder? [Gap, Spec §User Story 2]

## Scenario Coverage

- [X] CHK025 Are alternate flows specified for users who cannot access the email inbox (recovery/help path) or is this explicitly out of scope? [Coverage, Gap]
- [X] CHK026 Are requirements specified for changing/correcting a mistyped email during verification gating (and how this interacts with “new signups only”)? [Coverage, Spec §Edge Cases]
- [X] CHK027 Are requirements specified for concurrent code requests (multi-tab/device) and how the “latest code only” rule is communicated? [Coverage, Spec §FR-010]
- [X] CHK028 Are requirements specified for what happens when a user is already signed in on another device during password reset (revocation timing and UX messaging)? [Coverage, Spec §FR-014]

## Edge Case Coverage

- [X] CHK029 Are requirements specified for the “wrong code limit exceeded” state (lockout duration, user messaging, how to recover)? [Edge Case, Spec §FR-011]
- [X] CHK030 Are requirements specified for requests during resend cooldown (exact error shape/message and retry-after guidance)? [Edge Case, Spec §FR-016]
- [X] CHK031 Are requirements specified for codes that were already used (idempotency expectations, error messaging)? [Edge Case, Spec §Edge Cases]
- [X] CHK032 Are requirements specified for expired codes (whether a new code is automatically suggested/triggered)? [Edge Case, Spec §User Story 1]

## Non-Functional Requirements

- [X] CHK033 Are deliverability requirements defined (from-address rules, retry strategy, and failure handling when the email provider is unavailable)? [NFR, Gap]
- [X] CHK034 Are privacy requirements defined for security events (PII minimization, retention, access controls)? [NFR, Gap]
- [X] CHK035 Are accessibility requirements defined for the verification/reset forms (keyboard, labels, error announcements)? [NFR, Gap]

## Dependencies & Assumptions

- [X] CHK036 Are external dependencies and required configuration documented in the requirements (Resend, required env vars), and are failure modes addressed? [Dependencies, Spec §Assumptions]
- [X] CHK037 Are assumptions about code expiry (10 minutes) and code format (6 digits) explicitly promoted to requirements if they are non-negotiable? [Assumption, Spec §Assumptions]

## Ambiguities & Conflicts

- [X] CHK038 Is the system’s stance on account enumeration consistent across *all* error messages (request flow + verify flow) and explicitly stated? [Ambiguity, Spec §FR-007, Spec §FR-012]
- [X] CHK039 Is it clear whether rate limits apply separately per purpose (verification vs reset) and per channel (request vs submit) or shared globally? [Ambiguity, Spec §FR-016]
- [X] CHK040 Is the required structured error response contract specified for each endpoint (including which `field` values are allowed)? [Gap]
