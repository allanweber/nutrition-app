---
description: Generate next .specify prompt file ID
---

Generate the next feature prompt file in `.specify/prompts` with no user arguments.

Performance rules:
1. Only scan top-level directories in `specs/` (non-recursive).
2. Parse 3-digit prefixes in one pass and compute max in memory.
3. Do not list all files in `.specify/prompts`.
4. Check filename collisions with direct existence checks on the candidate path and increment only when needed.

Requirements:
1. Inspect only `specs/*` directory names and collect names that start with a 3-digit numeric prefix (`001-`, `002-`, ...).
2. Compute the next ID as `(max existing prefix + 1)`, zero-padded to 3 digits.
3. Create `.specify/prompts/<ID>.md` (number only, no slug).
4. If that file already exists, increment until you find the next available numeric filename.
5. Do not request any arguments from the user.

For the new file content, use this minimal template:

```md
# Feature Prompt <ID>

Describe the next feature here.
```

In your response, return only:
- Created file path
- Chosen numeric ID
