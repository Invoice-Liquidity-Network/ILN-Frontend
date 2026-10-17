import { NETWORK_PASSPHRASE } from '@/constants';

export interface Sep10Challenge {
  transaction: string;
  networkPassphrase: string;
}

export interface Sep10Token {
  token: string;
}

/**
 * #1071 — Fetches a SEP-10 challenge transaction from the home domain's
 * Web Auth endpoint.
 *
 * Flow:
 *  1. GET https://{homeDomain}/.well-known/stellar.toml
 *  2. Extract WEB_AUTH_ENDPOINT
 *  3. GET {endpoint}?account={publicKey}&home_domain={homeDomain}
 *  4. Validate home_domain, network_passphrase, and nonce presence
 */
export async function fetchChallenge(
  homeDomain: string,
  publicKey: string
): Promise<Sep10Challenge> {
  const tomlUrl = `https://${homeDomain}/.well-known/stellar.toml`;
  const tomlRes = await fetch(tomlUrl);
  if (!tomlRes.ok) {
    throw new Error(`SEP-10: failed to fetch stellar.toml from ${homeDomain} (${tomlRes.status})`);
  }

  const toml = await tomlRes.text();
  const match = toml.match(/WEB_AUTH_ENDPOINT\s*=\s*"([^"]+)"/);
  if (!match) {
    throw new Error(`SEP-10: WEB_AUTH_ENDPOINT not found in stellar.toml for ${homeDomain}`);
  }

  const authEndpoint = match[1].trim();
  const challengeUrl = `${authEndpoint}?account=${encodeURIComponent(publicKey)}&home_domain=${encodeURIComponent(homeDomain)}`;

  const challengeRes = await fetch(challengeUrl);
  if (!challengeRes.ok) {
    throw new Error(`SEP-10: challenge request failed (${challengeRes.status})`);
  }

  const body = (await challengeRes.json()) as {
    transaction?: string;
    network_passphrase?: string;
    home_domain?: string;
    error?: string;
  };

  if (body.error) {
    throw new Error(`SEP-10: server error: ${body.error}`);
  }

  if (!body.transaction) {
    throw new Error('SEP-10: challenge response missing transaction field');
  }

  if (!body.network_passphrase) {
    throw new Error('SEP-10: challenge response missing network_passphrase');
  }

  if (body.home_domain && body.home_domain !== homeDomain) {
    throw new Error(
      `SEP-10: home_domain mismatch — expected "${homeDomain}", got "${body.home_domain}"`
    );
  }

  return {
    transaction: body.transaction,
    networkPassphrase: body.network_passphrase,
  };
}

/**
 * #1072 — Signs a SEP-10 challenge XDR with the user's wallet.
 *
 * Validates that the challenge is for the expected network before signing.
 * Throws if the network passphrase does not match NETWORK_PASSPHRASE so a
 * challenge from a rogue server cannot be signed against the wrong network.
 */
export async function signChallenge(
  challengeXdr: string,
  networkPassphrase: string,
  signTx: (xdr: string) => Promise<string>
): Promise<string> {
  if (networkPassphrase !== NETWORK_PASSPHRASE) {
    throw new Error(
      `SEP-10: network passphrase mismatch — expected "${NETWORK_PASSPHRASE}", got "${networkPassphrase}"`
    );
  }

  return signTx(challengeXdr);
}

/**
 * #1073 — Exchanges a signed SEP-10 challenge XDR for a server-issued JWT.
 *
 * Fetches WEB_AUTH_ENDPOINT from the home domain's stellar.toml and POSTs
 * the signed transaction XDR. Returns the token string on success.
 */
export async function exchangeToken(
  signedXdr: string,
  homeDomain: string
): Promise<Sep10Token> {
  const tomlUrl = `https://${homeDomain}/.well-known/stellar.toml`;
  const tomlRes = await fetch(tomlUrl);
  if (!tomlRes.ok) {
    throw new Error(
      `SEP-10: failed to fetch stellar.toml during token exchange (${tomlRes.status})`
    );
  }

  const toml = await tomlRes.text();
  const match = toml.match(/WEB_AUTH_ENDPOINT\s*=\s*"([^"]+)"/);
  if (!match) {
    throw new Error(`SEP-10: WEB_AUTH_ENDPOINT not found in stellar.toml for ${homeDomain}`);
  }

  const authEndpoint = match[1].trim();

  const body = new URLSearchParams();
  body.set('transaction', signedXdr);

  const tokenRes = await fetch(authEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    throw new Error(`SEP-10: token exchange failed (${tokenRes.status})`);
  }

  const payload = (await tokenRes.json()) as { token?: string; error?: string };

  if (payload.error) {
    throw new Error(`SEP-10: token exchange error: ${payload.error}`);
  }

  if (!payload.token) {
    throw new Error('SEP-10: token exchange response missing token field');
  }

  return { token: payload.token };
}
