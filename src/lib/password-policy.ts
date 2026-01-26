export const PASSWORD_MIN_LENGTH = 8;

// Requires: at least one uppercase letter, one digit, and one "special" character.
// Special is defined as any non-alphanumeric ASCII character.
export const PASSWORD_POLICY_REGEX =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export const PASSWORD_POLICY_MESSAGE =
  'Password must contain at least one uppercase letter, one number, and one special character';

export function validatePasswordPolicy(password: string): string | undefined {
  if (!password) return 'Password is required';
  if (password.length < PASSWORD_MIN_LENGTH)
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  if (!PASSWORD_POLICY_REGEX.test(password)) return PASSWORD_POLICY_MESSAGE;
  return undefined;
}
