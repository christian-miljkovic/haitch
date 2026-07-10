// Size conversions and body measurements for the size guide.
// NOTE: standard menswear values — replace with HAITCH's real garment
// measurements when the brand provides them (their live site's own size
// chart is currently empty).

export const HAITCH_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export const CONVERSION_TABLES = {
  'UNITED STATES': { label: 'US SIZE', sizes: ['34', '36', '38', '40', '42', '44'] },
  EUROPE: { label: 'EU SIZE', sizes: ['44', '46', '48', '50', '52', '54'] },
  'UNITED KINGDOM': { label: 'UK SIZE', sizes: ['34', '36', '38', '40', '42', '44'] },
} as const;

export type Region = keyof typeof CONVERSION_TABLES;

// Body measurements in centimeters, per size.
export const BODY_MEASUREMENTS_CM: { label: string; values: number[] }[] = [
  { label: 'CHEST', values: [88, 94, 100, 106, 112, 118] },
  { label: 'WAIST', values: [73, 78, 84, 90, 96, 102] },
  { label: 'HIP', values: [90, 96, 102, 108, 114, 120] },
];

export const DENIM_SIZES = ['28', '30', '32', '34', '36'];
export const DENIM_WAIST_CM = [71, 76, 81, 86, 91];

export function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 2) / 2;
}
