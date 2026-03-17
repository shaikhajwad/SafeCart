/**
 * Bangladesh phone number utilities – E.164 format: +880XXXXXXXXXX
 */

const BD_E164_REGEX = /^\+8801[3-9]\d{8}$/;

export function isValidBangladeshPhone(phone: string): boolean {
  return BD_E164_REGEX.test(phone);
}

/** Normalize a local BD number to E.164 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `+880${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `+880${digits}`;
  }
  return phone; // return as-is; let validation catch invalid format
}
