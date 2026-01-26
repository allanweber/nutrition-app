import postgres from 'postgres';

import crypto from 'node:crypto';

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function reverse6DigitSha256Hex(hashHex: string): string | null {
  // The app stores email verification codes as an unsalted SHA-256 hex hash.
  // For E2E tests we can deterministically recover the 6-digit code.
  for (let i = 0; i <= 999_999; i += 1) {
    const candidate = i.toString().padStart(6, '0');
    if (sha256Hex(candidate) === hashHex) return candidate;
  }
  return null;
}

export async function fetchLatestEmailVerificationCode(params: {
  email: string;
  timeoutMs?: number;
}): Promise<string> {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  const timeoutMs = params.timeoutMs ?? 10_000;
  const start = Date.now();

  try {
    // Poll until the event is written.
    while (Date.now() - start < timeoutMs) {
      const rows = await sql<Array<{ codeHash: string | null }>>`
        select code_hash as "codeHash"
        from email_verification_challenge
        where email = ${params.email}
        order by created_at desc
        limit 1
      `;

      const codeHash = rows[0]?.codeHash ?? null;
      if (codeHash) {
        const code = reverse6DigitSha256Hex(codeHash);
        if (code) return code;
      }

      await sleep(250);
    }

    throw new Error('Timed out waiting for email verification code');
  } finally {
    await sql.end({ timeout: 5 });
  }
}
