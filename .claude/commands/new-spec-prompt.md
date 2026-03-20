---
description: Create the next numbered spec prompt in .specify/prompts/ based on the existing template.
---

Create a new spec prompt file in `.specify/prompts/` by following these steps:

## Step 1 — Find the next number

List all files in `.specify/prompts/` matching the pattern `NNN-*.md` (three-digit prefix). Find the highest number and add 1. Zero-pad to 3 digits (e.g. `003` → `004`).

## Step 2 — Determine the feature slug

If `$ARGUMENTS` is non-empty, derive a kebab-case slug from it (e.g. "user auth flow" → `user-auth-flow`).
If `$ARGUMENTS` is empty, use the placeholder slug `new-feature`.

## Step 3 — Write the file

Create `.specify/prompts/<NNN>-<slug>.md` with the following content, keeping every `[PLACEHOLDER]` exactly as shown so the user can fill them in:

```markdown
# Feature Prompt <NNN>

## Feature Title
[SHORT FEATURE TITLE]

## Summary
As a [USER TYPE], I want to [ACTION] so that [BENEFIT].

## Motivation
[Describe why this feature is needed and what problem it solves.]

## Goals
- [Primary goal]
- [Secondary goal]
- [Add more as needed]

## Non-Goals
- [What this feature explicitly does NOT cover]

## Scope
### In scope
- [List what is included]

### Out of scope
- [List what is excluded]

## Functional Requirements
1. [Requirement 1]
2. [Requirement 2]
3. [Add more as needed]

## Technical details
[Optional: include API contracts, data shapes, URLs, example responses, DB schema notes, or any implementation constraints the developer needs.]

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Open Questions
- [Any unresolved decision that needs an answer before implementation]
```

## Step 4 — Report

Print the path of the newly created file and remind the user to fill in every `[PLACEHOLDER]` before running `/speckit.specify`.
