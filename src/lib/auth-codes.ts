import crypto from 'node:crypto';

const CODE_REGEX = /^\d{6}$/;

export function generate6DigitCode(): string {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += crypto.randomInt(0, 10).toString();
  }
  return code;
}

export function isValid6DigitCode(code: string): boolean {
  return CODE_REGEX.test(code);
}

export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function minutesFromNow(minutes: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + minutes * 60 * 1000);
}

export function isExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
