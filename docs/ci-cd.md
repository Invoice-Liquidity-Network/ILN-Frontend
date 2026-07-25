# CI/CD Documentation

This document describes the CI/CD pipeline configuration, branch protection rules, and custom runner requirements for the ILN Frontend repository.

## Custom Runner: namespace-profile-nursca

All GitHub Actions workflows in this repository use a custom/self-hosted runner labeled `namespace-profile-nursca`.

### What is namespace-profile-nursca?

`namespace-profile-nursca` is a self-hosted GitHub Actions runner configured specifically for this project. It provides:

- Custom environment configurations for Stellar/Soroban development
- Pre-installed dependencies and tools specific to the ILN stack
- Optimized performance for the project's specific testing requirements

### Runner Configuration Location

The runner is configured at the organization/repository level in GitHub Actions settings. Maintainers with admin access can view and modify runner configuration in:
- Repository Settings → Actions → Runners
- Organization Settings → Actions → Runners (if configured at org level)

### Fallback Behavior

If `namespace-profile-nursca` becomes unavailable:
- **For this repository**: Workflows will fail until the runner is restored
- **For forks**: Forks will not have access to this custom runner

### Fork Contributors

If you are working from a fork, you must modify workflow files to use GitHub-hosted runners:

1. Change all instances of `runs-on: namespace-profile-nursca` to `runs-on: ubuntu-latest`
2. Note that some workflows may require additional configuration changes when using `ubuntu-latest`
3. Be aware that test execution times may differ on GitHub-hosted runners

Example change:
```yaml
# Before
runs-on: namespace-profile-nursca

# After (for forks)
runs-on: ubuntu-latest
```

### Workflows Using Custom Runner

The following workflows use `namespace-profile-nursca`:
- `ci.yml` - Lint, unit tests, build
- `e2e-tests.yml` - End-to-end Playwright tests
- `visual-regression.yml` - Chromatic visual regression tests
- `storybook-deploy.yml` - Storybook deployment to GitHub Pages
- `lighthouse.yml` - Lighthouse performance budget tests
- `accessibility.yml` - Consolidated accessibility test suite
- `contract-tests.yml` - Stellar SDK contract integration tests

Note: `workflow-lint.yml` uses `ubuntu-latest` (GitHub-hosted runner) as it only requires workflow validation tools.

## Branch Protection Rules

### Main Branch

The `main` branch is protected with the following requirements:

#### Required Status Checks

Before merging to `main`, all of the following CI checks must pass:

1. **CI / lint** - ESLint validation
2. **CI / tests** - Unit test suite (Vitest)
3. **CI / build** - Production build verification
4. **End-to-End Tests / e2e** - Playwright E2E test suite
5. **Lighthouse Performance Budget / lighthouse** - Performance budget validation
6. **Visual Regression Tests / chromatic** - Chromatic visual regression checks
7. **Accessibility Tests / accessibility** - jest-axe accessibility validation
8. **Contract Integration Tests / contract-tests** - Stellar SDK contract tests with 90% coverage enforcement

#### Additional Rules

- **Require pull request reviews before merging**: Yes (minimum 1 reviewer)
- **Require status checks to pass before merging**: Yes
- **Require branches to be up to date before merging**: Yes
- **Do not allow bypassing the above settings**: No (admins can bypass)

### Develop Branch

The `develop` branch is protected with the following requirements:

#### Required Status Checks

Before merging to `develop`, all of the following CI checks must pass:

1. **CI / lint** - ESLint validation
2. **CI / tests** - Unit test suite (Vitest)
3. **CI / build** - Production build verification
4. **Lighthouse Performance Budget / lighthouse** - Performance budget validation
5. **Visual Regression Tests / chromatic** - Chromatic visual regression checks
6. **Accessibility Tests / accessibility** - jest-axe accessibility validation
7. **Contract Integration Tests / contract-tests** - Stellar SDK contract tests with 90% coverage enforcement

Note: E2E tests (`End-to-End Tests / e2e`) are **not required** for `develop` branch merges.

#### Additional Rules

- **Require pull request reviews before merging**: Yes (minimum 1 reviewer)
- **Require status checks to pass before merging**: Yes
- **Require branches to be up to date before merging**: Yes
- **Do not allow bypassing the above settings**: No (admins can bypass)

## Workflow Triggers

### CI Workflow (ci.yml)

Triggers:
- Push to `main` or `develop`
- Pull requests targeting `main` or `develop`

Jobs:
- `lint` - ESLint validation
- `tests` - Unit tests + accessibility tests
- `build` - Production build verification

### End-to-End Tests (e2e-tests.yml)

Triggers:
- Push to `main` or `develop`
- Pull requests targeting `main` or `develop`

Jobs:
- `e2e` - Playwright E2E test suite with artifact uploads

### Visual Regression Tests (visual-regression.yml)

Triggers:
- Push to `main` or `develop`
- Pull requests targeting `main` or `develop`

Jobs:
- `chromatic` - Chromatic visual regression testing (requires `CHROMATIC_PROJECT_TOKEN` secret)

### Storybook Deployment (storybook-deploy.yml)

Triggers:
- Push to `main`
- Manual workflow dispatch

Jobs:
- `build-and-deploy` - Builds Storybook and deploys to GitHub Pages

### Lighthouse Performance Budget (lighthouse.yml)

Triggers:
- Push to `main` or `develop`
- Pull requests targeting `main` or `develop`

Jobs:
- `lighthouse` - Lighthouse CI performance budget validation

### Accessibility Tests (accessibility.yml)

Triggers:
- Push to `main` or `develop`
- Pull requests targeting `main` or `develop`

Jobs:
- `accessibility` - Consolidated accessibility validation for the dedicated axe suite and page-level accessibility tests

### Contract Integration Tests (contract-tests.yml)

Triggers:
- Push to `main` or `develop`
- Pull requests targeting `main` or `develop`

Jobs:
- `contract-tests` - Stellar SDK contract tests with 90% coverage enforcement

### Workflow Lint (workflow-lint.yml)

Triggers:
- Push to `main` or `develop` with changes to `.github/workflows/**`
- Pull requests with changes to `.github/workflows/**`

Jobs:
- `actionlint` - GitHub Actions workflow syntax validation

## Required Secrets

The following secrets must be configured in the repository settings:

### Chromatic
- `CHROMATIC_PROJECT_TOKEN` - Project token for Chromatic visual regression testing

### Other Secrets
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions (no manual configuration needed)

## Discrepancy Notes

### Current Notes

1. **Shared Node version**: Workflows now consume `.nvmrc` so local development and CI stay aligned on the same Node baseline.

2. **Dedicated accessibility workflow**: Accessibility checks now live in a single workflow with one required `accessibility` job, which avoids duplicate check names and redundant CI runs.

3. **E2E coverage on develop**: The E2E suite now runs for both `main` and `develop` pushes and pull requests so regressions surface before `main` merges.

### Maintainer Action Required

Please verify the following:
- [ ] Confirm the actual branch protection rules configured in GitHub repository settings match the documentation above
- [ ] Review and update custom runner configuration documentation if `namespace-profile-nursca` setup has changed
