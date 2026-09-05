'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { email as validEmail, required } from '@/lib/validation';
import FieldError from './FieldError';
import { GALLERY_IMAGES } from '@/lib/gallery';
import styles from './NewsletterModal.module.css';

const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID ?? 'placeholder';
// First portrait frame of the lookbook.
const MODAL_IMAGE = (GALLERY_IMAGES.find((g) => g.height > g.width) ?? GALLERY_IMAGES[0]).src;

export default function NewsletterModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [touched, setTouched] = useState({ name: false, email: false });
  const [submitted, setSubmitted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      opener?.focus();
    };
  }, [isOpen]);

  const nameError = required('Enter your full name.')(name);
  const emailError = validEmail(email);
  const shownNameError = submitted || touched.name ? nameError : null;
  const shownEmailError = submitted || touched.email ? emailError : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (nameError || emailError || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, form: 'newsletter' }),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <button className={styles.trigger} onClick={() => setIsOpen(true)}>
        NEWSLETTER
      </button>

      {isOpen &&
        createPortal(
          <div className={styles.root}>
            <div className={styles.overlay} onClick={() => setIsOpen(false)} aria-hidden="true" />
            <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Newsletter">
              <button
                ref={closeRef}
                className={styles.close}
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>

              <div className={styles.imageFrame}>
                <Image
                  src={MODAL_IMAGE}
                  alt="HAITCH editorial"
                  fill
                  sizes="(max-width: 767px) 100vw, 400px"
                  className={styles.image}
                />
              </div>

              <div className={styles.body}>
                {status === 'sent' ? (
                  <div className={styles.done}>
                    <p>THANK YOU.</p>
                    <p className={styles.doneNote}>You are on the list.</p>
                  </div>
                ) : (
                  <>
                    <h2 className={styles.title}>NEWSLETTER</h2>
                    <p className={styles.intro}>
                      New collections, launches and atelier news. Nothing more.
                    </p>
                    <form className={styles.form} onSubmit={submit} noValidate>
                      <div className={styles.field}>
                        <label htmlFor="newsletter-name">FULL NAME</label>
                        <input
                          id="newsletter-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                          aria-invalid={shownNameError ? true : undefined}
                          aria-describedby={shownNameError ? 'newsletter-name-error' : undefined}
                        />
                        <FieldError id="newsletter-name-error" message={shownNameError} />
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="newsletter-email">EMAIL</label>
                        <input
                          id="newsletter-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                          aria-invalid={shownEmailError ? true : undefined}
                          aria-describedby={shownEmailError ? 'newsletter-email-error' : undefined}
                        />
                        <FieldError id="newsletter-email-error" message={shownEmailError} />
                      </div>
                      <button type="submit" className={styles.submit} disabled={status === 'sending'}>
                        {status === 'sending' ? 'SENDING…' : 'SUBSCRIBE'}
                      </button>
                      {status === 'error' && (
                        <p className={styles.error} role="alert">
                          Something went wrong. Please try again.
                        </p>
                      )}
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
