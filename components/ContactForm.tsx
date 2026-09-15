'use client';

import { useState } from 'react';
import { STUDIO_EMAIL } from '@/lib/studio';
import { email as validEmail, required, type Validator } from '@/lib/validation';
import FieldError from './FieldError';
import styles from './ContactForm.module.css';

type FieldKey = 'name' | 'email' | 'message';

const FIELDS: { key: FieldKey; label: string; type: string; autoComplete?: string; validate: Validator }[] = [
  {
    key: 'name',
    label: 'FULL NAME',
    type: 'text',
    autoComplete: 'name',
    validate: required('Enter your full name.'),
  },
  { key: 'email', label: 'EMAIL', type: 'email', autoComplete: 'email', validate: validEmail },
  { key: 'message', label: 'MESSAGE', type: 'textarea', validate: required('Enter a message.') },
];

// A question is a single thought, so the whole form is on one screen — unlike
// the appointment form, which walks through its fields one at a time.
export default function ContactForm() {
  const [values, setValues] = useState<Record<FieldKey, string>>({ name: '', email: '', message: '' });
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    name: false,
    email: false,
    message: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const errors = Object.fromEntries(
    FIELDS.map((field) => [field.key, field.validate(values[field.key])])
  ) as Record<FieldKey, string | null>;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (FIELDS.some((field) => errors[field.key]) || status === 'sending') return;

    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className={styles.done}>
        <p>THANK YOU.</p>
        <p className={styles.doneNote}>Your message is with the studio.</p>
      </div>
    );
  }

  return (
    <form className={styles.root} noValidate onSubmit={submit}>
      {FIELDS.map((field) => {
        const inputId = `contact-${field.key}`;
        const errorId = `${inputId}-error`;
        const shownError = submitted || touched[field.key] ? errors[field.key] : null;
        const fieldProps = {
          id: inputId,
          value: values[field.key],
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setValues((prev) => ({ ...prev, [field.key]: e.target.value })),
          onBlur: () => setTouched((prev) => ({ ...prev, [field.key]: true })),
          'aria-invalid': shownError ? true : undefined,
          'aria-describedby': shownError ? errorId : undefined,
          autoComplete: field.autoComplete,
        };

        return (
          <div className={styles.field} key={field.key}>
            <label htmlFor={inputId} className={styles.label}>
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea {...fieldProps} className={styles.textarea} rows={4} />
            ) : (
              <input {...fieldProps} className={styles.input} type={field.type} />
            )}
            <FieldError id={errorId} message={shownError} />
          </div>
        );
      })}

      <button type="submit" className={styles.submit} disabled={status === 'sending'}>
        {status === 'sending' ? 'SENDING…' : 'SEND'}
      </button>

      {status === 'error' && (
        <p className={styles.error} role="alert">
          Something went wrong. Please email {STUDIO_EMAIL}.
        </p>
      )}
    </form>
  );
}
