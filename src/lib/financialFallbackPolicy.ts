/**
 * Financial Display Fallback Policy & Assertions (#1138)
 *
 * Enforces strict fail-closed integrity across financial display surfaces:
 * When RPC or Indexer endpoints fail, production views must surface honest
 * unavailable notices rather than plausible mock constants or fabricated metrics.
 */

export interface FallbackAuditReport {
  component: string;
  isProduction: boolean;
  substitutedData: boolean;
  honestNoticeEmitted: boolean;
  status: 'COMPLIANT' | 'VIOLATION';
}

/**
 * Asserts that a fallback path in production does not inject non-empty
 * or plausible synthetic financial data.
 */
export function verifyFinancialFallbackIntegrity(
  component: string,
  env: string,
  hasError: boolean,
  renderedDataCount: number,
  isNoticeRendered: boolean,
): FallbackAuditReport {
  const isProduction = env === 'production';

  // In production, when an error occurs, data must be 0/empty and an honest notice must be shown
  if (isProduction && hasError) {
    const substitutedData = renderedDataCount > 0;
    const honestNoticeEmitted = isNoticeRendered;

    if (substitutedData || !honestNoticeEmitted) {
      return {
        component,
        isProduction,
        substitutedData,
        honestNoticeEmitted,
        status: 'VIOLATION',
      };
    }
  }

  return {
    component,
    isProduction,
    substitutedData: false,
    honestNoticeEmitted: true,
    status: 'COMPLIANT',
  };
}
