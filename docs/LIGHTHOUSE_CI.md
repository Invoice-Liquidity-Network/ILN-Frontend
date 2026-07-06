# Lighthouse CI Performance Budget Tests

This document explains how Lighthouse CI performance budget tests work in the ILN-Frontend project.

## Overview

Lighthouse CI automatically audits the application's performance on every push and pull request to `main` and `develop` branches. It measures Core Web Vitals and other performance metrics against defined budgets.

## Performance Budgets

The following performance budgets are enforced as **errors** (CI will fail if exceeded):

- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Total Byte Weight**: < 200KB gzipped

Additional metrics are tracked as **warnings** (CI will not fail but will alert):

- Time to Interactive: < 3.8s
- First Contentful Paint: < 1.8s
- Performance Score: > 70
- Accessibility Score: > 90
- Best Practices Score: > 80
- SEO Score: > 80

## Tested Pages

Lighthouse CI audits the following pages:

- `/` (home page)
- `/marketplace`
- `/dashboard/lp`
- `/governance`

## How It Works

1. On each push/PR to `main` or `develop`, the GitHub Actions workflow runs
2. The Next.js app is built in production mode
3. Lighthouse CI runs 3 audits for each URL and averages the results
4. Results are compared against the budget thresholds
5. Reports are uploaded as GitHub Actions artifacts (retained for 30 days)

## Reviewing Lighthouse Reports

### Via GitHub Actions Artifacts

1. Go to the **Actions** tab in the GitHub repository
2. Click on the failed or successful workflow run
3. Scroll to the **Artifacts** section at the bottom
4. Download the `lighthouse-reports` artifact
5. Extract the ZIP file and open the HTML reports in your browser

### Via Local Testing

To run Lighthouse CI locally:

```bash
# Build the app
npm run build

# Start the production server
npm start

# In another terminal, run Lighthouse CI
npx @lhci/cli autorun
```

The reports will be saved in the `.lighthouseci/` directory.

### Understanding the Reports

Each HTML report shows:
- **Performance Score**: Overall performance rating (0-100)
- **Core Web Vitals**: LCP, FID, CLS with pass/fail status
- **Opportunities**: Suggestions to improve performance
- **Diagnostics**: Detailed metrics and resource analysis

## Troubleshooting Failed Budgets

If CI fails due to performance budget violations:

1. **Download the Lighthouse report** to identify which metric failed
2. **Check the Opportunities section** for specific improvement suggestions
3. **Common fixes**:
   - Optimize images (use WebP, lazy loading)
   - Reduce JavaScript bundle size (code splitting, tree shaking)
   - Minimize render-blocking resources
   - Improve server response times
4. **Test locally** before pushing to verify the fix

## Configuration

Lighthouse CI is configured in `.lighthouserc.json`:

- `ci.collect.url`: Pages to audit
- `ci.assert.assertions`: Budget thresholds and severity levels
- `ci.upload`: Report storage settings

The CI workflow is defined in `.github/workflows/lighthouse.yml`.

## Resources

- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Core Web Vitals](https://web.dev/vitals/)
- [Web Performance Optimization](https://web.dev/fast/)
