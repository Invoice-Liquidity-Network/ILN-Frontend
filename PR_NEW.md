# Repository Cleanup and Documentation Improvements

This PR addresses four maintenance tasks to improve repository organization, code review workflow, and documentation structure.

## Summary

- **#440** - Add CODEOWNERS file for automatic review routing
- **#441** - Remove stray scratch documents from repo root
- **#443** - Fix visual-regression.yml skip condition with clear notice
- **#442** - Consolidate useWallet documentation into docs/hooks/use-wallet.md

## Changes Made

### 1. CODEOWNERS File (#440)

**Files Created:**
- `.github/CODEOWNERS` - New CODEOWNERS configuration

**Files Modified:**
- `CONTRIBUTING.md` - Added "Code Review and Code Owners" section

**Features:**
- Maps key directories to appropriate maintainers:
  - `src/hooks/` - Core React hooks (wallet, contract interactions, data fetching)
  - `src/context/` - React Context providers (wallet, notifications, global state)
  - `app/api/` - API routes (backend endpoints, authentication, data APIs)
  - `.github/workflows/` - CI/CD pipelines, testing, deployment
  - `src/utils/governance.ts` - Governance utilities
  - Contract layer files (`src/lib/soroban.ts`, `src/lib/horizon.ts`, `src/lib/indexer-websocket.ts`)
  - `src/constants.ts` - Core constants and configuration
  - `src/types/` - Type definitions
  - `docs/` - Documentation
- Documents ownership rationale in CONTRIBUTING.md
- Explains how automatic reviewer suggestions work
- Provides guidance for adding new code owners

**Acceptance Criteria Met:**
- ✅ CODEOWNERS file created with key directory mappings
- ✅ Ownership rationale documented in CONTRIBUTING.md
- ✅ Explains how automatic reviewer routing works

### 2. Remove Stray Scratch Documents (#441)

**Files Deleted:**
- `pr.md` - Leftover PR write-up
- `PR_DESCRIPTION.md` - Leftover PR description (different from docs/pr_description.md)
- `docs/pr_description.md` - Another leftover PR description
- `.tmp_copilot_test` - Temporary test file

**Files Modified:**
- `.gitignore` - Added patterns for deleted files to prevent recurrence

**Features:**
- Removed all identified stray scratch documents
- Updated .gitignore to include:
  - `pr.md`
  - `PR_DESCRIPTION.md`
  - `docs/pr_description.md`
- Verified existing .gitignore patterns remain intact

**Acceptance Criteria Met:**
- ✅ Stray files removed from repo root and docs/
- ✅ .gitignore updated to prevent recurrence
- ✅ No canonical project documentation affected

### 3. Visual Regression Skip Notice (#443)

**Files Modified:**
- `.github/workflows/visual-regression.yml` - Added skip notice job
- `CONTRIBUTING.md` - Documented skip behavior for contributors

**Features:**
- Added `chromatic-skip-notice` job that runs when `CHROMATIC_PROJECT_TOKEN` is unavailable
- Skip notice posts clear explanation to GitHub Step Summary:
  - Why visual regression is skipped (fork PRs don't have secrets)
  - What this means (other CI checks still run, maintainer will review visual changes)
  - How to enable Chromatic (set the secret in repository settings)
- Updated CONTRIBUTING.md to explain skip behavior for first-time contributors
- Prevents confusion when contributors see skipped Chromatic check

**Acceptance Criteria Met:**
- ✅ Clear explanation displayed when Chromatic is skipped
- ✅ Behavior documented in CONTRIBUTING.md
- ✅ Fork PR contributors understand why check is skipped

### 4. Consolidate useWallet Documentation (#442)

**Files Created:**
- `docs/hooks/use-wallet.md` - Consolidated useWallet documentation

**Files Deleted:**
- `IMPLEMENTATION_GUIDE_useWallet.md` - Detailed implementation guide
- `useWallet_SUMMARY.md` - Summary documentation
- `useWallet_QUICK_REFERENCE.md` - Quick reference guide

**Files Modified:**
- `docs/architecture.md` - Added link to consolidated docs
- `README.md` - Added link to consolidated docs

**Features:**
- Merged content from three overlapping useWallet docs into single comprehensive guide
- New doc includes:
  - Installation & setup instructions
  - Complete API reference
  - SEP-10 authentication flow with sequence diagram
  - Common usage patterns
  - JWT storage strategy (memory-only)
  - Error handling and debugging
  - Testing guidelines
  - Security considerations
  - Architecture diagrams
- Updated cross-links in architecture.md and README.md
- Organized in proper docs/ directory structure

**Acceptance Criteria Met:**
- ✅ Three overlapping docs consolidated into single canonical doc
- ✅ Original files deleted
- ✅ Cross-links updated in architecture.md and README.md
- ✅ Content organized in docs/hooks/ directory

## Testing

All changes are documentation and configuration updates. No code changes require testing.

## Breaking Changes

None. All changes are additive or cleanup-focused.

## Files Changed Summary

### Created
- `.github/CODEOWNERS`
- `docs/hooks/use-wallet.md`

### Deleted
- `pr.md`
- `PR_DESCRIPTION.md`
- `docs/pr_description.md`
- `.tmp_copilot_test`
- `IMPLEMENTATION_GUIDE_useWallet.md`
- `useWallet_SUMMARY.md`
- `useWallet_QUICK_REFERENCE.md`

### Modified
- `CONTRIBUTING.md` - Added CODEOWNERS section and Chromatic skip notice
- `.gitignore` - Added patterns for deleted files
- `.github/workflows/visual-regression.yml` - Added skip notice job
- `docs/architecture.md` - Added link to useWallet docs
- `README.md` - Added link to useWallet docs

## Checklist

- [x] Code follows project style guidelines
- [x] All acceptance criteria met
- [x] No breaking changes
- [x] Documentation updated
- [x] .gitignore patterns verified

Closes #440, #441, #443, #442
