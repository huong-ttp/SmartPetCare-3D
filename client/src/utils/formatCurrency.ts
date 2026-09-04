/**
 * formatCurrency.ts
 * Định dạng số tiền VND hoặc bất kỳ đơn vị tiền tệ nào.
 */

/**
 * Format số thành VND.
 * @example formatCurrency(150000) → "150.000 ₫"
 */
export function formatCurrency(
  amount: number,
  currency = "VND",
  locale = "vi-VN"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Rút gọn số tiền lớn.
 * @example formatCurrencyShort(32500000) → "32.5M ₫"
 */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B ₫`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M ₫`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K ₫`;
  }
  return `${amount} ₫`;
}
