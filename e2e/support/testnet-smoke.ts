import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Routes exercised by the nightly live-testnet smoke run.
 *
 * The deployed site can lag behind this repository (see docs/troubleshooting.md).
 * Keeping the route list and the deployment classification in one place means the
 * smoke spec and the workflow preflight agree on what "stale" means.
 */
export interface SmokeRoute {
  name: string;
  path: string;
  headingPattern: RegExp;
}

export const smokeRoutes: SmokeRoute[] = [
  {
    name: 'home',
    path: '/',
    headingPattern: /invoice liquidity network|turn unpaid invoices|liquidity/i,
  },
  {
    name: 'marketplace',
    path: '/marketplace',
    headingPattern: /invoice marketplace|marketplace|browse|invoices/i,
  },
  { name: 'governance', path: '/governance', headingPattern: /governance|proposal/i },
  { name: 'stats', path: '/stats', headingPattern: /stats|protocol|analytics/i },
  {
    name: 'leaderboard',
    path: '/leaderboard',
    headingPattern: /leaderboard|ranking|top payers|top freelancers|top liquidity providers/i,
  },
  { name: 'analytics', path: '/analytics', headingPattern: /analytics|performance|stats/i },
];

export type RouteDeploymentStatus = 'ok' | 'stale-deployment' | 'failure';

/**
 * A 404 is only an infrastructure problem when the route actually exists in the
 * codebase. If the route was removed deliberately, a 404 is the expected result
 * and the spec should fail so the stale route list gets fixed.
 */
export function classifyRouteStatus(
  status: number | undefined,
  routeExistsInSource: boolean
): RouteDeploymentStatus {
  if (status !== undefined && status >= 200 && status < 400) return 'ok';
  if (status === 404 && routeExistsInSource) return 'stale-deployment';
  return 'failure';
}

/** True when this repo still ships a page for the given route path. */
export function routeExistsInSource(routePath: string, root: string = process.cwd()): boolean {
  const segments = routePath.split('/').filter(Boolean);
  const candidates = [
    path.join(root, 'app', ...segments, 'page.tsx'),
    path.join(root, 'src', 'app', ...segments, 'page.tsx'),
  ];
  return candidates.some((candidate) => existsSync(candidate));
}

export function staleDeploymentMessage(routePath: string): string {
  return (
    `${routePath} returned HTTP 404 from the live testnet deployment, but the route ` +
    `exists in this repository. The deployment is stale: redeploy the current branch ` +
    `in Vercel (see docs/troubleshooting.md).`
  );
}

export interface NavigablePage {
  goto(
    url: string,
    options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit' }
  ): Promise<any>;
  waitForTimeout(timeout: number): Promise<void>;
}

/**
 * The target is a live, independently deployed build. A transient 5xx from the
 * edge or an upstream RPC/indexer blip must not fail the whole nightly run, so
 * retry only the transport-level failures. A 404 is *not* retried: it means the
 * deployment is stale (the route exists in the code but not in that build),
 * which is surfaced via classifyRouteStatus.
 */
export async function gotoWithRetry<T = any>(
  page: NavigablePage,
  path: string,
  maxAttempts: number = 3
): Promise<T | null> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      if (
        !response ||
        (typeof response.status === 'function' && response.status() < 500) ||
        attempt === maxAttempts
      ) {
        return response as T;
      }
      lastError = new Error(`${path} returned HTTP ${response.status()}`);
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) throw error;
    }
    await page.waitForTimeout(1000 * attempt);
  }
  throw lastError;
}
