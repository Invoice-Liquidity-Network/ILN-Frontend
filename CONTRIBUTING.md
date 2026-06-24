# Contributing to ILN Frontend

Thank you for your interest in contributing to the Invoice Liquidity Network (ILN) frontend! This guide will help you get started with development, testing, and submitting contributions.

## Prerequisites

- **Node.js**: Version 18 or higher (recommended: Node.js 20 LTS)
- **npm**: Version 9 or higher
- **Git**: For version control

## Getting Started

### 1. Fork and Clone the Repository

1. Fork the [ILN-Frontend repository](https://github.com/Invoice-Liquidity-Network/ILN-Frontend)
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ILN-Frontend.git
   cd ILN-Frontend
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/Invoice-Liquidity-Network/ILN-Frontend.git
   ```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env.local
```

Required environment variables (see [README.md](README.md) for full list):

#### Stellar & Smart Contract Settings
- `NEXT_PUBLIC_CONTRACT_ID` - Invoice factoring smart contract ID
- `NEXT_PUBLIC_NETWORK_PASSPHRASE` - Stellar network passphrase
- `NEXT_PUBLIC_RPC_URL` - Soroban RPC server endpoint
- `NEXT_PUBLIC_NETWORK_NAME` - Network name (TESTNET/PUBLIC)
- `NEXT_PUBLIC_STELLAR_NETWORK` - Network type (testnet/public)
- Token IDs for USDC, EURC, and XLM

#### Backend Services
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase database URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `RESEND_API_KEY` - Resend email API key (server-side)
- `CRON_SECRET` - Secret for cron job security

#### Feature Flags
- `NEXT_PUBLIC_NFT_ENABLED` - Enable Invoice NFT metadata display
- `NEXT_PUBLIC_INSURANCE_POOL_ENABLED` - Enable liquidity insurance pooling
- `NEXT_PUBLIC_API_MOCKING` - Enable MSW mocks for local development

### 4. Stellar-Specific Setup

#### Install Freighter Wallet
1. Install the [Freighter wallet extension](https://www.freighter.app/) for your browser
2. Create or import a Stellar account
3. Switch to the appropriate network (Testnet for development)

#### Get Testnet Funds
If working on Testnet, fund your account using the Friendbot:
- Visit [Stellar Testnet Friendbot](https://friendbot.stellar.org/)
- Enter your Freighter wallet address
- Receive 10,000 XLM for testing

#### Configure Network in Freighter
1. Open Freighter extension
2. Go to Settings
3. Select "Testnet" network
4. Ensure your account is active on the selected network

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

### Code Style and Formatting

We use **ESLint** and **Prettier** to maintain consistent code quality.

#### Linting
```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

#### Formatting
```bash
# Format all files
npm run format

# Check formatting without modifying files
npm run format:check
```

#### Pre-commit Hooks
We recommend using Husky for pre-commit hooks (optional but recommended):
```bash
npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

Add to `package.json`:
```json
"lint-staged": {
  "*.{ts,tsx,js,jsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
```

### Testing

#### Unit Tests (Vitest)
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Update snapshots after intentional UI changes
npm test -- --update-snapshots
```

#### End-to-End Tests (Playwright)
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in headed mode (for debugging)
npm run test:e2e -- --headed

# Run specific test file
npm run test:e2e -- invoice-submission.spec.ts
```

#### Visual Regression Tests (Storybook + Chromatic)
```bash
# Start Storybook locally
npm run storybook

# Build Storybook
npm run build-storybook

# Run Chromatic visual tests
npm run chromatic
```

### Commit message format

This repository uses Conventional Commits to power changelog generation via `git-cliff`.

- Commit messages should follow the format: `<type>(<scope>): <short summary>`.
- Use the types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Example: `chore: add CHANGELOG and git-cliff automation for frontend repo`
- After adding release-worthy commits, update the changelog with:
  ```bash
  npm run generate:changelog
  ```

## Pull Request Requirements

### Before Submitting a PR

1. **Code Quality**:
   - Run `npm run lint:fix` to fix all linting errors
   - Run `npm run format` to ensure consistent formatting
   - Ensure zero ESLint warnings

2. **Testing**:
   - Run `npm test` and ensure all tests pass
   - Run `npm run test:e2e` for critical user flows
   - Add tests for new features or bug fixes
   - Maintain test coverage above thresholds (90% lines, 90% functions, 80% branches)

3. **Visual Changes**:
   - If your PR includes UI changes, run `npm run storybook`
   - Ensure Storybook stories are updated or added for new components
   - Chromatic will automatically run visual regression tests on your PR

4. **Documentation**:
   - Update relevant documentation (README, DESIGN.md, architecture docs)
   - Add comments for complex logic
   - Update TypeScript types if needed

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed
- [ ] Visual regression tests pass

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] All tests passing
```

## Internationalization (i18n)

ILN supports multiple languages using i18next. All user-facing strings must be externalized.

### Adding New Translations

1. **Add strings to translation files**:
   - English: `public/locales/en/translation.json`
   - Spanish: `public/locales/es/translation.json`
   - Add new locales by creating corresponding directories

2. **Use translations in components**:
   ```typescript
   import { useTranslation } from 'react-i18next';

   function MyComponent() {
     const { t } = useTranslation();
     return <h1>{t('common.submit')}</h1>;
   }
   ```

3. **Locale-aware formatting**:
   We provide a custom hook for locale-aware formatting:
   ```typescript
   import { useLocaleFormatting } from '@/hooks/useLocaleFormatting';

   function MyComponent() {
     const { currency, date, percentage, tokenAmount } = useLocaleFormatting();

     // Format currency
     const formatted = currency(1000, 'USD'); // "$1,000.00" or "1.000,00 €"

     // Format date
     const formattedDate = date(new Date(), { dateStyle: 'medium' });

     // Format percentage
     const formattedPercent = percentage(0.05, 2); // "5.00%"

     // Format token amount
     const formattedToken = tokenAmount(1000000000n, 7, 'USDC');
   }
   ```

   Or use the utility functions directly:
   ```typescript
   import { formatCurrency, formatDate } from '@/lib/formatting';

   // Numbers (amounts, percentages)
   const formatted = formatCurrency(1000, 'USD', 'en-US');

   // Dates
   const formattedDate = formatDate(new Date(), { dateStyle: 'medium' }, 'en-US');
   ```

### Adding a New Locale

1. Create locale directory: `public/locales/[locale]/`
2. Copy `translation.json` from English locale
3. Translate all strings
4. Update `src/i18n.ts`:
   ```typescript
   import [locale] from "../public/locales/[locale]/translation.json";

   const resources = {
     en: { translation: en },
     es: { translation: es },
     [locale]: { translation: [locale] },
   };

   supportedLngs: ["en", "es", "[locale]"],
   ```

### i18n Configuration

The i18n configuration is in `src/i18n.ts`:
- Uses `i18next-browser-languagedetector` for automatic language detection
- Persists language preference in localStorage
- Falls back to English if translation is missing
- Supports English (en) and Spanish (es) out of the box

## MSW API Mocking

Tests use Mock Service Worker (MSW) to mock network calls at the request boundary instead of mocking individual app functions. This makes tests more realistic and maintainable.

### MSW Setup

MSW is configured for both Node (Vitest) and browser (Playwright) environments:
- Server setup: `src/mocks/server.ts`
- Browser setup: `src/mocks/browser.ts`
- Handlers: `src/mocks/handlers.ts`
- Fixtures: `src/mocks/fixtures/`

### Adding New Handlers

1. **Add or update fixtures** in `src/mocks/fixtures/`:
   ```typescript
   // src/mocks/fixtures/contract.ts
   export const myNewFixture = {
     // realistic API response data
   };
   ```

2. **Add request handler** in `src/mocks/handlers.ts`:
   ```typescript
   import { http, HttpResponse } from "msw";
   import { myNewFixture } from "./fixtures/contract";

   export const handlers = [
     http.get("https://api.example.com/endpoint", () => {
       return HttpResponse.json(myNewFixture);
     }),
   ];
   ```

3. **Use in tests**:
   ```typescript
   import { server } from "@/mocks/server";

   describe("MyComponent", () => {
     it("should handle API response", () => {
       server.use(
         http.get("https://api.example.com/endpoint", () => {
           return HttpResponse.json({ custom: "response" });
         })
       );
       // test logic
     });
   });
   ```

### Existing Handlers

Current MSW handlers cover:
- Horizon account/balance endpoints
- Horizon transaction endpoints
- Friendbot faucet endpoint
- CoinGecko price endpoint
- Soroban RPC contract calls
- Internal API endpoints (leaderboard, notifications)

### Migrating from Function Mocks

When migrating existing tests from function mocks to MSW:

1. Identify mocked functions (e.g., `jest.fn()`, `vi.fn()`)
2. Replace with MSW handlers that intercept the actual network request
3. Remove function mock imports and setup
4. Verify tests still pass with realistic network responses

Example migration:
```typescript
// Before (function mock)
vi.mock('@/lib/horizonClient', () => ({
  fetchNativeXlmBalance: vi.fn().mockResolvedValue(1000),
}));

// After (MSW handler)
import { server } from "@/mocks/server";

server.use(
  http.get("https://horizon-testnet.stellar.org/accounts/:accountId", () => {
    return HttpResponse.json({
      balances: [{ asset_type: "native", balance: "1000" }],
    });
  })
);
```

## Visual Regression Testing with Chromatic

This project uses Chromatic for visual regression testing to catch unintended UI changes before they reach production.

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Chromatic project:**
   - Create an account at [chromatic.com](https://chromatic.com)
   - Link your GitHub repository
   - Get your project token from the Chromatic dashboard
   - Add the token to your environment: `CHROMATIC_PROJECT_TOKEN=your_token_here`

### Running Visual Tests

#### Local Development
```bash
# Start Storybook locally
npm run storybook

# Build Storybook for production
npm run build-storybook

# Run Chromatic visual tests
npm run chromatic
```

#### CI/CD Integration
Visual regression tests run automatically on:
- Pull requests
- Pushes to main branch
- Manual workflow dispatch

### Approval Workflow

#### When Visual Changes Are Detected

1. **Review Changes:**
   - Chromatic will comment on your PR with a link to review changes
   - Click the link to see before/after comparisons
   - Review each component change carefully

2. **Approve Intentional Changes:**
   - If changes are intentional (new features, design updates):
     - Click "Accept" for each intended change in Chromatic
     - Add a comment explaining the change
   - If changes are unintentional:
     - Click "Deny" and fix the issue in your code
     - Push new commits to update the visual tests

3. **Baseline Updates:**
   - Approved changes become the new baseline
   - Future tests will compare against these new baselines
   - Only maintainers can approve changes on the main branch

#### Best Practices

1. **Component Stories:**
   - Write comprehensive stories covering all component states
   - Include edge cases (loading, error, empty states)
   - Test different prop combinations
   - Use realistic data in stories

2. **Responsive Testing:**
   - Test components at different viewport sizes
   - Include mobile, tablet, and desktop breakpoints
   - Use Storybook's viewport addon for consistent testing

3. **Accessibility:**
   - All stories are automatically tested with axe-core
   - Fix accessibility violations before merging
   - Use semantic HTML and proper ARIA attributes

4. **Performance:**
   - Keep stories lightweight and focused
   - Avoid heavy computations in story renders
   - Use mock data instead of real API calls

### Story Writing Guidelines

#### File Structure
```
src/components/
├── Button/
│   ├── Button.tsx
│   ├── Button.stories.tsx
│   └── Button.test.tsx
```

#### Story Template
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'Components/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered', // or 'padded', 'fullscreen'
  },
  tags: ['autodocs'],
  argTypes: {
    // Define controls for props
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props
  },
};

export const Variant: Story = {
  args: {
    // Variant props
  },
};
```

### Required Stories for Key Components

#### High Priority Components
- [ ] `Button` - All variants, sizes, states
- [ ] `InvoiceStatusBadge` - All status types
- [ ] `RiskBadge` - All risk levels
- [ ] `DataTable` - Loading, empty, populated states
- [ ] `TokenSelector` - All token types, error states

#### Medium Priority Components
- [ ] `InvoiceTable` - Different data sets, filters
- [ ] `LPPortfolio` - Various portfolio states
- [ ] `NotificationBell` - Read/unread states
- [ ] `Modal` components - Open/closed states
- [ ] `Form` components - Valid/invalid states

### Troubleshooting

#### Common Issues

1. **Flaky Tests:**
   - Use `chromatic --exit-zero-on-changes` for non-blocking tests
   - Add delays for animations: `parameters: { chromatic: { delay: 300 } }`
   - Disable animations in test environment

2. **Large Diffs:**
   - Check for font loading issues
   - Ensure consistent test environment
   - Use fixed dimensions for dynamic content

3. **Missing Baselines:**
   - Run `npm run chromatic` on main branch first
   - Ensure all stories are properly exported
   - Check Storybook build for errors

#### Getting Help

- Check the [Chromatic documentation](https://www.chromatic.com/docs/)
- Review existing stories for patterns
- Ask in the team Slack channel for guidance
- Create an issue for persistent problems

### Maintenance

#### Regular Tasks
- Review and approve visual changes weekly
- Update baselines after major design changes
- Archive old unused stories
- Monitor Chromatic usage and costs

#### Version Updates
- Test Storybook updates in a separate branch
- Regenerate all baselines after major updates
- Update this documentation as needed

## Getting Help

If you need help:
- Check existing [GitHub Issues](https://github.com/Invoice-Liquidity-Network/ILN-Frontend/issues)
- Review the [architecture documentation](docs/architecture.md)
- Read the [design system guide](DESIGN.md)
- Join community discussions (link to Discord/Slack if available)

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to create a welcoming environment for all contributors.
