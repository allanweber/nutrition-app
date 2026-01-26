import postgres from 'postgres';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchLatestPasswordResetCode(params: {
  email: string;
  timeoutMs?: number;
}): Promise<string> {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  const timeoutMs = params.timeoutMs ?? 10_000;
  const start = Date.now();

  try {
    while (Date.now() - start < timeoutMs) {
      const userRows = await sql<Array<{ id: string }>>`
        select id
        from "user"
        where email = ${params.email}
        limit 1
      `;

      const userId = userRows[0]?.id ?? null;
      if (userId) {
        const rows = await sql<Array<{ identifier: string }>>`
          select identifier
          from verification
          where value = ${userId}
            and identifier like 'reset-password:%'
            and expires_at > now()
          order by created_at desc
          limit 1
        `;

        const identifier = rows[0]?.identifier ?? null;
        const code = identifier?.split(':')[1] ?? null;
        if (code && /^\d{6}$/.test(code)) {
          return code;
        }
      }

      await sleep(250);
    }

    throw new Error('Timed out waiting for password reset code');
  } finally {
    await sql.end({ timeout: 5 });
  }
}
