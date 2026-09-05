'use client';

import { useState } from 'react';
import { email, phone, required, type Validator } from '@/lib/validation';
import FieldError from './FieldError';
import styles from './AppointmentForm.module.css';

const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID ?? 'placeholder';

type FieldKey = 'name' | 'email' | 'phone' | 'message';

const FIELDS: { key: FieldKey; label: string; type: string; validate: Validator }[] = [
  { key: 'name', label: 'FULL NAME', type: 'text', validate: required('Enter your full name.') },
  { key: 'email', label: 'EMAIL', type: 'email', validate: email },
  { key: 'phone', label: 'PHONE NUMBER', type: 'tel', validate: phone },
  { key: 'message', label: 'MESSAGE', type: 'textarea', validate: required('Enter a message.') },
];

export default function AppointmentForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<FieldKey, string>>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const field = FIELDS[step];
  const isLast = step === FIELDS.length - 1;
  const error = field.validate(values[field.key]);
  const shownError = touched ? error : null;
  const inputId = `appointment-${field.key}`;
  const errorId = `${inputId}-error`;

  const goTo = (next: number) => {
    setStep(next);
    setTouched(false);
  };

  const advance = () => {
    setTouched(true);
    if (!error && !isLast) goTo(step + 1);
  };

  const submit = async () => {
    setTouched(true);
    if (FIELDS.some((f) => f.validate(values[f.key]))) return;
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

  const fieldProps = {
    id: inputId,
    value: values[field.key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value),
    onBlur: () => setTouched(true),
    'aria-invalid': shownError ? true : undefined,
    'aria-describedby': shownError ? errorId : undefined,
    autoFocus: true,
  };

  return (
    <form
      className={styles.root}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (isLast) submit();
        else advance();
      }}
    >
      <p className={styles.counter} aria-live="polite">
        {step + 1} / {FIELDS.length}
      </p>

      <div className={styles.field} key={field.key}>
        <label htmlFor={inputId} className={styles.label}>
          {field.label}
        </label>
        {field.type === 'textarea' ? (
          <textarea {...fieldProps} className={styles.textarea} rows={4} />
        ) : (
          <input
            {...fieldProps}
            className={styles.input}
            type={field.type}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                advance();
              }
            }}
          />
        )}
        <FieldError id={errorId} message={shownError} />
      </div>

      {isLast ? (
        <button type="submit" className={styles.submit} disabled={status === 'sending'}>
          {status === 'sending' ? 'SENDING…' : 'SUBMIT'}
        </button>
      ) : (
        <button type="submit" className={styles.next}>
          NEXT
        </button>
      )}

      {step > 0 && (
        <button type="button" className={styles.back} onClick={() => goTo(step - 1)}>
          BACK
        </button>
      )}

      {status === 'error' && (
        <p className={styles.error} role="alert">
          Something went wrong. Please email info@haitch-usa.com.
        </p>
      )}
    </form>
  );
}
