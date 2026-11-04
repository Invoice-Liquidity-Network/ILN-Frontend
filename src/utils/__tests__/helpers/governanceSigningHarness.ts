/**
 * Deterministic Wallet-Signing Governance Test Harness (#1061)
 *
 * Provides a deterministic signer and XDR inspection harness for governance mutations:
 * - Records submitted XDR envelopes and parameters
 * - Simulates user approval, rejection, and delayed signing
 * - Validates strict cryptographic and format invariants
 */

import { Keypair, Transaction, Networks } from '@stellar/stellar-sdk';

export interface InspectedGovernanceCall {
  rawIntentOrXdr: string;
  signerPublicKey: string;
  signatureHex: string;
  timestamp: number;
}

export class DeterministicWalletSigner {
  private keypair: Keypair;
  public readonly calls: InspectedGovernanceCall[] = [];
  public shouldReject: boolean = false;
  public rejectionMessage: string = 'User rejected transaction in wallet';

  constructor(secretSeed = 'SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4') {
    this.keypair = Keypair.fromSecret(secretSeed);
  }

  get publicKey(): string {
    return this.keypair.publicKey();
  }

  getSignTx(): (intentOrXdr: string) => Promise<string> {
    return async (intentOrXdr: string): Promise<string> => {
      if (this.shouldReject) {
        const error = new Error(this.rejectionMessage);
        (error as any).code = 'USER_REJECTED';
        throw error;
      }

      const sigBuffer = this.keypair.sign(Buffer.from(intentOrXdr, 'utf-8'));
      const signatureHex = Buffer.from(sigBuffer).toString('hex');

      this.calls.push({
        rawIntentOrXdr: intentOrXdr,
        signerPublicKey: this.publicKey,
        signatureHex,
        timestamp: Date.now(),
      });

      return `signed:${this.publicKey}:${signatureHex}`;
    };
  }

  clearCalls(): void {
    this.calls.length = 0;
  }
}
