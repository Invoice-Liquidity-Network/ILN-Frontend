/**
 * React hook for locale-aware formatting using the current i18n locale.
 * Provides convenient formatting functions that automatically use the active locale.
 */

import { useTranslation } from 'react-i18next';
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  formatRelativeTime,
  formatTokenAmount,
} from '@/lib/formatting';

/**
 * Hook that provides locale-aware formatting functions.
 * All functions automatically use the current i18n locale.
 */
export function useLocaleFormatting() {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  return {
    /**
     * Format a number as currency
     */
    currency: (amount: number, currency?: string) =>
      formatCurrency(amount, currency || 'USD', locale),

    /**
     * Format a number with custom options
     */
    number: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, options || {}, locale),

    /**
     * Format a percentage
     */
    percentage: (value: number, decimals?: number) =>
      formatPercentage(value, decimals, locale),

    /**
     * Format a date
     */
    date: (date: Date | number, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, options || {}, locale),

    /**
     * Format relative time
     */
    relativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) =>
      formatRelativeTime(value, unit, locale),

    /**
     * Format a token amount
     */
    tokenAmount: (amount: bigint | number, decimals: number, symbol?: string) =>
      formatTokenAmount(amount, decimals, symbol, locale),

    /**
     * Get the current locale
     */
    locale,
  };
}
