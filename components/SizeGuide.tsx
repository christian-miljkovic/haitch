'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BODY_MEASUREMENTS_CM,
  CONVERSION_TABLES,
  DENIM_SIZES,
  DENIM_WAIST_CM,
  HAITCH_SIZES,
  cmToInches,
  type Region,
} from '@/lib/sizing';
import styles from './SizeGuide.module.css';

export default function SizeGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [region, setRegion] = useState<Region>('UNITED STATES');
  const [unit, setUnit] = useState<'cm' | 'inch'>('cm');
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

  const display = (cm: number) => (unit === 'cm' ? cm : cmToInches(cm));
  const conversion = CONVERSION_TABLES[region];

  return (
    <>
      <button className={styles.trigger} onClick={() => setIsOpen(true)}>
        SIZE GUIDE ›
      </button>

      {isOpen &&
        createPortal(
        <div className={styles.root}>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} aria-hidden="true" />
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Size guide">
            <header className={styles.header}>
              <h2 className={styles.title}>SIZE GUIDE</h2>
              <button
                ref={closeRef}
                className={styles.close}
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </header>

            <div className={styles.body}>
              <p className={styles.intro}>
                If you have any question regarding the sizing, the HAITCH atelier will be pleased
                to assist you.
              </p>
              <p className={styles.intro}>
                All HAITCH tailoring items are made to order in New York City.
              </p>

              <div className={styles.conversionSelect}>
                <label htmlFor="size-guide-region" className={styles.sectionLabel}>
                  SELECT CONVERSION TABLE
                </label>
                <select
                  id="size-guide-region"
                  className={styles.select}
                  value={region}
                  onChange={(e) => setRegion(e.target.value as Region)}
                >
                  {Object.keys(CONVERSION_TABLES).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <section aria-label="Ready to wear sizes">
                <h3 className={styles.sectionLabel}>SIZE GUIDE — READY TO WEAR</h3>
                <div className={styles.table}>
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>HAITCH SIZE</span>
                    {HAITCH_SIZES.map((s) => (
                      <span key={s} className={styles.cell}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>{conversion.label}</span>
                    {conversion.sizes.map((s, i) => (
                      <span key={i} className={styles.cell}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section aria-label="Body measurements">
                <div className={styles.measureHeader}>
                  <h3 className={styles.sectionLabel}>BODY MEASUREMENT</h3>
                  <fieldset className={styles.units}>
                    <legend className="visually-hidden">Unit</legend>
                    <label className={styles.unit}>
                      <input
                        type="radio"
                        name="size-guide-unit"
                        checked={unit === 'cm'}
                        onChange={() => setUnit('cm')}
                      />
                      CM
                    </label>
                    <label className={styles.unit}>
                      <input
                        type="radio"
                        name="size-guide-unit"
                        checked={unit === 'inch'}
                        onChange={() => setUnit('inch')}
                      />
                      INCH
                    </label>
                  </fieldset>
                </div>
                <div className={styles.table}>
                  {BODY_MEASUREMENTS_CM.map((m) => (
                    <div key={m.label} className={styles.row}>
                      <span className={styles.rowLabel}>{m.label}</span>
                      {m.values.map((v, i) => (
                        <span key={i} className={styles.cell}>
                          {display(v)}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </section>

              <section aria-label="Denim sizes">
                <h3 className={styles.sectionLabel}>SIZE GUIDE — DENIM</h3>
                <div className={styles.table}>
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>DENIM SIZE</span>
                    {DENIM_SIZES.map((s) => (
                      <span key={s} className={styles.cell}>
                        {s}
                      </span>
                    ))}
                    <span className={styles.cell} aria-hidden="true" />
                  </div>
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>WAIST</span>
                    {DENIM_WAIST_CM.map((v, i) => (
                      <span key={i} className={styles.cell}>
                        {display(v)}
                      </span>
                    ))}
                    <span className={styles.cell} aria-hidden="true" />
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}
