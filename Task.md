## #144 Add protocol health dashboard for admins
The admin address needs a protocol health view showing metrics that require action — paused state, pending governance proposals, disputed invoices, contracts nearing their upgrade window, and oracle freshness.

Requirements and context

- Route: /admin — accessible only to the connected admin address (otherwise 403 state)
- Panels: Protocol Status (paused/running), Open Disputes count, Pending Governance Proposals, Oracle Last Updated, Contract Version, Treasury Balance
- Action shortcuts: Pause/Unpause, View Disputed Invoices, Execute Ready Proposals
- Auto-refresh every 30 seconds
- All sensitive actions require a second confirmation
### Suggested execution
``
git checkout -b feat/admin-health-dashboard ``
- Create ``src/app/admin/page.tsx`` with admin address gate
- Create individual metric panels
- Wire action shortcuts to contract calls
- Write admin vs non-admin access tests
Example commit message
``feat: build admin protocol health dashboard with action shortcuts``


## #182 Write tests for responsive layout on mobile viewports
The app must work on mobile devices. Responsive layout tests verify that key pages render correctly at mobile viewports (375px, 390px) and that interactive elements have adequate touch targets.

Requirements and context

- Use Playwright at 375×812 (iPhone SE) and 390×844 (iPhone 14) viewports
- Test: navigation menu collapse/expand, marketplace card layout, invoice form usability, dashboard table scroll, wallet connection modal
- Verify all touch targets are ≥44×44px (WCAG AA)
- Screenshot every page at each viewport in CI artifacts

### Suggested execution

``git checkout -b test/responsive-mobile-tests``
- Configure Playwright mobile viewports
- Write responsive tests for each page
- Add touch target assertions
- Include screenshots in CI artifacts
Example commit message
``test: add Playwright responsive layout tests for mobile viewports``


### #183 Add error boundary tests for contract failure scenarios
When a contract call fails unexpectedly (network error, RPC unavailable), components without error boundaries will crash the entire page. Testing error boundaries ensures graceful degradation.

Requirements and context

- Add React ErrorBoundary components to all data-fetching sections
- Error boundary UI: "Something went wrong loading this section. [Retry]"
- Test: simulate contract call failure, verify error boundary renders, verify retry restores the component
- Sections to wrap: invoice list, LP portfolio, marketplace, governance proposals, stats

### Suggested execution
``git checkout -b test/error-boundary-tests``
- Create reusable with retry support
- Wrap all data-fetching sections
- Write tests simulating failures and verifying recovery
Example commit message
``test: add error boundaries and tests for contract failure scenarios``


### #184 Set up MSW (Mock Service Worker) for API mocking in tests
Tests currently mock individual functions, leading to brittle, tightly-coupled tests. Using MSW to intercept Horizon API and contract calls at the network level makes tests more realistic and maintainable.

Requirements and context

- Install and configure msw for both Jest (Node) and Playwright (browser)
- Create handlers for: Horizon account/balance endpoint, Horizon transaction endpoint, Friendbot endpoint, CoinGecko price endpoint
- Create contract response fixtures for all key contract reads
- Replace function-level mocks in existing tests with MSW handlers
- Document how to add new MSW handlers in CONTRIBUTING.md

### Suggested execution
``git checkout -b test/msw-api-mocking``
- Install ``msw`` and configure for Node and browser
- Create ``src/mocks/`` directory with handlers and fixtures
Migrate 10+ existing tests to use MSW
Document in CONTRIBUTING.md
Example commit message
``test: set up MSW for realistic API mocking in Jest and Playwright``


