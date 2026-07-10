'use client';

import { useState } from 'react';
import styles from './AppointmentForm.module.css';

const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID ?? 'placeholder';

type FieldKey = 'name' | 'email' | 'phone' | 'message';

const FIELDS: { key: FieldKey; label: string; type: string; validate: (v: string) => boolean }[] = [
  { key: 'name', label: 'FULL NAME', type: 'text', validate: (v) => v.trim().length > 1 },
  {
    key: 'email',
    label: 'EMAIL',
    type: 'email',
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  },
  {
    key: 'phone',
    label: 'PHONE NUMBER',
    type: 'tel',
    validate: (v) => v.replace(/\D/g, '').length >= 7,
  },
  { key: 'message', label: 'MESSAGE', type: 'textarea', validate: (v) => v.trim().length > 0 },
];

export default function AppointmentForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<FieldKey, string>>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const field = FIELDS[step];
  const isLast = step === FIELDS.length - 1;
  const valid = field.validate(values[field.key]);

  const advance = () => {
    if (valid && !isLast) setStep((s) => s + 1);
  };

  const submit = async () => {
    if (!FIELDS.every((f) => f.validate(values[f.key]))) return;
    setStatus('sending');
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
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
        <p className={styles.doneNote}>We will be in touch shortly to confirm your appointment.</p>
      </div>
    );
  }

  const setValue = (v: string) => setValues((prev) => ({ ...prev, [field.key]: v }));

  return (
    <div className={styles.root}>
      <p className={styles.counter}>
        {step + 1} / {FIELDS.length}
      </p>

      <div className={styles.field} key={field.key}>
        <label htmlFor={`appointment-${field.key}`} className={styles.label}>
          {field.label}
        </label>
        {field.type === 'textarea' ? (
          <textarea
            id={`appointment-${field.key}`}
            className={styles.textarea}
            rows={4}
            value={values[field.key]}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        ) : (
          <input
            id={`appointment-${field.key}`}
            className={styles.input}
            type={field.type}
            value={values[field.key]}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                advance();
              }
            }}
            autoFocus
          />
        )}
      </div>

      {isLast ? (
        <button className={styles.submit} onClick={submit} disabled={!valid || status === 'sending'}>
          {status === 'sending' ? 'SENDING…' : 'SUBMIT'}
        </button>
      ) : (
        <button className={styles.next} onClick={advance} disabled={!valid}>
          NEXT
        </button>
      )}

      {status === 'error' && (
        <p className={styles.error} role="alert">
          Something went wrong. Please email info@haitch-usa.com.
        </p>
      )}
    </div>
  );
}
