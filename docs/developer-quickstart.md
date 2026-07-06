# ILN Frontend Developer Quickstart

Welcome! This guide takes you from a fresh clone to a running local development environment. All instructions have been tested on Windows (WSL), macOS, and Ubuntu.

**Estimated setup time: 15-30 minutes**

## Prerequisites

Before you start, ensure you have the following installed:

### 1. Node.js 20+

Check your current version:

```bash
node --version
```

**Install:**

- **macOS/Ubuntu**: Download from [nodejs.org](https://nodejs.org) or use your package manager:

  ```bash
  # macOS (Homebrew)
  brew install node@20

  # Ubuntu/Debian
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

- **Windows**: Download from [nodejs.org](https://nodejs.org) or use WSL
- **WSL/Ubuntu**: Use Node Version Manager (nvm):
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  nvm install 20
  ```

### 2. pnpm (Optional but Recommended)

This project uses npm by default but supports pnpm for faster dependency management.

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### 3. Stellar CLI (Optional, for advanced testing)

For Stellar network interaction and testing:

```bash
# macOS
brew install stellar-cli

# Ubuntu/Debian
curl -fsSL https://github.com/stellar/stellar-cli/releases/download/v21.0.0/stellar-cli-21.0.0-x86_64-unknown-linux-gnu.tar.gz | tar xz
sudo mv stellar /usr/local/bin/

# Windows/WSL
wget https://github.com/stellar/stellar-cli/releases/download/v21.0.0/stellar-cli-21.0.0-x86_64-unknown-linux-gnu.tar.gz
tar xz -f stellar-cli-*.tar.gz
```

### 4. Freighter Wallet (Browser Extension)

The application requires the Freighter wallet browser extension.

1. Install for your browser:
   - **Chrome/Brave**: [Chrome Web Store](https://chromewebstore.google.com/detail/freighter/bcacfldlkkdogcffkeieiokmgtzutddc)
   - **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/freighter/)

2. Create or import a wallet at [freighter.app](https://freighter.app)

3. **Switch to Testnet** in Freighter settings

## Getting Started

### Step 1: Clone the Repository

```bash
git clone https://github.com/drips-network/ILN-Frontend.git
cd ILN-Frontend
```

### Step 2: Install Dependencies

Using npm:

```bash
npm install
```

Or with pnpm:

```bash
pnpm install
```

**Expected time**: 2-5 minutes

### Step 3: Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

The `.env.local` file contains:

- `NEXT_PUBLIC_CONTRACT_ID` - Smart contract address on testnet
- `NEXT_PUBLIC_NETWORK_PASSPHRASE` - Stellar testnet identifier
- `NEXT_PUBLIC_RPC_URL` - Stellar RPC endpoint
- `NEXT_PUBLIC_NETWORK_NAME` - Human-readable network name
- `NEXT_PUBLIC_TESTNET_USDC_TOKEN_ID` - USDC token address on testnet
- `NEXT_PUBLIC_TESTNET_EURC_TOKEN_ID` - EURC token address on testnet

**Note:** These defaults are pre-configured for Stellar testnet. No modifications needed for local development.

### Step 4: Start the Development Server

```bash
npm run dev
```

Or with pnpm:

```bash
pnpm dev
```

**Expected output:**

```
  ▲ Next.js 16.2.4
  - Local:        http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 🚀

### Step 5: Connect Your Wallet

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Click "Connect Wallet" in the navbar
3. Approve the connection in Freighter
4. You should see your wallet address and be able to interact with the app

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Accessibility Tests Only

```bash
npm run test:a11y
```

### Update Snapshots (After UI Changes)

```bash
npm test -- --update-snapshots
```

**Note:** Tests use Vitest with jsdom environment for component testing and jest-axe for accessibility.

## Building for Production

```bash
npm run build
npm start
```

This creates an optimized production build. Useful for testing before deployment.

## Linting

Check code quality:

```bash
npm run lint
```

## Connecting to Stellar Testnet

The app is pre-configured for Stellar testnet. To fund your testnet account:

1. Get your public key from Freighter
2. Visit [Stellar Testnet Friendbot](https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY)
3. You'll receive 10,000 XLM in testnet funds
4. These tokens will appear in Freighter and the app

## Project Structure

```
ILN-Frontend/
├── app/                    # Next.js app directory (page routes)
├── src/
│   ├── components/         # Reusable React components
│   ├── context/           # React context providers
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── lib/               # Library functions
│   ├── constants.ts       # Configuration constants
│   └── i18n.ts            # Internationalization setup
├── __tests__/             # Vitest test files
├── docs/                  # Documentation
├── public/                # Static assets
├── styles/                # Global styles
├── .github/workflows/     # GitHub Actions CI/CD
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

## Common Issues & Fixes

### Issue: "Module not found" errors after clone

**Solution:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 3000 already in use

**Solution:**

```bash
# Use a different port
npm run dev -- -p 3001
```

Then open [http://localhost:3001](http://localhost:3001)

### Issue: Freighter wallet not connecting

**Fixes:**

1. Ensure Freighter is installed and unlocked
2. Check that Freighter is set to **Testnet** (not Public Network)
3. Try disconnecting and reconnecting in Freighter settings
4. Clear browser cache: `Cmd/Ctrl + Shift + Delete`
5. Restart the dev server: `Ctrl+C` then `npm run dev`

### Issue: Tests fail with "Cannot find module" errors

**Solution:**

```bash
# Ensure jest-axe and testing libraries are installed
npm install

# Run tests with verbose output
npm test -- --reporter=verbose
```

### Issue: Environment variables not loading

**Solution:**

1. Verify `.env.local` exists in the project root
2. Confirm it has the correct format: `NEXT_PUBLIC_KEY=value`
3. **Important:** Restart the dev server after changing `.env.local`:
   ```bash
   Ctrl+C
   npm run dev
   ```

### Issue: Snapshot tests failing after UI changes

**Solution:**

```bash
# Review the diff
npm test

# If changes are intentional, update snapshots
npm test -- --update-snapshots
```

### Issue: TypeScript errors after installing new packages

**Solution:**

```bash
# Regenerate TypeScript types
npm install
npm run build
```

### Issue: Slow performance on WSL

**Solution:**

1. Clone the repository inside WSL (`/home/user/...`) not Windows mounted drives
2. Use `npm ci` instead of `npm install` for faster installs
3. Ensure WSL2 is configured with sufficient resources (8GB+ RAM recommended)

## Useful Commands

| Command             | Purpose                  |
| ------------------- | ------------------------ |
| `npm run dev`       | Start development server |
| `npm test`          | Run all tests            |
| `npm run test:a11y` | Run accessibility tests  |
| `npm run build`     | Create production build  |
| `npm start`         | Run production build     |
| `npm run lint`      | Check code quality       |

## Getting Help

### Check Existing Issues

Before creating a new issue, search [GitHub Issues](https://github.com/drips-network/ILN-Frontend/issues) for similar problems.

### Debug Tips

1. **Check browser console** (F12) for JavaScript errors
2. **Check server terminal** for compilation errors
3. **Inspect network tab** for API failures (especially wallet connections)
4. **Use React DevTools** browser extension for component debugging

### Ask for Help

- Create a GitHub Discussion for setup questions
- Open an Issue with:
  - Your OS and terminal
  - Output of `node --version` and `npm --version`
  - Steps to reproduce the issue
  - Error messages from terminal and browser console

## Next Steps

1. **Explore the codebase**: Start in `app/page.tsx` for the home page
2. **Read DESIGN.md**: Understand the design system and component patterns
3. **Check out open issues**: Find features to build or bugs to fix
4. **Join the community**: Contribute and connect with other developers

---

**Happy coding! 🚀**

Questions? Open an issue on [GitHub](https://github.com/drips-network/ILN-Frontend/issues) or check the community discussions.
