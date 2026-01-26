import { Resend } from 'resend';

let cachedResend: Resend | null = null;

function getResendClient(): Resend {
  if (cachedResend) return cachedResend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set');
  }

  cachedResend = new Resend(apiKey);
  return cachedResend;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  // E2E tests run with NODE_ENV=test and use a local DB; avoid attempting to
  // send real emails or requiring Resend env vars in that environment.
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('EMAIL_FROM is not set');
  }

  const resend = getResendClient();

  await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}
