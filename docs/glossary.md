# Glossary

Definitions of protocol and DeFi terminology used across the Invoice Liquidity Network (ILN) documentation and codebase. Terms are listed alphabetically. Cross-references to other glossary entries appear in **bold**; links point to the relevant documentation or source files.

---

## Insurance

### Claim

The process of requesting compensation from the **Insurance Pool** after an invoice defaults. Only the pool admin (the liquidity contract) can file claims on behalf of affected LPs; payouts are limited by the pool's **Coverage Cap**.

*See also:* **Coverage Cap**, **Default Protection**, **Insurance Pool**
*Frontend integration:* `claimInsurance()` in [`src/utils/soroban.ts`](../src/utils/soroban.ts)

### Coverage Cap

The maximum flat amount the **Insurance Pool** will pay out per **Claim**. Configured once at pool initialization and applied uniformly to every claim regardless of the size of the defaulted invoice.

*See also:* **Claim**, **Insurance Pool**

### Default Protection

Insurance coverage that compensates liquidity providers (LPs) for losses caused by invoice defaults. LPs obtain default protection by completing **Enrollment** in the **Insurance Pool** and paying a **Premium**; when an invoice they funded defaults, the pool compensates them via a **Claim**.

*See also:* **Claim**, **Enrollment**, **Insurance Pool**, **Premium**
*Frontend integration:* the LP dashboard's insurance panel ([`src/components/InsurancePoolPanel.tsx`](../src/components/InsurancePoolPanel.tsx)), gated by the `NEXT_PUBLIC_INSURANCE_POOL_ENABLED` flag (see [README — Environment Variables](../README.md))

### Enrollment

The act of registering an LP in the insurance program, making them eligible for **Default Protection**. Enrollment is optional and is completed by depositing a **Premium** into the **Insurance Pool**; an LP's enrollment status can be queried on-chain.

*See also:* **Default Protection**, **Insurance Pool**, **Premium**
*Frontend integration:* `getLPInsuranceStatus()` in [`src/utils/soroban.ts`](../src/utils/soroban.ts) and the [`useInsurance`](../src/hooks/useInsurance.ts) hook

### Insurance Pool

A smart contract that provides **Default Protection** for liquidity providers. LPs opt in voluntarily by paying **Premiums**; when an invoice they funded defaults, the pool compensates them through a **Claim**, up to the **Coverage Cap**. The contract lives in the ILN contracts repository under `contracts/insurance_pool/`.

*See also:* **Claim**, **Coverage Cap**, **Default Protection**, **Enrollment**, **Premium**
*Frontend integration:* `getInsurancePoolInfo()` in [`src/utils/soroban.ts`](../src/utils/soroban.ts); UI in [`src/components/InsurancePoolPanel.tsx`](../src/components/InsurancePoolPanel.tsx). See the [Architecture Overview](./architecture.md) for how frontend hooks reach Soroban contracts.

### Premium

A payment made by an LP to the **Insurance Pool** to obtain **Default Protection** coverage. Premiums are currently tracked as an accounting balance inside the pool contract (actual token transfers are a planned follow-up). The pool's premium rate is expressed in basis points (bps).

*See also:* **Default Protection**, **Enrollment**, **Insurance Pool**
*Frontend integration:* `depositPremium()` in [`src/utils/soroban.ts`](../src/utils/soroban.ts)
