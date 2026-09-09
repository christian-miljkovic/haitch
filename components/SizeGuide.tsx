'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SIZE_CHARTS, formatMeasurement, type Unit } from '@/lib/sizing';
import styles from './SizeGuide.module.css';

export default function SizeGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [unit, setUnit] = useState<Unit>('inch');
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
                  If you have any question regarding the sizing, the HAITCH showroom will be pleased
                  to assist you.
                </p>
                <p className={styles.intro}>
                  All HAITCH tailoring items are made to order in New York City.
                </p>

                <div className={styles.measureHeader}>
                  <h3 className={styles.sectionLabel}>GARMENT MEASUREMENTS</h3>
                  <fieldset className={styles.units}>
                    <legend className="visually-hidden">Unit</legend>
                    <label className={styles.unit}>
                      <input
                        type="radio"
                        name="size-guide-unit"
                        checked={unit === 'inch'}
                        onChange={() => setUnit('inch')}
                      />
                      INCH
                    </label>
                    <label className={styles.unit}>
                      <input
                        type="radio"
                        name="size-guide-unit"
                        checked={unit === 'cm'}
                        onChange={() => setUnit('cm')}
                      />
                      CM
                    </label>
                  </fieldset>
                </div>

                {SIZE_CHARTS.map((chart) => (
                  <section key={chart.name} className={styles.chart}>
                    <h3 className={styles.sectionLabel} id={`size-chart-${chart.name}`}>
                      {chart.name.toUpperCase()}
                    </h3>
                    <div className={styles.scroller}>
                      <table className={styles.table} aria-labelledby={`size-chart-${chart.name}`}>
                        <thead>
                          <tr>
                            <th scope="col" className={styles.rowLabel}>
                              Size
                            </th>
                            {chart.sizes.map((size) => (
                              <th key={size} scope="col" className={styles.cell}>
                                {size}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {chart.rows.map((row) => (
                            <tr key={row.label}>
                              <th scope="row" className={styles.rowLabel}>
                                {row.label}
                              </th>
                              {row.inches.map((value, i) => (
                                <td key={i} className={styles.cell}>
                                  {formatMeasurement(value, unit)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}
              </div>
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}
