# Testing Guide

This document outlines the testing strategy and setup for the ILN-Frontend project.

## Testing Stack

- **Unit & Integration Tests**: [Vitest](https://vitest.dev/)
- **E2E Tests**: [Playwright](https://playwright.dev/)
- **Visual Regression**: [Storybook](https://storybook.js.org/) + [Chromatic](https://chromatic.com/)
- **Mutation Testing**: [Stryker](https://stryker-mutator.io/)

## Running Tests

### Unit Tests

```bash
# Run once
npm test

# Watch mode
npm run test:watch
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- responsive-mobile.spec.ts
```

### Storybook

```bash
# Start Storybook development server
npm run storybook

# Build Storybook
npm run build-storybook
```

### Mutation Testing

```bash
# Run mutation testing (generates report in mutation-report/)
npm run test:mutation
```

Mutation testing is run on a weekly schedule via CI. It validates that tests would actually catch real regressions by simulating code mutations and checking if tests fail.

#### Baseline Mutation Score

Mutation testing is configured to focus on high-value code:
- **Target directories**: `src/utils/`, `src/hooks/`
- **Thresholds**: 
  - High: 90% (target)
  - Medium: 75%
  - Low: 60% (minimum acceptable)

Results are uploaded as workflow artifacts for analysis.

## Test Structure

### Unit Tests

Place unit tests alongside source files:
```
src/
  utils/
    calculate.ts
    calculate.test.ts
  hooks/
    useInvoice.ts
    useInvoice.test.ts
```

### E2E Tests

Place E2E tests in dedicated directory:
```
e2e/
  responsive-mobile.spec.ts
  contract-integration.spec.ts
```

### Stories

Place Storybook stories with components:
```
src/components/
  WalletButton.tsx
  WalletButton.stories.tsx
```

## Coverage Goals

- **Unit Test Coverage**: Target 80%+ for utils and hooks
- **Storybook Coverage**: All high-risk components should have stories covering default, loading, error, and empty states
- **E2E Coverage**: All major user flows and responsive behavior

## Mobile Responsive Testing

The `e2e/responsive-mobile.spec.ts` suite tests layout integrity across multiple viewports:

- **375×812** (iPhone SE)
- **390×844** (Google Pixel)

Tests verify:
- No horizontal overflow
- Touch targets meet 44×44px minimum
- Layout adapts properly to mobile

Current coverage:
- ✅ Home, Marketplace, Submit, Dashboard
- ✅ Governance, Governance/New
- ✅ Invoices, Invoices/Batch
- ✅ Stats, Tokens

## Best Practices

1. **Unit Tests**: Test business logic, utilities, and hooks in isolation
2. **E2E Tests**: Test critical user flows end-to-end with real browser
3. **Stories**: Document component states and variations visually
4. **Mutation Testing**: Use to validate test quality, not to achieve 100% (diminishing returns)

## CI/CD Integration

- **Per-PR**: Unit tests + E2E tests (required to pass)
- **Weekly**: Mutation testing (informational, generates artifacts)
- **On Push to Main**: Chromatic visual regression checks

## Resources

- [Vitest Documentation](https://vitest.dev/guide/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Storybook Documentation](https://storybook.js.org/docs/)
- [Stryker Documentation](https://stryker-mutator.io/docs/)
