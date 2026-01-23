# API Checklist: Email Verification & Password Reset Codes

**Purpose**: Unit tests for requirements quality of the API surface and its alignment with the OpenAPI contract (contract is normative).
**Created**: 2026-01-23
**Feature**: `/specs/001-email-verification-reset/spec.md`

**Scope note**: This checks whether the *requirements* fully and unambiguously specify the API behavior and whether the OpenAPI contract matches those requirements.

## Requirement Completeness

- [X] CHK001 Are all API endpoints implied by the requirements explicitly enumerated (including resend variants and gated flows)? [Completeness, Spec §FR-002, Spec §FR-005, Spec §FR-006, Spec §FR-009]
- [X] CHK002 Are authentication requirements specified per endpoint (which are public vs require an authenticated session)? [Gap, Spec §FR-004]
- [X] CHK003 Are input payloads specified for each endpoint (required fields, optional fields, formats)? [Completeness, Contract §paths]
- [X] CHK004 Are response shapes specified for both success and error paths (including structured error format `{ success:false, error, field? }`)? [Gap]
- [X] CHK005 Are rate-limit and abuse-protection errors specified as part of the API contract (status, error message constraints, field values)? [Completeness, Spec §FR-016]
- [X] CHK006 Is idempotency behavior specified for resend endpoints (whether repeated requests within cooldown are rejected vs accepted but not resent)? [Gap, Spec §FR-005, Spec §FR-016]
- [X] CHK007 Are code invalidation semantics specified as API-observable behavior (e.g., after resend, prior code becomes invalid)? [Completeness, Spec §FR-010]

## Requirement Clarity

- [X] CHK008 Is “generic response to avoid account enumeration” defined precisely in API terms (same status code, same response body, same timing constraints if any)? [Clarity, Spec §FR-007]
- [X] CHK009 Are error messages constrained to avoid leaking whether an account exists (including for throttling/lockout states)? [Clarity, Spec §FR-007, Spec §FR-012]
- [X] CHK010 Is the code format validated consistently across endpoints (6-digit numeric; trimming/whitespace rules), and is this specified? [Clarity, Spec §Assumptions]
- [X] CHK011 Are password policy requirements expressed as a concrete set of rules that the API will enforce and report? [Gap, Spec §FR-009]
- [X] CHK012 Is the meaning of the `field` property in errors specified (allowed values and when it’s included)? [Gap]

## Requirement Consistency (Spec ↔ Contract)

- [X] CHK013 Does `POST /api/auth/request-email-verification-code` require authentication in the contract and is that requirement stated in the spec? [Consistency, Spec §FR-002, Contract §/api/auth/request-email-verification-code]
- [X] CHK014 Does `POST /api/auth/verify-email-code` require authentication in the contract and is that requirement stated in the spec? [Consistency, Spec §FR-003, Contract §/api/auth/verify-email-code]
- [X] CHK015 Does `POST /api/auth/request-password-reset-code` avoid account enumeration in both spec and contract (response always success)? [Consistency, Spec §FR-007, Contract §/api/auth/request-password-reset-code]
- [X] CHK016 Does `POST /api/auth/reset-password-with-code` require the same inputs as the requirements (spec does not require email, contract does)? [Conflict, Spec §FR-009, Contract §/api/auth/reset-password-with-code]
- [X] CHK017 Is `callbackURL` present in the contract supported by an explicit requirement (or explicitly excluded)? [Gap, Contract §RequestEmailVerificationCodeRequest]
- [X] CHK018 Are HTTP status codes for validation/throttle/invalid-code failures consistent between the contract and the spec’s wording? [Consistency, Spec §FR-011, Spec §FR-012, Contract §responses]

## Acceptance Criteria Quality

- [X] CHK019 Do acceptance scenarios cover all API failure classes (invalid code, expired code, throttled, locked) with measurable expected error semantics? [Measurability, Spec §User Story 1, Spec §User Story 2, Spec §FR-011]
- [X] CHK020 Are acceptance criteria defined for “latest code only” as an observable, verifiable API behavior (without requiring implementation detail)? [Measurability, Spec §FR-010]

## Scenario Coverage

- [X] CHK021 Are requirements defined for cross-session behavior after password reset (what clients experience and how API communicates session revocation)? [Coverage, Spec §FR-014]
- [X] CHK022 Are requirements defined for authenticated-but-unverified users calling non-auth endpoints (e.g., password reset) and whether that is allowed/meaningful? [Coverage, Gap]
- [X] CHK023 Are requirements defined for “already verified” attempting to request verification code (API behavior and response)? [Coverage, Spec §Edge Cases]

## Edge Case Coverage

- [X] CHK024 Are requirements defined for code reuse attempts (same code submitted twice) in terms of API response and messaging? [Edge Case, Spec §Edge Cases]
- [X] CHK025 Are requirements defined for concurrent requests producing multiple codes and which one is accepted? [Edge Case, Spec §FR-010]

## Non-Functional Requirements

- [X] CHK026 Are requirements defined for logging/auditing at the API boundary (what is logged for requests, success/failure, and privacy constraints)? [NFR, Spec §FR-013]
- [X] CHK027 Are requirements defined for latency/timeout/retry behavior with the email provider dependency (as an API-visible failure mode)? [NFR, Gap]

## Dependencies & Assumptions

- [X] CHK028 Are dependencies that affect API behavior explicitly documented (session cookie name, auth mechanism), without leaking implementation coupling? [Assumption, Contract §securitySchemes]
- [X] CHK029 Are assumptions (6-digit code, 10-minute expiry) explicitly elevated to requirements if they must be enforced at the API boundary? [Assumption, Spec §Assumptions]

## Ambiguities & Conflicts

- [X] CHK030 Is it explicit whether rate limits apply per email, per userId, per IP, or a combination, and is that reflected consistently in API errors? [Ambiguity, Spec §FR-016]
- [X] CHK031 Is it explicit whether `/reset-password-with-code` must accept only `code` + `newPassword` (no email) or require `email` too, and why? [Conflict, Spec §FR-009, Contract §ResetPasswordWithCodeRequest]
