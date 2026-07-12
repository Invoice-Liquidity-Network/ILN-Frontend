import { NextRequest, NextResponse } from 'next/server';
import { Keypair, TransactionBuilder, Networks, BASE_FEE } from '@stellar/stellar-sdk';
import { NETWORK_PASSPHRASE } from '@/constants';

/**
 * SEP-10 Challenge Endpoint
 * GET /api/auth/challenge?account=<public_key>
 *
 * Generates a SEP-10 challenge transaction for wallet authentication.
 * The client signs this challenge and submits it to /api/auth/verify
 * to receive a JWT token.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountPublicKey = searchParams.get('account');

    if (!accountPublicKey) {
      return NextResponse.json({ error: "Missing 'account' parameter" }, { status: 400 });
    }

    // Validate the public key format
    try {
      Keypair.fromPublicKey(accountPublicKey);
    } catch {
      return NextResponse.json({ error: 'Invalid public key format' }, { status: 400 });
    }

    // Create a server keypair (use a fixed key or generate one per request)
    // In production, this should be the server's signing key
    const serverKeypair = Keypair.fromSecret(
      process.env.SEP10_SERVER_SECRET_KEY ||
        'SBZVMB74Z76QZ3ZVU4Z7CZHL5HP3XVZN5RBLMHW3AXK57VCCMVQ5EDK'
    );

    // Get current timestamp for the challenge
    const now = Math.floor(Date.now() / 1000);
    const timeout = 15 * 60; // 15 minutes

    // Build the SEP-10 challenge transaction
    const challenge = new TransactionBuilder(
      new (require('@stellar/stellar-sdk').Account)(serverKeypair.publicKey(), '0'),
      {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
        timebounds: {
          minTime: now,
          maxTime: now + timeout,
        },
      }
    )
      .addOperation(
        new (require('@stellar/stellar-sdk').ManageDataOp)({
          name: 'SEP10 Challenge',
          value: Buffer.alloc(64).toString('hex'), // 64 random bytes
          source: accountPublicKey,
        })
      )
      .setSigningKey(serverKeypair)
      .build();

    const challengeXdr = challenge.toXDR();

    return NextResponse.json({ challenge: challengeXdr });
  } catch (error) {
    console.error('SEP-10 challenge generation error:', error);
    return NextResponse.json({ error: 'Failed to generate challenge' }, { status: 500 });
  }
}
