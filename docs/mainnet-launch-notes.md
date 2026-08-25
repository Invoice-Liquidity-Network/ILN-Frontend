# ILN Frontend Mainnet Launch Notes

**Date:** [To be filled at launch]
**Version:** 1.0.0

---

## Welcome to the ILN Mainnet

The ILN (Invoice Liquidity Network) frontend is now live on the Stellar public network. This document explains what changes for you at the cutover and what to expect when switching from testnet to mainnet.

---

## What's Changing

### Network Switch

The ILN web application now connects to the **Stellar public network** (mainnet) instead of testnet. This means:

- **Real transactions**: All invoice operations, payments, and liquidity pool interactions now occur on the live Stellar network with real XLM and token values.
- **Real wallet balances**: Your connected wallet will show your actual mainnet balances, not testnet funds.
- **Real contract interactions**: The app now interacts with the deployed mainnet smart contracts for invoice factoring, governance, and other protocol features.

### What You Need to Do

#### 1. Switch Your Wallet to Mainnet

If you were using ILN on testnet, you'll need to switch your wallet (e.g., Freighter) to the Stellar public network:

- **Freighter**: Open Freighter settings → Network → Select "Public Network"
- **Other wallets**: Follow your wallet's instructions to switch from testnet to public network

#### 2. Verify Network Connection

After connecting your wallet to ILN:

- Check that the app displays "Public Network" or "Mainnet" in the network indicator
- Ensure no "Network mismatch" banner appears
- Verify that your wallet shows mainnet balances, not testnet balances

#### 3. What Stays the Same

- **Your wallet address**: Your Stellar public key remains the same across testnet and mainnet
- **The UI**: The interface and user experience are identical to testnet
- **Feature availability**: See below for which features are live at launch

---

## Features Available at Launch

### Live Features (Enabled by Default)

The following features are available immediately at mainnet launch:

- **Invoice Creation**: Create and manage real invoices on the mainnet
- **Invoice Funding**: Fund invoices using real XLM and supported tokens
- **Liquidity Provisioning**: Provide liquidity to the invoice factoring pool
- **Wallet Connection**: Connect your mainnet wallet (Freighter and compatible wallets)
- **Leaderboard**: View the live mainnet leaderboard for top liquidity providers
- **Governance View**: View governance proposals and voting status (read-only at launch)

### Features Shipping Dark (Disabled by Default)

The following features are **not enabled at launch** and will be enabled in future updates:

- **Insurance Pool**: The insurance pool widget is disabled at launch. It will be enabled once the insurance pool contract has been independently reviewed and audited for mainnet.
- **Oracle Verification**: The oracle badge component is disabled at launch. It will be enabled once the oracle data source is verified against mainnet feeds.
- **NFT Display**: Invoice NFT display is disabled at launch. It will be enabled once the mainnet NFT contract is deployed and verified.

**Why ship dark?** These features require additional mainnet-specific contract deployments and security reviews. Shipping them disabled allows us to launch the core invoice factoring functionality safely while we complete the additional reviews for these optional features.

---

## What's New vs. Testnet

### Honest Assessment

We're committed to honest, non-inflated communication. Here's what's actually new at mainnet launch:

**What's New:**
- Real transactions and balances on the Stellar public network
- Live invoice factoring with real economic value
- Mainnet-specific contract IDs and RPC endpoints
- Production-grade security hardening (DNSSEC, CAA records, secret rotation)

**What's the Same:**
- The UI and user experience are identical to testnet
- The feature set is intentionally conservative (see "Features Shipping Dark" above)
- No new product features are being introduced at launch—this is a network cutover, not a feature release

**What's Not Included:**
- No "v2" or major redesign at launch
- No new token launches or airdrops
- No experimental features—only core invoice factoring functionality

---

## Security Considerations

### Mainnet = Real Value

On mainnet, all transactions involve real value. Please:

- **Double-check transaction details** before signing in your wallet
- **Verify contract IDs** match the official mainnet contracts (documented in the deployment runbook)
- **Start small** if you're new to the protocol—test with small amounts first
- **Keep your wallet secure**—use hardware wallets or strong password protection

### Incident Response

If you suspect a security issue:

- **Do not sign transactions** if the app behaves unexpectedly
- **Verify the network** in your wallet shows "Public Network"
- **Report issues** via the GitHub issue tracker or security@iln.finance
- **Monitor official channels** for security advisories

---

## Getting Help

### Documentation

- **Deployment Runbook**: [docs/mainnet-deployment-runbook.md](mainnet-deployment-runbook.md) - Technical deployment details
- **Feature Flags**: [docs/feature-flags.md](feature-flags.md) - Feature flag reference
- **Incident Response**: [docs/incident-response.md](incident-response.md) - Security incident procedures

### Community

- **GitHub Issues**: Report bugs and feature requests at [github.com/Invoice-Liquidity-Network/ILN-Frontend](https://github.com/Invoice-Liquidity-Network/ILN-Frontend)
- **Discord**: [To be added] - Join for community support and updates
- **Twitter**: [To be added] - Follow for announcements

---

## Next Steps

1. **Switch your wallet** to the Stellar public network
2. **Connect to ILN** at [app.iln.finance](https://app.iln.finance)
3. **Verify the network** indicator shows mainnet
4. **Start small**—test with small amounts if you're new
5. **Provide feedback** via GitHub issues or community channels

---

## Post-Launch Roadmap

After the initial mainnet launch, we plan to:

1. **Enable Insurance Pool** - Once the insurance pool contract is audited and verified
2. **Enable Oracle Verification** - Once oracle data sources are verified against mainnet feeds
3. **Enable NFT Display** - Once the mainnet NFT contract is deployed
4. **Additional Features** - Based on community feedback and governance proposals

Stay tuned to official channels for announcements on feature enablements.

---

**Thank you for being part of the ILN mainnet launch!**
