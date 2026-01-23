# UX Checklist: Email Verification & Password Reset Codes

**Purpose**: Unit tests for requirements quality of user-facing flows (gating, messaging, accessibility, and recovery) for code-based verification and password reset.
**Created**: 2026-01-23
**Feature**: `/specs/001-email-verification-reset/spec.md`

**Audience/timing**: PR review checklist.

## Requirement Completeness

- [ ] CHK001 Are all user-facing screens/routes required by the flows explicitly listed (Verify Email, Forgot Password, Reset Password), including entry points from login/signup? [Completeness, Spec §User Story 1, Spec §User Story 2]
- [ ] CHK002 Are redirect expectations after signup and after successful verification defined (from signup → verify; after verify → where)? [Completeness, Spec §FR-015]
- [ ] CHK003 Are redirect expectations after successful password reset defined (to login? auto-login? confirmation screen)? [Gap]
- [ ] CHK004 Are requirements defined for handling users who are signed in but gated (what they can still access—logout, settings, support)? [Completeness, Spec §FR-004]
- [ ] CHK005 Are loading/empty/error states specified for each flow step where asynchronous work exists (sending code, verifying code, resetting password)? [Gap]

## Requirement Clarity

- [ ] CHK006 Is “block access to all authenticated app routes” precisely bounded (which routes count as authenticated, and whether any are exempt during gating)? [Clarity, Spec §FR-004]
- [ ] CHK007 Is the dedicated “Verify Email” screen defined with required content elements (instructions, code input, resend affordance, cooldown messaging)? [Clarity, Spec §FR-004, Spec §FR-012]
- [ ] CHK008 Are user-facing messages for invalid vs expired codes clearly distinguished and constrained (no sensitive disclosures)? [Clarity, Spec §FR-012]
- [ ] CHK009 Are throttle messages specified with objective, user-comprehensible guidance (e.g., “try again in X seconds/minutes”) without leaking abuse thresholds? [Clarity, Spec §FR-016]
- [ ] CHK010 Is the UX behavior for “already verified” requesting verification code specified (what the user sees and next action)? [Clarity, Spec §Edge Cases]

## Requirement Consistency

- [ ] CHK011 Do the user stories, functional requirements, and quickstart agree on the exact navigation paths (e.g., `/verify-email`, `/login`), without contradictions? [Consistency, Spec §User Stories, Quickstart §Manual verification flow test]
- [ ] CHK012 Is the resend behavior consistent across verification and password reset flows (cooldown, caps, and messaging)? [Consistency, Spec §User Story 3, Spec §FR-016]
- [ ] CHK013 Is the “new signups only” gating rule consistent with the broad wording “block all authenticated routes” (i.e., no legacy-user surprise)? [Consistency, Spec §FR-004, Spec §FR-017]

## Acceptance Criteria Quality

- [ ] CHK014 Do acceptance scenarios specify observable outcomes for gating (what user sees when attempting to access an authenticated page while gated)? [Measurability, Spec §User Story 1]
- [ ] CHK015 Do acceptance scenarios specify observable outcomes for resend throttling (what message, what next-step action)? [Measurability, Spec §User Story 3]
- [ ] CHK016 Are success criteria SC-001–SC-004 connected to UX requirements that plausibly drive completion (e.g., guidance when code expires)? [Measurability, Spec §Success Criteria]

## Scenario Coverage

- [ ] CHK017 Are recovery paths specified for users who never receive the email (spam folder guidance, alternate resend strategy, support contact), or is it explicitly out of scope? [Coverage, Gap]
- [ ] CHK018 Are requirements specified for users who signed up with a typoed email (whether they can correct email and re-verify)? [Coverage, Spec §Edge Cases]
- [ ] CHK019 Are requirements specified for multi-device/multi-tab cases (code requested on device A, entered on device B) and the resulting UX messaging? [Coverage, Spec §FR-010]

## Edge Case Coverage

- [ ] CHK020 Are requirements specified for lockout after repeated wrong codes (duration, messaging, next steps)? [Edge Case, Spec §FR-011]
- [ ] CHK021 Are requirements specified for attempting to use an already-used code (user-facing message and guidance)? [Edge Case, Spec §Edge Cases]
- [ ] CHK022 Are requirements specified for requesting many codes in succession (which code is valid, and whether the UI explains “latest code only”)? [Edge Case, Spec §FR-010]

## Non-Functional Requirements

- [ ] CHK023 Are accessibility requirements defined for all code/password forms (labels, keyboard navigation, focus management, error announcement)? [NFR, Gap]
- [ ] CHK024 Are requirements defined for localization/time format in cooldown messaging (e.g., seconds/minutes) if applicable? [NFR, Gap]

## Dependencies & Assumptions

- [ ] CHK025 Are assumptions about code length and expiry reflected in UX requirements (input constraints, “expires in” messaging), and are they consistent? [Assumption, Spec §Assumptions]

## Ambiguities & Conflicts

- [ ] CHK026 Is it explicit whether “auto-sign-in then verify” implies the user can see any personalized data before verification, and if not, is that intentionally constrained? [Ambiguity, Spec §FR-015, Spec §FR-004]
- [ ] CHK027 Is it explicit what happens if a gated user tries to log out or delete account during gating (allowed/blocked)? [Gap]
