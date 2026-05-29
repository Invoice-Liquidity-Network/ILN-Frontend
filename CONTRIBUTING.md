# Contributing to ILN Frontend

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

## MSW API Mocking

Tests use Mock Service Worker to mock network calls at the request boundary instead of mocking individual app functions.

### Adding Handlers

1. Add or update fixtures in `src/mocks/fixtures/`.
2. Add the request handler in `src/mocks/handlers.ts`.
3. Use `server.use(...)` inside a Vitest test when a test needs a one-off response.
4. Browser-based tests can start `src/mocks/browser.ts` when they need the same handlers in a real page.

Keep handlers close to the external API shape. Horizon, Friendbot, CoinGecko, and Stellar RPC responses should return realistic status codes and payload fields so tests stay useful when the app code changes.
