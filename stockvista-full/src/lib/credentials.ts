/**
 * Addresses must be stored and looked up in one canonical form, or the same
 * person ends up with several accounts and cannot sign in to the one they
 * created. Registration and the credentials provider both go through here.
 *
 * Only case and surrounding whitespace are normalized. Provider-specific
 * rules (Gmail's dots, plus-addressing) are deliberately left alone: they
 * are not universal, and applying them would merge addresses that some
 * providers treat as distinct.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Deliberately permissive: a single @, no whitespace, and a dot in the
// domain. Anything stricter rejects valid addresses; real verification is a
// confirmation link, not a pattern.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

// The registration route and the sign-up form must agree on this, or the form
// accepts a password the API then rejects.
export const MIN_PASSWORD_LENGTH = 8;
