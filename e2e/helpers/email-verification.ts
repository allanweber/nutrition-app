import postgres from 'postgres';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      const rows = await sql<Array<{ code: string | null }>>`
        select (metadata->>'code') as code
        from security_event
        where type = 'email_verification_requested'
          and email = ${params.email}
        order by created_at desc
        limit 1
      `;

      const code = rows[0]?.code ?? null;
      if (code && /^\d{6}$/.test(code)) {
        return code;
      }

      await sleep(250);
    }

    throw new Error('Timed out waiting for email verification code');
  } finally {
    await sql.end({ timeout: 5 });
  }
}
