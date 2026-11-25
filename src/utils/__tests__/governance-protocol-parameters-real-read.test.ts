/**
 * Regression guard for #844: `fetchProtocolParameters` must stay a real
 * on-chain read. It once returned MOCK_PROTOCOL_PARAMS behind a
 * "TODO: Replace with actual Soroban read-only calls" comment; the closed issue
 * and the code disagreed and nothing noticed. These checks read the source so
 * the mock cannot quietly come back.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(__dirname, '..', 'governance.ts'), 'utf8');

/** The body of one top-level `export async function <name>` up to the next top-level declaration. */
function functionBody(name: string): string {
  const start = source.indexOf(`export async function ${name}(`);
  expect(start, `${name} should exist in governance.ts`).toBeGreaterThanOrEqual(0);
  const rest = source.slice(start);
  const next = rest.slice(1).search(/\n(?:export |async function |function |\/\*\*)/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

describe('fetchProtocolParameters is a real on-chain read (#844)', () => {
  it('no longer references the mock parameter set anywhere in governance.ts', () => {
    expect(source).not.toMatch(/MOCK_PROTOCOL_PARAMS/);
  });

  it('carries no stale "replace with actual Soroban" TODO for #111', () => {
    expect(source).not.toMatch(/TODO:\s*Replace with actual Soroban/i);
  });

  it('delegates to fetchChainParameters with the governance contract and a contract reader', () => {
    const body = functionBody('fetchProtocolParameters');
    expect(body).toContain('fetchChainParameters(');
    expect(body).toContain('governanceContractId: GOVERNANCE_CONTRACT_ID');
    expect(body).toContain('readContract: readContractValue');
  });

  it('has no catch block that could swallow a failed read into defaults', () => {
    const body = functionBody('fetchProtocolParameters');
    expect(body).not.toMatch(/\bcatch\b/);
    expect(body).not.toMatch(/\bdefault(s)?\b.*\bparams?\b/i);
  });
});
