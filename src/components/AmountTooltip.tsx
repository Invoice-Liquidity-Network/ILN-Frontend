'use client';

/**
 * AmountTooltip — Issue #163
 *
 * Reusable wrapper that shows a fee-breakdown tooltip on hover (desktop)
 * or tap (mobile) for any USDC amount display that involves a discount.
 *
 * Usage:
 *   <AmountTooltip breakdown={{ type: 'freelancer', invoiceAmount: 1000n, discountBps: 300 }}>
 *     {formatUSDC(freelancerPayout)}
 *   </AmountTooltip>
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLocaleFormatting } from '@/hooks/useLocaleFormatting';

// ── Breakdown types ────────────────────────────────────────────────────────────

export type BreakdownType = 'freelancer' | 'lp' | 'protocol';

export interface FreelancerBreakdown {
  type: 'freelancer';
  /** Gross invoice amount in smallest token units */
  invoiceAmount: bigint;
  /** Discount in basis points (e.g. 300 = 3%) */
  discountBps: number;
}

export interface LPBreakdown {
  type: 'lp';
  amountSent: bigint;
  discountBps: number;
}

export interface ProtocolBreakdown {
  type: 'protocol';
  discountAmount: bigint;
  protocolFeeBps: number;
}

export type AmountBreakdown = FreelancerBreakdown | LPBreakdown | ProtocolBreakdown;

export type AmountToken = 'USDC' | 'EURC' | 'XLM';

// ── Helpers ────────────────────────────────────────────────────────────────────

const TOKEN_FORMATTING: Record<AmountToken, { decimals: number; currency?: string }> = {
  USDC: { decimals: 7, currency: 'USD' },
  EURC: { decimals: 7, currency: 'EUR' },
  XLM: { decimals: 7 },
};

function formatAmount(amount: bigint, token: AmountToken, locale: string): string {
  const { decimals, currency } = TOKEN_FORMATTING[token];
  const value = Number(amount) / 10 ** decimals;
  const options: Intl.NumberFormatOptions = {
    notation: 'compact',
    minimumFractionDigits: currency ? 2 : 0,
    maximumFractionDigits: currency ? 2 : decimals,
  };

  if (currency) {
    options.style = 'currency';
    options.currency = currency;
  }

  const formatted = new Intl.NumberFormat(locale, options).format(value);
  return currency ? formatted : `${formatted} ${token}`;
}

function bpsOf(amount: bigint, bps: number): bigint {
  return (amount * BigInt(bps)) / 10_000n;
}

function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

// ── Breakdown table builder ────────────────────────────────────────────────────

function buildRows(
  breakdown: AmountBreakdown,
  token: AmountToken,
  locale: string
): Array<{ label: string; value: string }> {
  if (breakdown.type === 'freelancer') {
    const { invoiceAmount, discountBps } = breakdown;
    const discount = bpsOf(invoiceAmount, discountBps);
    const payout = invoiceAmount - discount;
    return [
      { label: 'Invoice amount', value: formatAmount(invoiceAmount, token, locale) },
      {
        label: `Discount (${bpsToPercent(discountBps)})`,
        value: `−${formatAmount(discount, token, locale)}`,
      },
      { label: 'You receive', value: formatAmount(payout, token, locale) },
    ];
  }

  if (breakdown.type === 'lp') {
    const { amountSent, discountBps } = breakdown;
    const discount = bpsOf(amountSent, discountBps);
    const netYieldPct = (discountBps / 100).toFixed(2);
    return [
      { label: 'You sent', value: formatAmount(amountSent, token, locale) },
      { label: 'Discount earned', value: `+${formatAmount(discount, token, locale)}` },
      { label: `Net yield`, value: `${netYieldPct}%` },
    ];
  }

  // protocol
  const { discountAmount, protocolFeeBps } = breakdown;
  const fee = bpsOf(discountAmount, protocolFeeBps);
  const lpYield = discountAmount - fee;
  return [
    { label: 'Discount', value: formatAmount(discountAmount, token, locale) },
    {
      label: `Protocol fee (${bpsToPercent(protocolFeeBps)})`,
      value: `−${formatAmount(fee, token, locale)}`,
    },
    { label: 'LP yield', value: formatAmount(lpYield, token, locale) },
  ];
}

// ── Component ──────────────────────────────────────────────────────────────────

interface AmountTooltipProps {
  breakdown: AmountBreakdown;
  token?: AmountToken;
  children: React.ReactNode;
  className?: string;
}

export function AmountTooltip({
  breakdown,
  token = 'USDC',
  children,
  className = '',
}: AmountTooltipProps) {
  const { locale } = useLocaleFormatting();
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);
  const toggleOnTap = useCallback(() => setVisible((v) => !v), []);

  // Close on outside tap (mobile)
  useEffect(() => {
    if (!visible) return;
    const onOutside = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
    };
  }, [visible]);

  const rows = buildRows(breakdown, token, locale);

  return (
    <span
      ref={wrapperRef}
      className={`relative inline-block cursor-help ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onTouchStart={toggleOnTap}
      data-testid="amount-tooltip-wrapper"
    >
      {children}

      {visible && (
        <span
          role="tooltip"
          data-testid="amount-tooltip-content"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[200] min-w-[220px] rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-sm"
        >
          <table className="w-full border-collapse">
            <tbody>
              {rows.map(({ label, value }, i) => (
                <tr
                  key={i}
                  className={i === rows.length - 1 ? 'font-semibold border-t border-gray-100' : ''}
                >
                  <td className="py-0.5 pr-4 text-gray-600 whitespace-nowrap">{label}</td>
                  <td className="py-0.5 text-right whitespace-nowrap">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </span>
      )}
    </span>
  );
}

export default AmountTooltip;
