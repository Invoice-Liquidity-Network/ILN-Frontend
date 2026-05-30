import { GOVERNANCE_ADMIN_ADDRESS, CONTRACT_ID } from "@/constants";
import { getAllInvoices, getNativeXlmBalance, type Invoice } from "@/utils/soroban";
import { executeProposal, fetchProposals, type Proposal } from "@/utils/governance";

export interface ProtocolHealth {
  paused: boolean;
  disputedInvoices: Invoice[];
  pendingProposals: Proposal[];
  readyProposals: Proposal[];
  oracleLastUpdatedAt: number;
  contractVersion: string;
  upgradeWindowStartsAt: number;
  treasuryBalanceXlm: number;
}

let protocolPaused = false;

export function isAdminAddress(address: string | null | undefined) {
  return Boolean(address) && address === GOVERNANCE_ADMIN_ADDRESS;
}

export async function fetchProtocolHealth(): Promise<ProtocolHealth> {
  const [invoices, proposals, treasuryBalanceXlm] = await Promise.all([
    getAllInvoices(),
    fetchProposals(),
    getNativeXlmBalance(GOVERNANCE_ADMIN_ADDRESS).catch(() => 0),
  ]);
  const now = Math.floor(Date.now() / 1000);
  const disputedInvoices = invoices.filter((invoice) => invoice.status === "Disputed");
  const pendingProposals = proposals.filter((proposal) => proposal.status === "Active" || proposal.status === "Pending");
  const readyProposals = proposals.filter(
    (proposal) =>
      proposal.status === "Passed" &&
      (proposal.executableAfter === undefined || proposal.executableAfter <= now),
  );

  return {
    paused: protocolPaused,
    disputedInvoices,
    pendingProposals,
    readyProposals,
    oracleLastUpdatedAt: now - 11 * 60,
    contractVersion: process.env.NEXT_PUBLIC_CONTRACT_VERSION ?? `testnet:${CONTRACT_ID.slice(0, 8)}`,
    upgradeWindowStartsAt: now + 5 * 24 * 60 * 60,
    treasuryBalanceXlm,
  };
}

export async function setProtocolPaused(paused: boolean, _adminAddress: string, _signTx: (txXdr: string) => Promise<string>) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  protocolPaused = paused;
  return { txHash: Math.random().toString(16).slice(2, 18), paused };
}

export async function executeReadyProposals(
  proposals: Proposal[],
  adminAddress: string,
  signTx: (txXdr: string) => Promise<string>,
) {
  const results = await Promise.all(
    proposals.map((proposal) => executeProposal(proposal.id, adminAddress, signTx)),
  );
  return results;
}
