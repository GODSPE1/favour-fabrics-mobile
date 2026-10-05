/** Prices are stored in kobo (₦1 = 100 kobo). */
export function formatNaira(kobo: number): string {
  const naira = Number(kobo || 0) / 100
  return `₦${naira.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
}
