# CI/CD Documentation & Policy Guide

This document describes the CI/CD pipeline configuration, branch protection rules, custom runner requirements, and security hardening policies for the ILN Frontend repository. It addresses issues **#459**, **#460**, **#461**, and **#462**.

## Table of Contents

1. [Custom Runner: namespace-profile-nursca](#custom-runner-namespace-profile-nursca)
2. [Branch Protection Rules](#branch-protection-rules)
3. [Workflow Triggers](#workflow-triggers)
4. [SHA Pinning Policy (Issue #461)](#sha-pinning-policy-issue-461)
5. [Least-Privilege Permissions (Issue #462)](#least-privilege-permissions-issue-462)
6. [Security Audit Gate (Issue #459)](#security-audit-gate-issue-459)
7. [License Compatibility Check (Issue #460)](#license-compatibility-check-issue-460)

---

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

---

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

---

## Workflow Triggers

| Workflow File | Trigger | Purpose |
|---|---|---|
| `ci.yml` | push/PR → main, develop | Lint, unit tests, build |
| `contract-tests.yml` | push/PR → main, develop | Soroban contract integration tests + coverage gate |
| `accessibility.yml` | push/PR → main, develop | jest-axe WCAG accessibility tests |
| `e2e-tests.yml` | push/PR → main, develop | Playwright end-to-end tests |
| `lighthouse.yml` | push/PR → main, develop | Lighthouse performance budget |
| `visual-regression.yml` | push/PR → main, develop | Chromatic visual regression via Storybook |
| `storybook-deploy.yml` | push → main + manual dispatch | Deploy Storybook to GitHub Pages |
| `workflow-lint.yml` | push/PR with changes to `.github/workflows/**` | Validate workflow YAML syntax |
| `security-audit.yml` | push/PR → main, develop + weekly cron | npm audit security gate |
| `license-check.yml` | push/PR → main, develop | Dependency license compatibility |

---

## Required Secrets

| Secret | Workflow | Purpose |
|---|---|---|
| `CHROMATIC_PROJECT_TOKEN` | `visual-regression.yml` | Authenticate with Chromatic cloud |
| `GITHUB_TOKEN` (auto) | `lighthouse.yml` | Post commit status checks via LHCI |
| `GITHUB_TOKEN` (auto) | all others | Read source code only |

---

## SHA Pinning Policy (Issue #461)

### Why we pin to SHAs

Using floating version tags (`@v4`, `@latest`) is a supply-chain risk. A tag can be silently moved to a different commit at any time — either by the action publisher or a malicious actor. This repo signs Stellar transactions and handles wallet connections, making it a high-value target.

Pinning to a full commit SHA guarantees the exact code that was reviewed is the code that runs. This is [GitHub's own recommendation](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-third-party-actions) for security-sensitive repositories.

### Current pinned SHAs

| Action | Tag | Pinned SHA |
|---|---|---|
| `actions/checkout` | v4.4.0 | `11d5960a326750d5838078e36cf38b85af677262` |
| `actions/setup-node` | v4.4.0 | `49933ea5288caeca8642d1e84afbd3f7d6820020` |
| `actions/upload-artifact` | v4.6.2 | `ea165f8d65b6e75b540449e92b4886f43607fa02` |
| `chromaui/action` | v18.1.0 | `14cfaef73576e69f95f47f60058063f46ca38719` |

Note: `pnpm/action-setup@v4` is not yet pinned to a SHA. Pin it when bumping by following the procedure below.

### How to update a pinned SHA

When you need to bump an action to a newer version:

1. **Find the new SHA** for the desired tag:

   ```bash
   # Using the GitHub API
   curl -s "https://api.github.com/repos/OWNER/REPO/git/ref/tags/vX.Y.Z" \
     | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['object']['sha'])"

   # Or from the tags list
   curl -s "https://api.github.com/repos/OWNER/REPO/tags" \
     | python3 -c "import sys,json; [print(t['name'], t['commit']['sha']) for t in json.load(sys.stdin)[:10]]"
   ```

2. **Review the release notes** for the action between the old and new version.

3. **Update the workflow file** — replace the SHA and update the version comment:
   ```yaml
   # Before
   uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0

   # After
   uses: actions/checkout@<new-sha> # v4.5.0
   ```

4. **Update the SHA table above** in this document.

5. Open a PR with the changes using `ci:` commit prefix, e.g.:
   ```
   ci: bump actions/checkout to v4.5.0 (SHA pinned)
   ```

### Automated tooling

[Dependabot](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/keeping-your-actions-up-to-date-with-dependabot) is recommended for automated SHA bump PRs:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## Least-Privilege Permissions (Issue #462)

### Policy

Every workflow file must declare an explicit `permissions:` block. Omitting the block causes GitHub to grant the token the repository's default permissions, which are often broader than necessary.

### Permissions granted per workflow

| Workflow | `contents` | `statuses` | Other |
|---|---|---|---|
| `contract-tests.yml` | `read` | — | — |
| `accessibility.yml` | `read` | — | — |
| `e2e-tests.yml` | `read` | — | — |
| `lighthouse.yml` | `read` | `write` | — |
| `visual-regression.yml` | `read` | — | — |
| `security-audit.yml` | `read` | — | — |
| `license-check.yml` | `read` | — | — |

`lighthouse.yml` needs `statuses: write` so LHCI can post commit status checks via `GITHUB_TOKEN`.

### CHROMATIC_PROJECT_TOKEN

- **Storage**: Repository secret. To restrict to protected branches only, move to a `production` environment and add `environment: production` to the job.
- **Rotation**: Rotate from the Chromatic project settings page whenever a contributor with access leaves.
- **Scope**: Only grants access to the specific Chromatic project.

---

## Security Audit Gate (Issue #459)

`security-audit.yml` runs `npm audit` on every push, PR, and on a weekly schedule (Monday 08:00 UTC).

- **Fails the build** on `high` or `critical` severity findings.
- **Reports but does not fail** on `moderate` findings.
- Covers key financial dependencies: `@stellar/freighter-api`, `@stellar/stellar-sdk`, `@supabase/supabase-js`.

### Triage process for false positives

1. Run `npm audit` locally to read the full CVE details.
2. Apply available patches: `npm audit fix` (or `npm audit fix --force` for breaking changes — review the diff).
3. If no fix is available and the finding is genuinely not exploitable:
   - Open a tracking issue: `security: track CVE-XXXX-XXXXX in [package]`
   - Include: advisory URL, why it is not exploitable, expected fix date.
4. Re-run CI after any change to confirm the gate passes.

---

## License Compatibility Check (Issue #460)

All production dependencies must use permissive OSI-approved licenses. Copyleft licenses (GPL, LGPL, AGPL, MPL, EUPL) are **not permitted**.

The allowlist is defined in `.license-checker.json` at the repo root. `license-check.yml` enforces it on every push and PR against production deps only.

### Allowed licenses

MIT, MIT-0, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, CC0-1.0, CC-BY-3.0, CC-BY-4.0, 0BSD, BlueOak-1.0.0, Python-2.0, Unlicense, WTFPL.

### Handling a violation

1. Confirm the license in the package's `LICENSE` file (metadata can be wrong).
2. Find a permissive-licensed alternative.
3. If no alternative exists and legal approves an exception, add the package to `excludePackages` in `.license-checker.json` and document it here under a **License Exceptions** section with: package name/version, license type, legal sign-off link, rationale.

---

## Discrepancy Notes

1. **Shared Node version**: Workflows consume `.nvmrc` so local development and CI stay aligned on the same Node baseline.
2. **Dedicated accessibility workflow**: Accessibility checks live in a single workflow with one required `accessibility` job.
3. **E2E coverage on develop**: The E2E suite now runs for both `main` and `develop` pushes and PRs.

### Maintainer Action Required

- [ ] Confirm branch protection rules in GitHub repository settings match the documentation above
- [ ] Review and update custom runner configuration documentation if `namespace-profile-nursca` setup has changed
- [ ] Pin `pnpm/action-setup@v4` to a full SHA in a follow-up PR
