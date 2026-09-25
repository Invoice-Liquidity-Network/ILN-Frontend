# Smart Contract Integration Status

This document tracks the integration status of Soroban smart contracts within the ILN Frontend codebase. It serves as a visibility guide for contributors and maintainers to know which features are fully backed by live on-chain contracts versus those that are currently stubbed, derived, or deferred.

> Interface source of truth: `Invoice-Liquidity-Network/ILN-Smart-Contract` (branch `dev`), `contracts/invoice_liquidity/src/lib.rs`.

## Integration Status Summary

| Module         | Sub-feature / Function                                  | Status       | Implementation File              | Notes / Tracking Issue Link                                                                                                                                                                           |
| :------------- | :------------------------------------------------------ | :----------- | :------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Invoices**   | `submitInvoice`                                         | **Real**     | `src/utils/soroban.ts`           | Calls `submit_invoice(freelancer, payer, amount, due_date, discount_rate, token, referral_code)` — token-aware with always-present `ReferralCode` union.                                              |
| **Invoices**   | `fundInvoice`                                           | **Real**     | `src/utils/soroban.ts`           | Calls `fund_invoice(funder, invoice_id, fund_amount, require_oracle_verification)`. Optional `requireOracleVerification` maps to the on-chain oracle circuit-breaker check (#784).                    |
| **Invoices**   | `markPaid`                                              | **Real**     | `src/utils/soroban.ts`           | Fully integrated.                                                                                                                                                                                     |
| **Invoices**   | `appealDefault`                                         | **Real**     | `src/utils/soroban.ts`           | Fully integrated.                                                                                                                                                                                     |
| **Invoices**   | `disputeInvoice`                                        | **Real**     | `src/utils/soroban.ts`           | Fully integrated.                                                                                                                                                                                     |
| **Invoices**   | `claimDefault`                                          | **Real**     | `src/utils/soroban.ts`           | Fully integrated.                                                                                                                                                                                     |
| **Invoices**   | `cancelInvoice`                                         | **Real**     | `src/utils/soroban.ts`           | Fully integrated.                                                                                                                                                                                     |
| **Invoices**   | `listInvoicesBySubmitter`                               | **Real**     | `src/utils/soroban.ts`           | Paginated `list_invoices_by_submitter(submitter, page, page_size)` with legacy `list_invoices_by_freelancer` fallback (#784).                                                                         |
| **Invoices**   | `listInvoicesByLp`                                      | **Real**     | `src/utils/soroban.ts`           | Paginated `list_invoices_by_lp(lp, page, page_size)` (#784).                                                                                                                                          |
| **Invoices**   | `listInvoicesByPayer`                                   | **Derived**  | `src/utils/soroban.ts`           | `list_invoices_by_payer` is not an entry point of the current ABI; role detection falls back to the `get_invoice` table scan. Returns `[]` on failure (#784).                                         |
| **Invoices**   | `updateLPWhitelist`                                     | **Deferred** | `src/utils/soroban.ts`           | No `update_lp_whitelist` entry point on any deployed contract. Gated behind `UPDATE_LP_WHITELIST_SUPPORTED = false`; the LP whitelist UI shows the governance-proposal notice (#783).                 |
| **Tokens**     | `getApprovedTokenIds`                                   | **Real**     | `src/utils/soroban.ts`           | `list_tokens` does not exist; approval is derived per configured candidate via `get_token_decimals(Address)` (#784).                                                                                  |
| **Tokens**     | `adminApproveToken`                                     | **Real**     | `src/utils/soroban.ts`           | Calls `add_token(token, decimals)` — decimals resolved from known metadata or a provided argument (#784).                                                                                             |
| **Tokens**     | `getTokenMetadata`                                      | **Real**     | `src/utils/soroban.ts`           | Reads `name`/`symbol`/`decimals` with fallback metadata.                                                                                                                                              |
| **Referrals**  | `getReferralStats`                                      | **Real**     | `src/utils/soroban.ts`           | Calls `get_referral_stats(code: BytesN<32>)`; parses both the `{total_invoices,total_volume}` struct and raw `u64` revisions (#784).                                                                  |
| **Oracle**     | `OracleBadge`                                           | **Real**     | `src/components/OracleBadge.tsx` | Feature-flagged badge with `circuit_tripped` / `data_stale` / `unconfigured` states matching the oracle registry ADR-010 (#785).                                                                      |
| **Insurance**  | `getInsurancePoolInfo`                                  | **Real**     | `src/utils/soroban.ts`           | Reads `get_total_reserve` / `get_premiums_paid` / `get_base_premium_rate_bps` (`insurance_pool` crate).                                                                                               |
| **Other**      | `getReputation` / `getPayerScore`                       | **Real**     | `src/utils/soroban.ts`           | Fully integrated.                                                                                                                                                                                     |
| **Reputation** | `getReputationEvents`, `getTopFreelancers`, `getTopLPs` | **Derived**  | `src/utils/soroban.ts`           | No direct on-chain entry points; tolerant alias chains with defaults. Consumers treat empty results gracefully.                                                                                       |
| **Governance** | `fetchProposals` / `getProposals`                       | **Real**     | `src/utils/governance.ts`        | Fully integrated with deployed `iln_governance` contract `list_proposals()`.                                                                                                                          |
| **Governance** | `getVotingPower`                                        | **Real**     | `src/utils/governance.ts`        | Simulates `balance(address)` on `ILN_TOKEN_CONTRACT_ID`.                                                                                                                                              |
| **Governance** | `fetchQuorumThreshold`                                  | **Real**     | `src/utils/governance.ts`        | Simulates `total_supply()` on `ILN_TOKEN_CONTRACT_ID` and calculates quorum requirement from on-chain supply.                                                                                         |
| **Governance** | `lookupToken`                                           | **Real**     | `src/utils/governance.ts`        | Simulates SEP-41 token `name` and `symbol` Soroban read calls without mock fallback on the happy path (#7).                                                                                           |
| **Governance** | `castVote`                                              | **Stubbed**  | `src/utils/governance.ts`        | Stubbed write-path: mutates in-memory proposals array and produces synthetic random hash; on-chain Soroban write transaction not yet wired (#10). See cross-link warning in [testing.md](testing.md). |
| **Governance** | `createProposal`                                        | **Stubbed**  | `src/utils/governance.ts`        | Stubbed write-path: appends to in-memory `MOCK_PROPOSALS` array and returns synthetic random hash (#10).                                                                                              |
| **Governance** | `executeProposal`                                       | **Stubbed**  | `src/utils/governance.ts`        | Stubbed write-path: mutates in-memory proposal status to `'Executed'` and returns synthetic random hash (#10).                                                                                        |
| **Governance** | `vetoProposal`                                          | **Stubbed**  | `src/utils/governance.ts`        | Stubbed write-path: records veto in memory and returns synthetic hash.                                                                                                                                |
| **Governance** | `delegateVotingPower` / `getDelegationInfo`             | **Stubbed**  | `src/utils/governance.ts`        | Stubbed: uses hardcoded mock delegation records.                                                                                                                                                      |
| **Governance** | `fetchProtocolParameters`                               | **Stubbed**  | `src/utils/governance.ts`        | Stubbed read-path: returns static `MOCK_PROTOCOL_PARAMS` object (#111).                                                                                                                               |
| **Governance** | `getProposalHistory` / `fetchVotesForAddress`           | **Derived**  | `src/utils/governance.ts`        | Derived: scans Horizon transaction stream for `VoteCast` events with fallback.                                                                                                                        |

## Details of Deferred / Derived Code & TODO Markers

### 1. LP Whitelist Manager — Deferred (#783)

Located in `src/utils/soroban.ts`:

```typescript
export const UPDATE_LP_WHITELIST_SUPPORTED = false;

export async function updateLPWhitelist(args: { invoiceId: bigint; whitelist: string[] }) {
  throw new Error('updateLPWhitelist is not supported by the deployed contract');
}
```

- **Status:** The current contract ABI exposes no `update_lp_whitelist` instruction, so this is deferred rather than stubbed.
- The `LPWhitelistManager` component gates add/remove behind `UPDATE_LP_WHITELIST_SUPPORTED` and renders the governance-proposal notice instead of broken actions.
- **Action Needed:** Flip `UPDATE_LP_WHITELIST_SUPPORTED` to `true` and replace the stub with a live transaction builder once the instruction lands on-chain.

### 2. `listInvoicesByPayer` — Derived From Table Scan (#784)

There is no `list_invoices_by_payer` entry point in the current ABI. The direct read attempt returns an empty list on current deployments, and `getWalletRoles` continues to detect payer roles through the `get_invoice` enumeration (`getAllInvoices`).

### 3. Reputation history & leaderboards — Derived

`getReputationEvents`, `getTopFreelancers`, and `getTopLPs` have no on-chain backing entry points yet; they use tolerant alias chains and return empty/default values when the reads fail. Consumers (e.g. the profile reputation sparkline, leaderboard) handle empty results gracefully.

### 4. Governance Reality Gap & Per-Function Code State

Investigation revealed that several governance tracking issues were previously closed after adding client-side mocks or unit tests that asserted against mock behavior, creating a false impression of full on-chain integration. The table above now enforces verified per-function code state rather than tracking issue closure state.

#### Process Note: Issue Closure Does Not Equal Real Implementation

A linked tracking issue closing does **not** itself mean the table row can be marked **Real**. A function's status must only be updated to **Real** after independent verification of the actual repository code:

1. **Read Paths**: Must simulate or read actual Soroban contract state via RPC without happy-path mock fallbacks.
2. **Write Paths**: Must construct valid transaction envelopes, call the provided `signTx` wallet callback with valid transaction XDR, submit the transaction to the network, and return a verified deterministic transaction hash (never synthetic random strings).
3. **Cross-Link with Testing**: In [Testing Documentation](testing.md), high test and mutation scores for stubbed functions (such as `castVote`) must be acknowledged as testing mock logic until the real on-chain transaction paths land.

Remaining stubs in `src/utils/governance.ts`:

- `castVote`: mutates in-memory tallies and generates random hash (#10)
- `createProposal`: pushes to in-memory `MOCK_PROPOSALS` array (#10)
- `executeProposal`: mutates in-memory proposal status (#10)
- `vetoProposal`: in-memory veto record
- `delegateVotingPower` / `getDelegationInfo`: in-memory mock delegations
- `fetchProtocolParameters`: static `MOCK_PROTOCOL_PARAMS` (#111)
