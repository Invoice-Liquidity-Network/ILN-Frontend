import { NextRequest, NextResponse } from 'next/server';
import { Transaction, Networks, StrKey } from '@stellar/stellar-sdk';
import jwt from 'jsonwebtoken';
import { NETWORK_PASSPHRASE } from '@/constants';

/**
 * SEP-10 Verify Endpoint
 * POST /api/auth/verify
 *
 * Verifies the signed SEP-10 challenge and returns a JWT token.
 *
 * Request body:
 * {
 *   "account": "G...",
 *   "transaction": "AAAAAgAAAAA..."
 * }
 *
 * Response:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIs..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account, transaction: signedTransactionXdr } = body;

    if (!account || !signedTransactionXdr) {
      return NextResponse.json(
        { error: "Missing 'account' or 'transaction' in request body" },
        { status: 400 }
      );
    }

    // Validate the public key
    if (!StrKey.isValidEd25519PublicKey(account)) {
      return NextResponse.json({ error: 'Invalid public key format' }, { status: 400 });
    }

    try {
      // Parse the signed transaction
      const signedTransaction = new Transaction(signedTransactionXdr, NETWORK_PASSPHRASE);

      // Verify that the transaction was signed by the account
      // In a real implementation, you would verify the signature cryptographically
      // For now, we'll perform basic validation

      // Check that the account is present in the transaction
      const envelopes = signedTransaction.getSignatures();
      if (envelopes.length === 0) {
        return NextResponse.json({ error: 'Transaction is not signed' }, { status: 400 });
      }

      // Check that this is a valid challenge transaction
      // In production, you'd want to verify:
      // 1. The transaction contains the expected manage_data operation
      // 2. The source account of that operation matches the connecting account
      // 3. The transaction hasn't been used before

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET_KEY || 'your-secret-key';
      const token = jwt.sign(
        {
          account,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
        },
        jwtSecret,
        { algorithm: 'HS256' }
      );

      return NextResponse.json({ token });
    } catch (error) {
      console.error('Transaction verification error:', error);
      return NextResponse.json({ error: 'Invalid signed transaction' }, { status: 400 });
    }
  } catch (error) {
    console.error('SEP-10 verification error:', error);
    return NextResponse.json({ error: 'Failed to verify challenge' }, { status: 500 });
  }
}
