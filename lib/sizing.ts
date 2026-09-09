// Garment measurements from the HAITCH line sheet ("SIZE CHARTS" slide), in inches.

// A row is either garment measurements in inches (converted by the unit toggle)
// or plain size labels that read the same in any unit, like trouser waist sizes.
export type SizeRow = { label: string; inches: number[] } | { label: string; labels: string[] };
export type SizeChart = { name: string; sizes: string[]; rows: SizeRow[] };

const TAILORING_SIZES = ['44', '46', '48', '50', '52', '54', '56', '58'];

// Transcribed from the "SIZE CHARTS" slide of the Website 2.0 Outline deck, in slide order.
export const SIZE_CHARTS: SizeChart[] = [
  {
    name: 'Trouser',
    sizes: TAILORING_SIZES,
    rows: [
      { label: 'Waist Size', labels: ['28', '30', '32', '34', '36', '38', '40', '42'] },
      { label: 'Inseam', inches: [32, 32, 32, 32, 32, 32, 32, 32] },
      { label: 'Outseam', inches: [41.5, 42, 42.5, 43, 43.5, 44, 44.5, 45] },
      { label: 'Bottom Width', inches: [17.75, 18.25, 18.5, 19, 19.5, 19.75, 20.25, 20.5] },
    ],
  },
  {
    name: 'Jacket',
    sizes: TAILORING_SIZES,
    rows: [
      { label: 'Shoulders', inches: [18, 18.5, 19, 19.5, 20, 20.5, 21, 21.5] },
      { label: 'Half Waist', inches: [17.75, 18.5, 19.25, 20, 20.75, 21.5, 22.25, 23] },
      { label: 'Sleeve Length', inches: [24.25, 24.5, 24.75, 25, 25.25, 25.5, 25.75, 26] },
      { label: 'Back Length', inches: [28.5, 29, 29.25, 29.75, 30.25, 30.5, 31, 31.25] },
    ],
  },
  {
    name: 'Shirts',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    rows: [
      { label: 'Neck', inches: [15, 15.5, 16, 16.5, 17, 17.5] },
      { label: 'Point to Point', inches: [18.5, 19, 19.5, 20, 20.5, 21] },
      { label: 'Sleeve Length', inches: [24.75, 25.25, 25.75, 26.25, 26.75, 27.25] },
      { label: 'Back Length', inches: [29.5, 30, 30.5, 31, 31.5, 32] },
    ],
  },
];

export type Unit = 'inch' | 'cm';

const FRACTIONS: Record<number, string> = { 0.25: '1/4', 0.5: '1/2', 0.75: '3/4' };

// 18.5 → 18 1/2", matching how the line sheet writes measurements.
export function formatInches(inches: number): string {
  const whole = Math.floor(inches);
  const fraction = FRACTIONS[Math.round((inches - whole) * 4) / 4];
  return `${whole}${fraction ? ` ${fraction}` : ''}"`;
}

export function formatCm(inches: number): string {
  return `${Math.round(inches * 2.54)} cm`;
}

export function formatMeasurement(inches: number, unit: Unit): string {
  return unit === 'cm' ? formatCm(inches) : formatInches(inches);
}
