import { EMAIL_RE } from './format';

// A validator returns the message to show under the field, or null when valid.
export type Validator = (value: string) => string | null;

export const required =
  (message: string): Validator =>
  (value) =>
    value.trim() ? null : message;

export const email: Validator = (value) =>
  EMAIL_RE.test(value.trim()) ? null : 'Enter a valid email address.';

const PHONE_MESSAGE = 'Enter a valid phone number.';

export const phone: Validator = (value) =>
  value.replace(/\D/g, '').length >= 7 ? null : PHONE_MESSAGE;

export const optionalPhone: Validator = (value) => (value.trim() ? phone(value) : null);

export const none: Validator = () => null;
