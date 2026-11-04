import { describe, expect, it, beforeEach } from 'vitest';
import {
  castVote,
  executeProposal,
  vetoProposal,
  clearGovernanceIdempotencyCache,
  MissingSignerError,
} from '../governance';
import { DeterministicWalletSigner } from './helpers/governanceSigningHarness';
import { establishGovernanceTestSession, clearGovernanceTestSession } from './helpers/governanceSession';

describe('Wallet-Signing Governance Test Harness (#1061)', () => {
  let signer: DeterministicWalletSigner;

  beforeEach(() => {
    signer = new DeterministicWalletSigner();
    clearGovernanceIdempotencyCache();
    establishGovernanceTestSession(signer.publicKey);
  });

  it('exercises castVote mutation with deterministic signer and inspects intent', async () => {
    const txHash = await castVote(
      1,
      'For',
      signer.publicKey,
      signer.getSignTx(),
      { votingPower: 500000 },
    );

    expect(txHash).toMatch(/^[0-9a-fA-F]{64}$/);
    expect(signer.calls).toHaveLength(1);
    expect(signer.calls[0].rawIntentOrXdr).toContain('vote:1:For:');
    expect(signer.calls[0].signerPublicKey).toBe(signer.publicKey);
  });

  it('exercises executeProposal mutation with deterministic signer', async () => {
    const txHash = await executeProposal(
      1,
      signer.publicKey,
      signer.getSignTx(),
    );

    expect(txHash).toMatch(/^[0-9a-fA-F]{64}$/);
    expect(signer.calls).toHaveLength(1);
    expect(signer.calls[0].rawIntentOrXdr).toContain('execute:1:');
  });

  it('exercises vetoProposal with deterministic admin signer', async () => {
    const txHash = await vetoProposal(
      2,
      '0xdeadbeef1234',
      signer.publicKey,
      signer.getSignTx(),
    );

    expect(txHash).toMatch(/^[0-9a-fA-F]{64}$/);
    expect(signer.calls).toHaveLength(1);
    expect(signer.calls[0].rawIntentOrXdr).toContain('veto:2:0xdeadbeef1234');
  });

  it('handles user signature rejection cleanly without mutating state', async () => {
    signer.shouldReject = true;
    await expect(
      castVote(1, 'Against', signer.publicKey, signer.getSignTx(), { votingPower: 500000 }),
    ).rejects.toThrow();

    expect(signer.calls).toHaveLength(0);
  });

  it('fails with MissingSignerError if signer is empty', async () => {
    await expect(
      castVote(1, 'For', '', signer.getSignTx()),
    ).rejects.toThrow(MissingSignerError);
  });
});
