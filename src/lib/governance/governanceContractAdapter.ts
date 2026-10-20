/**
 * Centralized Governance Contract Adapter (#1059)
 *
 * Provides a unified, strongly-typed interface for all Soroban governance contract
 * reads, writes, and error normalization used across pages, hooks, and mutation flows.
 */

import {
  fetchProposals,
  fetchProposal,
  getVotingPower,
  getDelegationInfo,
  castVote,
  createProposal,
  executeProposal,
  vetoProposal,
  delegateVotingPower,
  type Proposal,
  type VoteChoice,
  type CreateProposalPayload,
  type DelegationInfo,
  type FetchProposalsOptions,
  type GovernanceMutationOptions,
  GovernanceReadError,
  VotingPowerError,
  MissingSignerError,
} from '@/utils/governance';

export type GovernanceAdapterErrorCode =
  | 'GOV_READ_FAILED'
  | 'GOV_VOTING_POWER_UNAVAILABLE'
  | 'GOV_MISSING_SIGNER'
  | 'GOV_SIGNATURE_REJECTED'
  | 'GOV_MUTATION_FAILED'
  | 'GOV_NETWORK_MISMATCH'
  | 'GOV_UNKNOWN';

export class GovernanceAdapterError extends Error {
  readonly code: GovernanceAdapterErrorCode;
  readonly originalError?: unknown;

  constructor(message: string, code: GovernanceAdapterErrorCode, originalError?: unknown) {
    super(`[${code}] ${message}`);
    this.name = 'GovernanceAdapterError';
    this.code = code;
    this.originalError = originalError;
  }
}

export function normalizeGovernanceError(err: unknown): GovernanceAdapterError {
  if (err instanceof GovernanceAdapterError) {
    return err;
  }

  const msg = err instanceof Error ? err.message : String(err);

  if (err instanceof MissingSignerError || msg.includes('MISSING_SIGNER')) {
    return new GovernanceAdapterError(msg, 'GOV_MISSING_SIGNER', err);
  }
  if (msg.includes('USER_REJECTED')) {
    return new GovernanceAdapterError(msg, 'GOV_SIGNATURE_REJECTED', err);
  }
  if (err instanceof VotingPowerError || msg.includes('VOTING_POWER_UNAVAILABLE')) {
    return new GovernanceAdapterError(msg, 'GOV_VOTING_POWER_UNAVAILABLE', err);
  }
  if (err instanceof GovernanceReadError || msg.includes('GOVERNANCE_READ_UNAVAILABLE')) {
    return new GovernanceAdapterError(msg, 'GOV_READ_FAILED', err);
  }
  if (msg.includes('NETWORK_MISMATCH')) {
    return new GovernanceAdapterError(msg, 'GOV_NETWORK_MISMATCH', err);
  }

  return new GovernanceAdapterError(msg, 'GOV_MUTATION_FAILED', err);
}

export class GovernanceContractAdapter {
  // ─── READ OPERATIONS ────────────────────────────────────────────────────────

  async listProposals(options: FetchProposalsOptions = {}): Promise<Proposal[]> {
    try {
      return await fetchProposals(options);
    } catch (err) {
      throw normalizeGovernanceError(err);
    }
  }

  async getProposal(id: number, options: FetchProposalsOptions = {}): Promise<Proposal | null> {
    try {
      return await fetchProposal(id, options);
    } catch (err) {
      throw normalizeGovernanceError(err);
    }
  }

  async getVotingPower(address: string): Promise<number> {
    try {
      return await getVotingPower(address);
    } catch (err) {
      throw normalizeGovernanceError(err);
    }
  }

  async getDelegation(address: string): Promise<DelegationInfo> {
    try {
      return await getDelegationInfo(address);
    } catch (err) {
      throw normalizeGovernanceError(err);
    }
  }

  // ─── MUTATION OPERATIONS ────────────────────────────────────────────────────

  async castVote(
    proposalId: number,
    choice: VoteChoice,
    signerAddress: string,
    signTx: (xdr: string) => Promise<string>,
    options: GovernanceMutationOptions = {},
  ): Promise<string> {
    try {
      return await castVote(proposalId, choice, signerAddress, signTx, options);
    } catch (err) {
      throw normalizeGovernanceError(err);
    }
  }

  async createProposal(
    payload: CreateProposalPayload,
    proposerAddress: string,
    signTx: (xdr: string) => Promise<string>,
    options: GovernanceMutationOptions = {},
  ): Promise<{ txHash: string; proposalId: number }> {
    try {
      return await createProposal(payload, proposerAddress, signTx, options);
    } catch (err) {
      throw normalizeGovernanceError(err);
    }
  }

  async executeProposal(
    proposalId: number,
    signerAddress: string,
    signTx: (xdr: string) => Promise<string>,
    options: GovernanceMutationOptions = {},
  ): Promise<string> {
    try {
      return await executeProposal(proposalId, signerAddress, signTx, options);
    } catch (err) {
      throw normalizeGovernanceError(err);
    }
  }

  async vetoProposal(
    proposalId: number,
    reasonHash: string,
    adminAddress: string,
    signTx: (xdr: string) => Promise<string>,
    options: GovernanceMutationOptions = {},
  ): Promise<string> {
    try {
      return await vetoProposal(proposalId, reasonHash, adminAddress, signTx, options);
    } catch (err) {
      throw normalizeGovernanceError(err);
    }
  }

  async delegate(
    delegateAddress: string | null,
    signerAddress: string,
    signTx: (xdr: string) => Promise<string>,
    options: GovernanceMutationOptions = {},
  ): Promise<string> {
    try {
      return await delegateVotingPower(delegateAddress, signerAddress, signTx, options);
    } catch (err) {
      throw normalizeGovernanceError(err);
    }
  }
}

export const governanceAdapter = new GovernanceContractAdapter();
export default governanceAdapter;
