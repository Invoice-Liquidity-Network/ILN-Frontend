# GraphQL Query Guidelines

> Roadmap decision (2026-09-24): **deferred until after mainnet; no frontend adoption is approved for the near term.**

This document is retained as a decision record and future re-entry checklist. It does not authorize adding a GraphQL client, endpoint, query, or feature flag to the frontend before the roadmap is revisited.

## Current Status

As of this writing, the frontend uses REST API endpoints exclusively:

- `/api/stats` - Protocol statistics
- `/api/leaderboard` - Rankings and leaderboard data
- `/api/invoices` - Invoice listings for marketplace
- `/api/notifications` - User notification data
- Indexer REST endpoints for invoice events and protocol feed

GraphQL is not currently used by the frontend. The near-term product flows—invoice submission, invoice funding, governance, payments, notifications, and analytics—are served by REST, Soroban RPC, Horizon, Supabase, and indexer REST/WebSocket endpoints. No current mainnet milestone requires GraphQL's aggregation or schema capabilities. Adding it now would create a second data-access path, duplicate caching/error handling, and increase operational surface without a committed consumer.

The decision is therefore to defer GraphQL until after mainnet. Reconsideration requires a named product use case, an owning team, a versioned indexer schema, staging performance evidence, and a migration/rollback plan. Until those inputs exist, new work should use the existing REST/Soroban-RPC/Supabase patterns.

## Indexer Query Complexity Limits

The indexer implements query depth and complexity limiting for security hardening (Indexer Issue 84). When implementing GraphQL queries, stay well within these limits to prevent legitimate queries from being rejected.

### Recommended Frontend Limits

To ensure compatibility with indexer security controls, frontend queries should adhere to these conservative limits:

| Metric           | Frontend Limit            | Reasoning                                   |
| ---------------- | ------------------------- | ------------------------------------------- |
| Query Depth      | 5 levels                  | Leaves headroom for backend limit increases |
| Query Complexity | 1000 points               | Well under typical backend threshold        |
| Fields Per Level | 20 fields                 | Prevents overly broad selections            |
| List Result Size | 50 items default, 100 max | Encourages pagination                       |

## Query Optimization Best Practices

### 1. Field Selection

Only select fields actually needed for the UI:

```graphql
# Good: Minimal field selection
query GetInvoice($id: ID!) {
  invoice(id: $id) {
    id
    amount
    status
    dueDate
  }
}

# Bad: Selecting unnecessary fields increases complexity
query GetInvoice($id: ID!) {
  invoice(id: $id) {
    id
    amount
    status
    dueDate
    createdAt
    updatedAt
    metadata
    payer {
      address
      reputation
      history
    }
    # ... many more fields
  }
}
```

### 2. Pagination

Always use pagination for list queries:

```graphql
# Good: Cursor-based pagination
query GetInvoices($first: Int!, $after: String) {
  invoices(first: $first, after: $after) {
    edges {
      node {
        id
        amount
        status
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

# Bad: Unbounded list query
query GetInvoices {
  invoices {
    id
    amount
    status
  }
}
```

### 3. Nesting Depth

Limit nested relationship traversal to 3-5 levels:

```graphql
# Good: Shallow nesting
query GetInvoice($id: ID!) {
  invoice(id: $id) {
    id
    payer {
      address
      reputation
    }
  }
}

# Bad: Deep nesting increases complexity rapidly
query GetInvoice($id: ID!) {
  invoice(id: $id) {
    id
    payer {
      address
      reputation
      invoices {
        id
        freelancer {
          address
          invoices {
            # Too deep!
          }
        }
      }
    }
  }
}
```

### 4. Use Fragments for Reusability

```graphql
fragment InvoiceFields on Invoice {
  id
  amount
  status
  dueDate
}

query GetInvoices($first: Int!) {
  invoices(first: $first) {
    edges {
      node {
        ...InvoiceFields
      }
    }
  }
}
```

## Caching Strategy

