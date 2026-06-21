# Developer quickstart

This guide gets a new contributor from a fresh clone to a running ILN
Frontend development environment. It focuses on the frontend repository and
uses the npm workflow that is currently committed in `package-lock.json`.

## Prerequisites

- Node.js 20 or newer.
- npm, included with Node.js.
- Git, for cloning and branching.
- Freighter browser extension, for wallet-connected flows.
- Stellar CLI, for testnet and contract workflow checks.
- A Stellar testnet account funded with Friendbot.

Optional tools:

- Docker Desktop, if you want to run local supporting services.
- Playwright browser dependencies, for end-to-end tests.
- A Chromatic project token, only if you need to run visual regression checks.

## Platform notes

Linux and macOS can follow the commands below directly.

On Windows, use WSL 2 with Ubuntu for the most consistent Node, Playwright, and
Stellar CLI behavior. Run the commands inside the WSL shell, not from a Windows
PowerShell path mounted into WSL.

## 1. Clone the repository

```bash
git clone https://github.com/Invoice-Liquidity-Network/ILN-Frontend.git
cd ILN-Frontend
```

Create a working branch:

```bash
git checkout -b docs/developer-quickstart
```

## 2. Install dependencies

```bash
npm install
```

The repository currently uses `package-lock.json`, so npm is the safest default
package manager. If maintainers later move the project to pnpm, follow the
updated lockfile and README instead.

## 3. Create local environment variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

The defaults target Stellar testnet and are enough for many UI and mock-backed
flows. Fill optional values only when you need the related feature:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Supabase
  backed reminder preferences.
- `SUPABASE_SERVICE_ROLE_KEY` for server-side Supabase admin access.
- `RESEND_API_KEY` and `CRON_SECRET` for reminder email routes.
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` for WalletConnect.
- `CHROMATIC_PROJECT_TOKEN` for Chromatic visual regression testing.

Do not commit real secrets in `.env.local`.

## 4. Start the development server

```bash
npm run dev
```

Open http://localhost:3000.

For wallet flows, unlock Freighter and connect to Stellar testnet. If your
testnet account has no XLM, fund it with Friendbot before testing transactions.

## 5. Verify the app locally

Run the production build:

```bash
npm run build
```

Run unit and component tests:

```bash
npm test
```

Run lint checks:

```bash
npm run lint
```

Run end-to-end tests:

```bash
npm run test:e2e
```

If Playwright reports missing browsers, install them once:

```bash
npx playwright install
```

## 6. Storybook and visual checks

Start Storybook:

```bash
npm run storybook
```

Build Storybook:

```bash
npm run build-storybook
```

Run Chromatic if you have a project token:

```bash
CHROMATIC_PROJECT_TOKEN=your_token_here npm run chromatic
```

## 7. Common issues

### Freighter is not detected

Install the Freighter extension, unlock it, and refresh the page. Make sure the
wallet is on testnet when testing testnet contract interactions.

### RPC or contract reads fail

Confirm these variables in `.env.local`:

```bash
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_NETWORK_NAME=TESTNET
```

Also check that `NEXT_PUBLIC_CONTRACT_ID` points to the contract you expect to
test.

### Supabase errors appear

Most Supabase-backed features require:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Server-only reminder routes can also require `SUPABASE_SERVICE_ROLE_KEY`.

### Reminder email routes fail

Set `RESEND_API_KEY` and `CRON_SECRET` before testing reminder jobs. Use local
test values only; never commit production credentials.

### WalletConnect is disabled

Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`. Without it, the app intentionally
keeps WalletConnect unavailable and shows guidance in the wallet modal.

### Playwright cannot start on Linux or WSL

Install Playwright browser dependencies:

```bash
npx playwright install --with-deps
```

If that needs system packages, run it in an environment where you can install
Linux dependencies.

## Pull request checklist

Before opening a PR:

- Rebase or update from `main`.
- Run `npm run lint`.
- Run `npm test`.
- Run `npm run build`.
- Add screenshots or notes for UI changes.
- Link the issue with `Closes #221` when this quickstart work is complete.
