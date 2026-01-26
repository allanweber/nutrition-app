export function renderEmailVerificationCodeEmail(params: {
  code: string;
  expiresMinutes: number;
}): { subject: string; html: string; text: string } {
  const subject = 'Your Nutrition App verification code';
  const text = [
    'Your verification code is:',
    params.code,
    '',
    `This code expires in ${params.expiresMinutes} minutes.`,
    "If you didn't create an account, you can ignore this email.",
  ].join('\n');

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">Your verification code</h2>
      <p style="margin: 0 0 12px;">Use this code to verify your email address:</p>
      <p style="font-size: 28px; letter-spacing: 4px; font-weight: 700; margin: 0 0 12px;">${params.code}</p>
      <p style="margin: 0 0 12px;">This code expires in <strong>${params.expiresMinutes} minutes</strong>.</p>
      <p style="margin: 0; color: #666;">If you didn't create an account, you can ignore this email.</p>
    </div>
  `.trim();

  return { subject, html, text };
}

export function renderPasswordResetCodeEmail(params: {
  code: string;
  expiresMinutes: number;
}): { subject: string; html: string; text: string } {
  const subject = 'Your Nutrition App password reset code';
  const text = [
    'Your password reset code is:',
    params.code,
    '',
    `This code expires in ${params.expiresMinutes} minutes.`,
    "If you didn't request a password reset, you can ignore this email.",
  ].join('\n');

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">Password reset code</h2>
      <p style="margin: 0 0 12px;">Use this code to reset your password:</p>
      <p style="font-size: 28px; letter-spacing: 4px; font-weight: 700; margin: 0 0 12px;">${params.code}</p>
      <p style="margin: 0 0 12px;">This code expires in <strong>${params.expiresMinutes} minutes</strong>.</p>
      <p style="margin: 0; color: #666;">If you didn't request a password reset, you can ignore this email.</p>
    </div>
  `.trim();

  return { subject, html, text };
}