Configure React Query appropriately for GraphQL queries:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      gcTime: 300000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Example usage
const { data } = useQuery({
  queryKey: ['invoices', filters],
  queryFn: () => fetchGraphQL(invoicesQuery, { filters }),
  staleTime: 15000, // Override for frequently changing data
});
```

## Error Handling

Handle complexity limit errors gracefully:

```typescript
async function executeGraphQLQuery(query: string, variables: any) {
  try {
    const response = await fetch(`${INDEXER_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      const complexityError = result.errors.find(
        (err: any) => err.extensions?.code === 'GRAPHQL_VALIDATION_FAILED'
      );

      if (complexityError) {
        // Log to Sentry
        console.error('Query complexity exceeded', {
          query,
          complexity: complexityError.extensions?.complexity,
          maxComplexity: complexityError.extensions?.maxComplexity,
        });

        // Fall back to REST API if available
        return fetchRestAPIFallback(variables);
      }

      throw new Error(result.errors[0].message);
    }

    return result.data;
  } catch (error) {
    // Handle network errors
    throw error;
  }
}
```

## Testing Requirements

Before deploying any GraphQL query:

1. **Unit Test**: Test query construction and variable handling
2. **Integration Test**: Verify query against actual indexer in staging
3. **Complexity Test**: Add test case to `__tests__/graphql-query-complexity-compatibility.test.ts`
4. **E2E Test**: Add scenario to `e2e/graphql-query-complexity-verification.spec.ts`
5. **Load Test**: Verify query performs well under realistic load

## Monitoring and Alerting

When GraphQL queries are implemented:

1. Add Sentry instrumentation for all GraphQL requests
2. Track query execution time in Sentry performance monitoring
3. Alert on complexity errors via monitoring pipeline
4. Add GraphQL query health to synthetic integration checks
5. Monitor cache hit rates for optimization opportunities

## Migration from REST to GraphQL

If migrating existing REST endpoints to GraphQL:

1. Implement GraphQL query alongside existing REST call
2. Feature flag to test GraphQL in production with small percentage
3. Compare results between REST and GraphQL for correctness
4. Monitor error rates and performance
5. Gradually increase GraphQL traffic percentage
6. Remove REST fallback only after GraphQL proven stable
7. Update documentation to reflect new data fetching pattern

## Scoped Initial Integration Target (Issue #931)

If active adoption of GraphQL is decided for the protocol, the initial integration must be strictly scoped to a single concrete use case to avoid unused infrastructure.

### 1. Concrete Data-Fetching Use Case

**Marketplace Activity & Aggregate Analytics Feed (`MarketplaceActivityFeed`)**

- **Problem with Existing Patterns**: Rendering the composite marketplace activity feed currently requires multiple REST and RPC calls (`/api/invoices`, `/api/payer-score`, and indexer event logs), leading to sequential network roundtrips, N+1 client-side joins, and over-fetching of unused metadata.
- **GraphQL Value Proposition**: GraphQL enables retrieving the composite entity graph (Invoice + Payer Reputation + Recent Event Logs) in a single optimized request with field-level selection, eliminating over-fetching and multi-request latency.

### 2. Scoped Integration Boundaries

- **Client Library Choice**: `@urql/core` or `graphql-request` lightweight fetcher integrated directly into TanStack Query (`src/hooks/queries/`). This preserves canonical React Query patterns (key factories in `src/hooks/queries/keys.ts` and `QUERY_TIMINGS`) while avoiding heavyweight Apollo Client dependencies.
- **Schema Shape**:
  ```graphql
  query GetMarketplaceActivityFeed($first: Int!, $after: String) {
    marketplaceActivity(first: $first, after: $after) {
      edges {
        node {
          id
          amount
          token
          status
          payer {
            address
            reputationScore
            riskTier
          }
          events(first: 5) {
            eventType
            timestamp
            transactionHash
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ```
- **Proof-of-Concept Target Component**: `src/components/marketplace/MarketplaceActivityFeed.tsx`.

### 3. Seed Implementation Issue

Actual implementation is explicitly out of scope for Issue #931. Implementation will be tracked under seed issue **#935** (*"Implement GraphQL Marketplace Activity Feed proof-of-concept"*).

## Cross-Reference

- **Architecture**: docs/architecture.md Backend Service Dependency Map
- **Monitoring**: docs/monitoring-runbook.md for synthetic check integration
- **Testing**: **tests**/graphql-query-complexity-compatibility.test.ts
- **E2E Tests**: e2e/graphql-query-complexity-verification.spec.ts
- **Indexer Limits**: Indexer repository Issue 84 for authoritative limit values

