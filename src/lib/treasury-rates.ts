const TREASURY_3M_TBILL_URL =
  'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/avg_interest_rates' +
  '?filter=security_type_desc:eq:Treasury Bill,security_desc:eq:3-Month' +
  '&sort=-record_date&page[size]=1';

const DEFAULT_TBILL_YIELD_PCT = 5.25;

interface TreasuryRateRecord {
  avg_interest_rate_amt?: string;
}

interface TreasuryRateResponse {
  data?: TreasuryRateRecord[];
}

/** Fetch the latest 3-month T-bill average rate (annual %, illustrative). */
export async function fetchThreeMonthTBillRatePct(): Promise<number> {
  try {
    const response = await fetch(TREASURY_3M_TBILL_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86_400 },
    });
    if (!response.ok) {
      return DEFAULT_TBILL_YIELD_PCT;
    }
    const payload = (await response.json()) as TreasuryRateResponse;
    const rate = parseFloat(payload.data?.[0]?.avg_interest_rate_amt ?? '');
    return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_TBILL_YIELD_PCT;
  } catch {
    return DEFAULT_TBILL_YIELD_PCT;
  }
}
