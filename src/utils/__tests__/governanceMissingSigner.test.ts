import { describe, expect, it, vi } from 'vitest';
import {
  castVote,
  executeProposal,
  vetoProposal,
  delegateVotingPower,
  MissingSignerError,
} from '../governance';

describe('Governance Missing Signer Failures & Zero Random Fallback (#1060)', () => {
  const dummySignTx = vi.fn().mockResolvedValue('signed-tx-xdr');

  it('rejects castVote with explicit MissingSignerError when signer is missing', async () => {
    await expect(castVote(1, 'For', '', dummySignTx)).rejects.toThrow(MissingSignerError);
  });

  it('rejects executeProposal with explicit MissingSignerError when signer is missing', async () => {
    await expect(executeProposal(1, '', dummySignTx)).rejects.toThrow(MissingSignerError);
  });

  it('rejects vetoProposal with explicit MissingSignerError when admin address is missing', async () => {
    await expect(vetoProposal(1, '0xreason', '', dummySignTx)).rejects.toThrow(MissingSignerError);
  });

  it('rejects delegateVotingPower with explicit error when signer is missing', async () => {
    await expect(delegateVotingPower('GBBD...', '', dummySignTx)).rejects.toThrow();
  });
});
