/**
 * Locale-aware formatting utilities for numbers, dates, and currencies.
 * These formatters automatically adapt to the user's selected locale.
 */

/**
 * Format a number as currency with locale-aware formatting.
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @param locale - The locale to use (required)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with locale-aware formatting (e.g., percentages, decimals).
 * @param value - The value to format
 * @param options - Intl.NumberFormat options
 * @param locale - The locale to use (required)
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions,
  locale: string
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format a percentage with locale-aware formatting.
 * @param value - The decimal value (e.g., 0.05 for 5%)
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - The locale to use (required)
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  decimals: number = 2,
  locale: string
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a date with locale-aware formatting.
 * @param date - The date to format (Date object or timestamp)
 * @param options - Intl.DateTimeFormat options
 * @param locale - The locale to use (required)
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | number,
  options: Intl.DateTimeFormatOptions,
  locale: string
): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: options?.dateStyle || 'medium',
    timeStyle: options?.timeStyle || 'short',
    ...options,
  }).format(dateObj);
}

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days").
 * @param value - The numeric value
 * @param unit - The unit type (second, minute, hour, day, week, month, year)
 * @param locale - The locale to use (required)
 * @returns Formatted relative time string
 */
export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: string
): string {
  return new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto',
  }).format(value, unit);
}

/**
 * Format a token amount with proper decimal places based on token decimals.
 * @param amount - The raw amount (in smallest unit)
 * @param decimals - Number of decimals for the token
 * @param symbol - Token symbol (optional)
 * @param locale - The locale to use (required)
 * @returns Formatted token amount string
 */
export function formatTokenAmount(
  amount: bigint | number,
  decimals: number,
  symbol: string | undefined,
  locale: string
): string {
  const amountNum = typeof amount === 'bigint' ? Number(amount) : amount;
  const formattedAmount = amountNum / Math.pow(10, decimals);

  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(formattedAmount);

  return symbol ? `${formattedNumber} ${symbol}` : formattedNumber;
}
