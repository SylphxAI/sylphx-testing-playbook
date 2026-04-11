# 26 — Fault Injection (Code-Level)

> Wrap every external call with a fault injector; toggle failures via feature flag to test retry/timeout logic deterministically.

**Category:** Critical for resilience
**Effort:** Low
**ROI:** High
**Maturity level:** 3

## What it catches

Bugs in error-handling paths that happy-path tests never exercise.

## Difference from chaos engineering

- **Chaos engineering** (method 09) = infrastructure-level failures (pod kill, network delay)
- **Fault injection** (this) = code-level failures (function throws, returns null, times out)

## How it works

```typescript
import { faultInject } from './test-utils/fault'

// Production code
async function fetchUser(id: string): Promise<User> {
  return faultInject('fetchUser', async () => {
    return await db.query.users.findFirst(...)
  })
}

// Test
test('retries on transient DB error', async () => {
  faultInject.force('fetchUser', {
    behavior: 'throw-once',
    error: new DatabaseError('connection reset'),
  })
  const user = await fetchUserWithRetry('u-1')
  expect(user).toBeDefined()  // second attempt succeeds
})
```

Alternatively:

```typescript
// Mock service with injected failures
const svc = makeMockK8sService({
  applyBehaviour: (_, i) => {
    if (i === 0) {
      const err = new Error('server error')
      err.statusCode = 500
      return err
    }
  },
})
```

## When to use

- **Retry logic** — verify backoff works
- **Circuit breakers** — verify they open at the right threshold
- **Timeout handling** — verify cleanup on timeout
- **Graceful degradation** — verify fallbacks trigger

## Further reading

- [Netflix — Failure Injection Testing](https://netflixtechblog.com/fit-failure-injection-testing-35d8e2a9bb2)
- [Case study — makeMockK8sService](../case-studies/sylphx-managed-resource-controller.md#mock-k8s-service)
