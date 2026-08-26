# Cross-Repository Incident Coordination Protocol

This protocol coordinates incidents that affect the ILN frontend, smart contracts, indexer, or notifications. It complements the [frontend incident response process](./incident-response.md) and the [smart-contract indexer incident runbook](https://github.com/Invoice-Liquidity-Network/ILN-Smart-Contract/blob/dev/docs/indexer-incident-runbook.md).

## Escalation and handoff

1. The Frontend Lead opens the incident in `#sec-incidents`, records the UTC start time, severity, affected user journey, deployed frontend SHA, and the observed contract or indexer symptom.
2. The Smart Contract Lead acknowledges the handoff, owns the on-chain impact assessment, and records whether a pause is required. Contract-pause decisions remain with the contract team; the frontend must never attempt to pause a contract.
3. The Indexer/Notifications on-call acknowledges the handoff, reports `/health`, ingestion lag, and notification-delivery status, and follows its [monitoring runbook](https://github.com/Invoice-Liquidity-Network/ILN-Smart-Contract/blob/dev/docs/monitoring-runbook.md).
4. The Incident Commander records each acknowledgement and chooses the user-facing state: normal, degraded, or paused. The Communications Lead publishes the matching status-page update.

| Handoff | Owner | Required acknowledgement | Target |
| --- | --- | --- | --- |
| Frontend → Smart Contract | Smart Contract Lead (`@contract-leads`) | On-chain scope, pause decision, contract incident link | 10 minutes for SEV-1 |
| Frontend → Indexer/Notifications | Indexer/Notifications on-call | `/health`, lag, delivery status, incident link | 15 minutes for SEV-1 |
| Smart Contract → Frontend | Frontend Lead (`@frontend-leads`) | Maintenance banner state and affected-route status | 5 minutes after pause decision |
| Any technical lead → Communications | Communications Lead (`@comms-lead`) | Status-page copy and next-update time | 5 minutes after severity declaration |

Use role handles rather than personal names. The quarterly freshness workflow keeps those roles aligned with `.github/CODEOWNERS` and prompts maintainers to confirm the contact matrix.

## Contract pause and frontend degraded mode

When the Smart Contract Lead confirms a pause or degraded condition:

1. Record the decision, contract ID, and effective ledger/transaction hash in the incident channel.
2. The Frontend Lead enables `NEXT_PUBLIC_MAINTENANCE_MODE=true` in the production Vercel environment and redeploys using the procedure in [incident-response.md](./incident-response.md#step-1-execute-feature-flag-kill-switches).
3. Confirm the global maintenance banner is visible on a signed-out route and a wallet-connected route. Do not treat client-side dismissal as evidence that the banner is disabled for other users.
4. The Indexer/Notifications on-call confirms whether dashboard data is current, delayed, or unavailable; include that state in the public advisory.
5. Remove the flag only after the Smart Contract Lead confirms the protocol is safe to resume and the Incident Commander approves the recovery update.

## Tabletop exercise record

| Field | Result |
| --- | --- |
| Scenario | Contract pause caused by an oracle circuit trip; the frontend must immediately enter degraded mode while indexer data may lag. |
| Participants | Incident Commander, Frontend Lead, Smart Contract Lead, Indexer/Notifications on-call, Communications Lead. |
| Exercise format | Lightweight tabletop: each role walked through the handoff sequence and evidence it must provide. No production contract or deployment was changed. |
| Expected outcome | Contract team owns the pause decision; frontend exposes a global maintenance banner; indexer reports data freshness; Communications publishes one consistent advisory. |

### Findings and follow-ups

- A global frontend maintenance flag is required so a contract-level event can be communicated independently of feature-specific flags.
- The frontend must report the deployed SHA and banner state back to the incident channel; this makes the handoff auditable.
- Indexer freshness must be stated separately from contract availability, because a paused contract and a stale dashboard are distinct user impacts.
- The contact matrix needs a recurring owner check to prevent role handles from drifting.

## Evidence to retain

Attach the incident timeline, acknowledgement timestamps, Vercel deployment URL and SHA, banner screenshots from representative routes, contract pause/unpause transaction hashes, indexer `/health` output, and the status-page update links to the incident record.
