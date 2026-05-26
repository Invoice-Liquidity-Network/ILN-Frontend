import { addToken as addFreighterToken } from "@stellar/freighter-api";
import { Asset, Horizon, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { HORIZON_URL, NETWORK_PASSPHRASE } from "@/constants";
import type { SupportedTokenInfo } from "@/utils/supportedTokens";

export interface AddTrustlineResult {
  hash?: string;
  contractId?: string;
}

export async function addTokenTrustline(
  token: SupportedTokenInfo,
  address: string,
  signTx: (txXdr: string) => Promise<string>
): Promise<AddTrustlineResult> {
  if (token.isNative) {
    throw new Error("XLM is the native Stellar asset and does not require a trustline.");
  }
  if (!token.issuerAddress) {
    const result = await addFreighterToken({
      contractId: token.contractId,
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    if (result.error) {
      throw new Error(result.error.message || `Unable to add ${token.assetCode} to Freighter.`);
    }
    return { contractId: result.contractId || token.contractId };
  }

  const server = new Horizon.Server(HORIZON_URL);
  const account = await server.loadAccount(address);
  const asset = new Asset(token.assetCode, token.issuerAddress);

  const transaction = new TransactionBuilder(account, {
    fee: await server.fetchBaseFee().then(String),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.changeTrust({ asset }))
    .setTimeout(60)
    .build();

  const signedXdr = await signTx(transaction.toXDR());
  const signedTransaction = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const result = await server.submitTransaction(signedTransaction);

  return { hash: result.hash };
}
