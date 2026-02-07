/**
 * Formats numbers into compact form: 1.2K, 3.4M, 5.6B, 7.8T.
 */
export function formatNumberCompact(value) {
  if (value === null || value === undefined) return '0';
  const num = Number(value);
  if (!Number.isFinite(num)) return '∞';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  const units = [
    { v: 1e12, s: 'T' },
    { v: 1e9, s: 'B' },
    { v: 1e6, s: 'M' },
    { v: 1e3, s: 'K' }
  ];
  for (const u of units) {
    if (abs >= u.v) {
      return `${sign}${(abs / u.v).toFixed(1)}${u.s}`;
    }
  }
  return `${num}`;
}
